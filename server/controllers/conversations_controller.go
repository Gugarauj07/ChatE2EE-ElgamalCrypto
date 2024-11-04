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
	Type            string   `json:"type" binding:"required,oneof=individual group"`
	RecipientID     string   `json:"recipient_id" binding:"required_if=Type individual"`
	GroupName       string   `json:"group_name" binding:"required_if=Type group"`
	ParticipantIDs  []string `json:"participant_ids" binding:"required_if=Type group"`
	SenderKey       []byte   `json:"sender_key" binding:"required_if=Type group"`
}

// CreateConversation cria uma nova conversa
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

	conversation := models.Conversation{
		ID:        utils.GenerateUUID(),
		Type:      req.Type,
		CreatedAt: time.Now(),
	}

	if req.Type == "individual" {
		// Buscar o destinatário
		var recipient models.User
		if err := config.DB.First(&recipient, "id = ?", req.RecipientID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Usuário destinatário não encontrado"})
			return
		}

		// Gerar chave de conversa (AES-256)
		conversationKey, err := utils.GenerateAES256Key()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar chave de conversa"})
			return
		}

		// Criptografar a chave de conversa com as chaves públicas dos participantes
		encryptedKeyUser, err := utils.EncryptWithElGamal(recipient.PublicKey, conversationKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criptografar chave de conversa para o destinatário"})
			return
		}

		// Supondo que o administrador (userID) também tenha uma chave pública
		var user models.User
		if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Usuário não encontrado"})
			return
		}

		encryptedKeyAdmin, err := utils.EncryptWithElGamal(user.PublicKey, conversationKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criptografar chave de conversa para o administrador"})
			return
		}

		// Concatenar as chaves criptografadas (poderia ser armazenado de forma mais estruturada)
		conversation.EncryptedKey = append(encryptedKeyUser, encryptedKeyAdmin...)

		// Adicionar participantes
		conversation.Participating = []models.User{recipient, user}
	} else if req.Type == "group" {
		// Implementar a lógica para criar grupos

		// Criar o grupo
		group := models.Group{
			ID:        utils.GenerateUUID(),
			Name:      req.GroupName,
			SenderKey: req.SenderKey,
			AdminID:   userID,
			CreatedAt: time.Now(),
		}

		if err := config.DB.Create(&group).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar grupo"})
			return
		}

		conversation.GroupID = &group.ID

		// Adicionar o grupo à conversa
		// Relacionar participantes
		participants := []models.User{}
		for _, pid := range req.ParticipantIDs {
			var participant models.User
			if err := config.DB.First(&participant, "id = ?", pid).Error; err != nil {
				continue // Ignorar se o usuário não for encontrado
			}
			participants = append(participants, participant)
		}

		// Adicionar o próprio usuário como participante
		var user models.User
		if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Usuário não encontrado"})
			return
		}
		participants = append(participants, user)

		conversation.Participating = participants
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