package controllers

import (
	"encoding/json"
	"net/http"
	"time"

	"server/config"
	"server/models"
	"server/services"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// RegisterRequest representa a payload para registro de usuário
type RegisterRequest struct {
	Username            string         `json:"username" binding:"required,alphanum"`
	Password            string         `json:"password" binding:"required"`
	EncryptedPrivateKey string         `json:"encrypted_private_key" binding:"required"`
	PublicKey           interface{}    `json:"public_key" binding:"required"`
}

// RegisterUser lida com o registro de novos usuários
func RegisterUser(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Converter a chave pública para JSON string
	publicKeyJSON, err := json.Marshal(req.PublicKey)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato inválido da chave pública"})
		return
	}

	// Verificar se o usuário já existe
	var existingUser models.User
	result := config.DB.Where("username = ?", req.Username).First(&existingUser)
	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Usuário já existe"})
		return
	}

	// Hashear a senha utilizando bcrypt
	hashedPassword, err := services.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar a senha"})
		return
	}

	// Criar o usuário
	user := models.User{
		ID:                  utils.GenerateUUID(),
		Username:            req.Username,
		PasswordHash:        hashedPassword,
		EncryptedPrivateKey: req.EncryptedPrivateKey,
		PublicKey:           string(publicKeyJSON),
		CreatedAt:           time.Now(),
		LastSeen:            time.Now(),
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar usuário"})
		return
	}

	// Gerar token JWT para login automático após registro
	token, err := services.GenerateJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Usuário registrado com sucesso",
		"token": token,
		"id": user.ID,
		"username": user.Username,
	})
}

// LoginRequest representa a payload para login de usuário
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginUser lida com o login de usuários
func LoginUser(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Buscar o usuário pelo nome de usuário
	var user models.User
	result := config.DB.Where("username = ?", req.Username).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}

	// Verificar a senha utilizando bcrypt
	if err := services.CheckPasswordHash(req.Password, user.PasswordHash); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}

	// Gerar o token JWT
	token, err := services.GenerateJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login bem-sucedido",
		"token": token,
		"encrypted_private_key": user.EncryptedPrivateKey,
		"id": user.ID,
		"username": user.Username,
	})
}

// UpdateKeysRequest representa a payload para atualizar as chaves do usuário
type UpdateKeysRequest struct {
	EncryptedPrivateKey string        `json:"encrypted_private_key" binding:"required"`
	PublicKey           models.PublicKeyData `json:"public_key" binding:"required"`
}

// UpdateKeys atualiza as chaves do usuário
func UpdateKeys(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var req UpdateKeysRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Atualizar as chaves no banco de dados
	if err := config.DB.Model(&models.User{}).
		Where("id = ?", userID).
		Updates(map[string]interface{}{
			"encrypted_private_key": req.EncryptedPrivateKey,
			"public_key":           req.PublicKey,
		}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar chaves"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Chaves atualizadas com sucesso"})
}

// GetPublicKey retorna a chave pública de um usuário
func GetPublicKey(c *gin.Context) {
	targetUserID := c.Param("id")
	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do usuário é obrigatório"})
		return
	}

	var user models.User
	if err := config.DB.Select("public_key").First(&user, "id = ?", targetUserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Parse o JSON string para um map antes de enviar
	var publicKey interface{}
	if err := json.Unmarshal([]byte(user.PublicKey), &publicKey); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar chave pública"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"public_key": publicKey})
}