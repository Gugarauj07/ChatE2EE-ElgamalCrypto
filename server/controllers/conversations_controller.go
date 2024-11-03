package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"server/config"
	"server/models"
	"server/utils"
)

// ListConversations lista todas as conversas do usuário
func ListConversations(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var conversations []models.Conversation
	if err := config.DB.
		Joins("JOIN conversations_users ON conversations_users.conversation_id = conversations.id").
		Where("conversations_users.user_id = ?", userID).
		Find(&conversations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar conversas"})
		return
	}

	c.JSON(http.StatusOK, conversations)
}

// CreateConversationRequest representa a payload para criar uma conversa
type CreateConversationRequest struct {
	Type          string `json:"type" binding:"required,oneof=individual group"`
	RecipientID   string `json:"recipient_id" binding:"required_if=Type individual"`
	GroupName     string `json:"group_name" binding:"required_if=Type group"`
	ParticipantIDs []string `json:"participant_ids" binding:"required_if=Type group"`
}

// CreateConversation cria uma nova conversa
func CreateConversation(c *gin.Context) {
	// userID, err := utils.GetUserIDFromContext(c)
	// if err != nil {
	// 	c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
	// 	return
	// }

	var req CreateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conversation := models.Conversation{
		ID:        utils.GenerateUUID(),
		Type:      req.Type,
		CreatedAt: time.Now(),
	}

	if req.Type == "individual" {
		conversation.GroupID = nil
		// Adicionar participantes individuais
		// Aqui você pode implementar a lógica para adicionar os participantes
	} else if req.Type == "group" {
		// Implementar a lógica para criar grupos
		// Por exemplo, gerar sender key, criptografar, etc.
	}

	// Criar a conversa no banco de dados
	if err := config.DB.Create(&conversation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar conversa"})
		return
	}

	c.JSON(http.StatusCreated, conversation)
}

// GetMessages retorna as mensagens de uma conversa específica
func GetMessages(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	conversationID := c.Param("id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID da conversa é obrigatório"})
		return
	}

	// Verificar se o usuário participa da conversa
	var conversation models.Conversation
	if err := config.DB.
		Joins("JOIN conversations_users ON conversations_users.conversation_id = conversations.id").
		Where("conversations.id = ? AND conversations_users.user_id = ?", conversationID, userID).
		First(&conversation).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversa não encontrada"})
		return
	}

	// Buscar as mensagens da conversa
	var messages []models.Message
	if err := config.DB.Where("conversation_id = ?", conversationID).Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar mensagens"})
		return
	}

	c.JSON(http.StatusOK, messages)
}

// SendMessageRequest representa a payload para enviar uma mensagem
type SendMessageRequest struct {
	Content string `json:"content" binding:"required"`
}

// SendMessage envia uma nova mensagem em uma conversa
func SendMessage(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	conversationID := c.Param("id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID da conversa é obrigatório"})
		return
	}

	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se o usuário participa da conversa
	var conversation models.Conversation
	if err := config.DB.
		Joins("JOIN conversations_users ON conversations_users.conversation_id = conversations.id").
		Where("conversations.id = ? AND conversations_users.user_id = ?", conversationID, userID).
		First(&conversation).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversa não encontrada"})
		return
	}

	// Implementar a lógica de criptografia da mensagem aqui
	// Por exemplo, criptografar o conteúdo usando a chave de conversa

	encryptedContent := []byte(req.Content) // Placeholder para a mensagem criptografada

	message := models.Message{
		ID:               utils.GenerateUUID(),
		ConversationID:   conversationID,
		SenderID:         userID,
		EncryptedContent: encryptedContent,
		CreatedAt:        time.Now(),
		IsDelivered:      false, // Inicialmente não entregue
	}

	if err := config.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao enviar mensagem"})
		return
	}

	c.JSON(http.StatusCreated, message)
}