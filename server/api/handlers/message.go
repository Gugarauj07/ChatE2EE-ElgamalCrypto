package handlers

import (
	"net/http"
	"server/db"
	"server/models"
	"time"

	"github.com/gin-gonic/gin"
)

// SendMessageRequest representa a requisição para enviar uma mensagem
type SendMessageRequest struct {
	RecipientId      string         `json:"recipientId" binding:"required"`
	EncryptedContent models.EncryptedMessage `json:"encryptedContent" binding:"required"`
}

// SendMessageHandler trata o envio de mensagens
func SendMessageHandler(c *gin.Context) {
	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Criar nova mensagem
	message := models.ChatMessage{
		SenderId:           c.GetString("userId"), // Assumindo que o userId está no contexto
		RecipientId:        req.RecipientId,
		EncryptedContent:   req.EncryptedContent,
		Timestamp:          time.Now(),
	}

	if err := db.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao enviar mensagem"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Mensagem enviada com sucesso"})
}

// GetMessagesHandler trata o recebimento de mensagens para um usuário específico
func GetMessagesHandler(c *gin.Context) {
	userId := c.GetString("userId") // Assumindo que o userId está no contexto

	var messages []models.ChatMessage
	if err := db.DB.Where("recipient_id = ?", userId).Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar mensagens"})
		return
	}

	c.JSON(http.StatusOK, messages)
}

