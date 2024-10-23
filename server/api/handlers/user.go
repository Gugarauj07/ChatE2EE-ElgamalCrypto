package handlers

import (
	"net/http"

	"server/db"
	"server/models"

	"github.com/gin-gonic/gin"
)

// GetUserHandler obtém os detalhes de um usuário específico
func GetUserHandler(c *gin.Context) {
	userId := c.Param("userId")

	var user models.User
	if err := db.DB.Where("user_id = ?", userId).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Retornar apenas informações relevantes
	c.JSON(http.StatusOK, gin.H{
		"userId":    user.UserId,
		"username":  user.Username,
		"publicKey": user.PublicKey,
	})
}

// UpdateUserHandler atualiza informações de um usuário
func UpdateUserHandler(c *gin.Context) {
	userId := c.Param("userId")

	var user models.User
	if err := db.DB.Where("user_id = ?", userId).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	var req struct {
		Username string `json:"username"`
		// Adicione outros campos que deseja permitir atualizar
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	if req.Username != "" {
		user.Username = req.Username
	}

	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar usuário"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuário atualizado com sucesso"})
}