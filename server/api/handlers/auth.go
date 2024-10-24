package handlers

import (
	"net/http"
	"time"
	"fmt"

	"server/db"
	"server/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"github.com/golang-jwt/jwt/v4"
)

// Chave secreta para assinar os tokens JWT
var jwtSecret = []byte("SeCrETa") // Substitua por uma chave segura em produção


type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}


type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// TokenResponse representa a resposta com o token JWT
type TokenResponse struct {
	Token string `json:"token"`
}

// RegisterRequest representa a requisição de registro
// @Description Representa a requisição de registro
// @Tags Autenticação
// @Accept json
// @Produce json
// @Param user body RegisterRequest true "Dados do usuário"
// @Success 201 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router api/register [post]
func RegisterHandler(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Verificar se o usuário já existe
	var existingUser models.User
	if err := db.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Usuário já existe"})
		return
	}

	// Hash da senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar senha"})
		return
	}

	// Criar novo usuário
	user := models.User{
		UserId:       generateUserID(), // Função para gerar um ID único, pode ser UUID
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		PublicKey:    models.PublicKey{},
		LastActivity: time.Now(),
	}

	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar usuário"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Usuário registrado com sucesso"})
}

// LoginRequest representa a requisição de login
// @Description Representa a requisição de login
// @Tags Autenticação
// @Accept json
// @Produce json
// @Param user body LoginRequest true "Dados do usuário"
// @Success 200 {object} TokenResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router api/login [post]
func LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Buscar usuário pelo username
	var user models.User
	if err := db.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}

	// Verificar senha
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}

	// Gerar token JWT
	token, err := generateJWT(user.UserId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar token"})
		return
	}

	c.JSON(http.StatusOK, TokenResponse{Token: token})
}

// generateJWT gera um token JWT para um usuário
func generateJWT(userID string) (string, error) {
	// Define as claims
	claims := jwt.MapClaims{
		"userId": userID,
		"exp":    time.Now().Add(time.Hour * 72).Unix(), // Expira em 72 horas
	}

	// Cria o token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Assina o token e retorna
	return token.SignedString(jwtSecret)
}

// generateUserID gera um ID único para um usuário
func generateUserID() string {
	// Em uma aplicação real, considere usar UUIDs
	return fmt.Sprintf("user_%d", time.Now().UnixNano())
}
