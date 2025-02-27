package controllers

import (
	"net/http"
	"time"

	"server/config"
	"server/models"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// ListContacts retorna a lista de contatos do usuário
func ListContacts(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	search := c.Query("search")

	query := config.DB.Where("user_id = ?", userID).Preload("Contact")

	if search != "" {
		query = query.Joins("JOIN users ON contacts.contact_id = users.id").
			Where("users.username LIKE ?", "%"+search+"%")
	}

	var contacts []models.Contact
	if err := query.Find(&contacts).Error; err != nil {
		c.JSON(http.StatusOK, []gin.H{})
		return
	}

	response := make([]gin.H, 0)
	for _, contact := range contacts {
		response = append(response, gin.H{
			"id":         contact.ID,
			"username":   contact.Contact.Username,
			"added_at":   contact.AddedAt,
			"publicKey": contact.Contact.PublicKey,
		})
	}

	c.JSON(http.StatusOK, response)
}

// AddContactRequest representa a payload para adicionar um contato
type AddContactRequest struct {
	ContactID string `json:"contact_id" binding:"required"`
}

// AddContact adiciona um contato para o usuário autenticado
func AddContact(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var req struct {
		ContactID string `json:"contactId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se o contato existe
	var contact models.User
	if err := config.DB.First(&contact, "id = ?", req.ContactID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Verificar se já é um contato
	var existingContact models.Contact
	result := config.DB.Where("user_id = ? AND contact_id = ?", userID, req.ContactID).First(&existingContact)
	if result.RowsAffected > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Contato já adicionado"})
		return
	}

	// Adicionar contato
	newContact := models.Contact{
		UserID:    userID,
		ContactID: req.ContactID,
		AddedAt:   time.Now(),
	}

	if err := config.DB.Create(&newContact).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar contato"})
		return
	}

	// Verificar se já existe uma conversa entre os usuários
	var conversation models.Conversation
	err = config.DB.
		Joins("JOIN conversation_participants cp1 ON cp1.conversation_id = conversations.id AND cp1.user_id = ?", userID).
		Joins("JOIN conversation_participants cp2 ON cp2.conversation_id = conversations.id AND cp2.user_id = ?", req.ContactID).
		Where("conversations.type = 'DIRECT'").
		First(&conversation).Error

	// Se não existir, criar uma nova conversa
	if err != nil {
		// Criar conversa
		conversation = models.Conversation{
			ID:        utils.GenerateUUID(),
			Type:      "DIRECT",
			CreatedAt: time.Now(),
		}

		if err := config.DB.Create(&conversation).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar conversa"})
			return
		}

		// Adicionar participantes
		participants := []models.ConversationParticipant{
			{
				ConversationID: conversation.ID,
				UserID:         userID,
				JoinedAt:       time.Now(),
			},
			{
				ConversationID: conversation.ID,
				UserID:         req.ContactID,
				JoinedAt:       time.Now(),
			},
		}

		if err := config.DB.Create(&participants).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar participantes"})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Contato adicionado com sucesso",
		"conversationId": conversation.ID,
	})
}

// RemoveContact remove um contato do usuário
func RemoveContact(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	contactID := c.Param("id")
	if contactID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do contato é obrigatório"})
		return
	}

	// Verificar se o contato existe
	var contact models.Contact
	if err := config.DB.Where("user_id = ? AND id = ?", userID, contactID).First(&contact).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contato não encontrado"})
		return
	}

	// Remover o contato
	if err := config.DB.Delete(&contact).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover contato"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contato removido com sucesso"})
}

// SearchUsers busca usuários pelo nome de usuário
func SearchUsers(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parâmetro de busca é obrigatório"})
		return
	}

	var users []models.User
	if err := config.DB.
		Where("username LIKE ? AND id != ?", "%"+query+"%", userID).
		Select("id, username, public_key").
		Limit(10).
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuários"})
		return
	}

	response := make([]gin.H, 0)
	for _, user := range users {
		response = append(response, gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"publicKey": user.PublicKey,
		})
	}

	c.JSON(http.StatusOK, response)
}