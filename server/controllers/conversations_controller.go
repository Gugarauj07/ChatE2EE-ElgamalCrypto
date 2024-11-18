package controllers

import (
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
		Joins("JOIN conversation_participants ON conversation_participants.conversation_id = conversations.id").
		Where("conversation_participants.user_id = ?", userID).
		Find(&conversations).Error; err != nil {
		c.JSON(http.StatusOK, []gin.H{})
		return
	}

	// Para cada conversa, obter a chave criptografada do usuário
	var response []map[string]interface{}
	for _, convo := range conversations {
		var convoParticipant models.ConversationParticipant
		if err := config.DB.Where("conversation_id = ? AND user_id = ?", convo.ID, userID).First(&convoParticipant).Error; err != nil {
			continue // Ignorar se não encontrar
		}

		convoMap := map[string]interface{}{
			"id":             convo.ID,
			"created_at":     convo.CreatedAt,
			"group_id":       convo.GroupID,
			"encrypted_key":  convoParticipant.EncryptedKey,
			"participants":   convo.Participants,
			"messages_count": len(convo.Messages),
		}

		response = append(response, convoMap)
	}

	c.JSON(http.StatusOK, response)
}

// CreateConversationRequest representa a payload para criar uma conversa
type CreateConversationRequest struct {
	ParticipantIDs []string           `json:"ParticipantIDs" binding:"required"`
	EncryptedKeys  models.EncryptedKeyMap `json:"EncryptedKeys" binding:"required"` // Chave por UserID
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

	// Verificar se EncryptedKeys contém todos os participantes
	for _, pid := range participantIDs {
		if _, exists := req.EncryptedKeys[pid]; !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Chave criptografada faltando para algum participante"})
			return
		}
	}

	// Validar formato das chaves criptografadas
	for _, key := range req.EncryptedKeys {
		if key.A == "" || key.B == "" || key.P == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Chave criptografada inválida para algum participante"})
			return
		}

		// Opcional: Adicionar validações adicionais para os campos A, B e P
	}

	// Criar a conversa
	conversation := models.Conversation{
		ID:            utils.GenerateUUID(),
		CreatedAt:     time.Now(),
		EncryptedKeys: req.EncryptedKeys,
	}

	if err := config.DB.Create(&conversation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar conversa"})
		return
	}

	// Criar ConversationParticipant para cada participante com as chaves criptografadas enviadas pelo cliente
	for _, pid := range participantIDs {
		encryptedKey := req.EncryptedKeys[pid]

		conversationParticipant := models.ConversationParticipant{
			ID:             utils.GenerateUUID(),
			ConversationID: conversation.ID,
			UserID:         pid,
			EncryptedKey:   encryptedKey,
			JoinedAt:       time.Now(),
		}

		if err := config.DB.Create(&conversationParticipant).Error; err != nil {
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
		Joins("JOIN conversation_participants ON conversation_participants.conversation_id = conversations.id").
		Where("conversations.id = ? AND conversation_participants.user_id = ?", conversationID, userID).
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
		Joins("JOIN conversation_participants ON conversation_participants.conversation_id = conversations.id").
		Where("conversations.id = ? AND conversation_participants.user_id = ?", conversationID, userID).
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