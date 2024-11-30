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

// AddContact adiciona um novo contato ao usuário
func AddContact(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var req AddContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se o contato já existe
	var existingContact models.Contact
	if err := config.DB.Where("user_id = ? AND contact_id = ?", userID, req.ContactID).First(&existingContact).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Contato já existe"})
		return
	}

	// Iniciar transação
	tx := config.DB.Begin()

	// Adicionar contato
	contact := models.Contact{
		ID:        utils.GenerateUUID(),
		UserID:    userID,
		ContactID: req.ContactID,
		AddedAt:   time.Now(),
	}
	if err := tx.Create(&contact).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar contato"})
		return
	}

	// Criar conversa direta
	conversation := models.Conversation{
		ID:        utils.GenerateUUID(),
		Type:      "DIRECT",
		CreatedAt: time.Now(),
	}
	if err := tx.Create(&conversation).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar conversa direta"})
		return
	}

	// Adicionar participantes na conversa
	participants := []models.ConversationParticipant{
		{
			ID:             utils.GenerateUUID(),
			ConversationID: conversation.ID,
			UserID:         userID,
			JoinedAt:       time.Now(),
		},
		{
			ID:             utils.GenerateUUID(),
			ConversationID: conversation.ID,
			UserID:         req.ContactID,
			JoinedAt:       time.Now(),
		},
	}

	for _, participant := range participants {
		if err := tx.Create(&participant).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar participante na conversa"})
			return
		}
	}

	// Commit da transação
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao finalizar adição de contato"})
		return
	}

	// Opcional: Notificar usuários via WebSocket
	// Implementar lógica de notificação se necessário

	c.JSON(http.StatusCreated, gin.H{"message": "Contato adicionado com sucesso e conversa criada"})
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