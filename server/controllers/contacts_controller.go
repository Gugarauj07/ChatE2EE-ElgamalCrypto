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
	ContactUsername string `json:"contact_username" binding:"required,alphanum"`
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

	// Buscar o usuário pelo username fornecido
	var contactUser models.User
	if err := config.DB.Where("username = ?", req.ContactUsername).First(&contactUser).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Verificar se o usuário está tentando adicionar a si mesmo
	if contactUser.ID == userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Você não pode adicionar a si mesmo como contato"})
		return
	}

	// Verificar se já é contato
	var existingContact models.Contact
	if err := config.DB.Where("user_id = ? AND contact_id = ?", userID, contactUser.ID).First(&existingContact).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Contato já existe"})
		return
	}

	// Adicionar o contato
	contact := models.Contact{
		ID:        utils.GenerateUUID(),
		UserID:    userID,
		ContactID: contactUser.ID,
		AddedAt:   time.Now(),
	}

	if err := config.DB.Create(&contact).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar contato"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":         contact.ID,
		"username":   contactUser.Username,
		"added_at":   contact.AddedAt,
		"publicKey": contactUser.PublicKey,
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