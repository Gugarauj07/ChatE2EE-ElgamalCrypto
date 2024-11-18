package controllers

import (
	"encoding/base64"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"server/config"
	"server/models"
	"server/utils"
)

// ListConversations lista todas as conversas do usuário com suas chaves criptografadas
func ListConversations(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var conversations []models.Conversation
	if err := config.DB.
		Joins("JOIN conversation_users ON conversation_users.conversation_id = conversations.id").
		Where("conversation_users.user_id = ?", userID).
		Find(&conversations).Error; err != nil {
		c.JSON(http.StatusOK, []gin.H{})
		return
	}

	// Para cada conversa, obter a chave criptografada do usuário
	var response []map[string]interface{}
	for _, convo := range conversations {
		var convoUser models.ConversationUser
		if err := config.DB.Where("conversation_id = ? AND user_id = ?", convo.ID, userID).First(&convoUser).Error; err != nil {
			continue // Ignorar se não encontrar
		}

		// Codificar a chave criptografada em base64
		encryptedKeyStr := base64.StdEncoding.EncodeToString(convoUser.EncryptedKey)

		convoMap := map[string]interface{}{
			"id":             convo.ID,
			"created_at":     convo.CreatedAt,
			"group_id":       convo.GroupID,
			"encrypted_key":  encryptedKeyStr,
			"participants":   convo.Participating,
			"messages_count": len(convo.Messages),
		}

		response = append(response, convoMap)
	}

	c.JSON(http.StatusOK, response)
}

// CreateConversationRequest representa a payload para criar uma conversa
type CreateConversationRequest struct {
	ParticipantIDs []string            `json:"ParticipantIDs" binding:"required"`
	EncryptedKeys  map[string]string  `json:"EncryptedKeys" binding:"required"` // Chave por UserID
}

// CreateConversation cria uma nova conversa recebendo participantes e chaves criptografadas do cliente
func CreateConversation(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var req CreateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Garantir que pelo menos um participante além do criador seja especificado
	if len(req.ParticipantIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "É obrigatório adicionar pelo menos um participante"})
		return
	}

	// Adicionar o próprio usuário à lista de participantes
	participantIDs := append(req.ParticipantIDs, userID)

	// Criar a conversa
	conversation := models.Conversation{
		ID:        utils.GenerateUUID(),
		CreatedAt: time.Now(),
	}

	if err := config.DB.Create(&conversation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar conversa"})
		return
	}

	// Criar ConversationUser para cada participante com as chaves criptografadas enviadas pelo cliente
	for _, pid := range participantIDs {
		encryptedKeyStr, exists := req.EncryptedKeys[pid]
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Chave criptografada faltando para algum participante"})
			return
		}

		// Decodificar a chave criptografada de base64 para []byte
		encryptedKey, err := base64.StdEncoding.DecodeString(encryptedKeyStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Chave criptografada inválida para algum participante"})
			return
		}

		conversationUser := models.ConversationUser{
			ID:             utils.GenerateUUID(),
			ConversationID: conversation.ID,
			UserID:         pid,
			EncryptedKey:   encryptedKey,
			JoinedAt:       time.Now(),
		}

		if err := config.DB.Create(&conversationUser).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao associar participante à conversa"})
			return
		}
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
		c.JSON(http.StatusOK, []models.Message{})
		return
	}

	c.JSON(http.StatusOK, messages)
}

// SendMessageRequest representa a payload para enviar uma mensagem
type SendMessageRequest struct {
	Content []byte `json:"content" binding:"required"` // Conteúdo criptografado
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
		Joins("JOIN conversation_users ON conversation_users.conversation_id = conversations.id").
		Where("conversations.id = ? AND conversation_users.user_id = ?", conversationID, userID).
		First(&conversation).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversa não encontrada"})
		return
	}

	encryptedContent := req.Content // Conteúdo criptografado

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

	// Criar uma mensagem para o Hub
	WSHub.Broadcast <- Message{
		Content:        string(encryptedContent),
		ConversationID: conversationID,
		SenderID:       userID,
	}

	c.JSON(http.StatusCreated, message)
}