package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"server/config"
	"server/models"
	"server/utils"
)

func GetUserProfile(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id": user.ID,
		"username": user.Username,
		"created_at": user.CreatedAt,
		"last_seen": user.LastSeen,
	})
}

// UpdateUserProfileRequest representa a payload para atualizar o perfil do usuário
type UpdateUserProfileRequest struct {
	Username string `json:"username" binding:"omitempty,alphanum"`
	// Adicione outros campos que podem ser atualizados, se necessário
}

// UpdateUserProfile lida com a atualização do perfil do usuário
func UpdateUserProfile(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var req UpdateUserProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Buscar o usuário no banco de dados
	var user models.User
	if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Atualizar os campos permitidos
	if req.Username != "" {
		user.Username = req.Username
	}

	// Atualizar o campo LastSeen
	user.LastSeen = time.Now()

	// Salvar as alterações no banco de dados
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar perfil"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Perfil atualizado com sucesso"})
} 