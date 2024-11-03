package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"server/config"
	"server/models"
	"server/utils"
)

// ListContacts retorna a lista de contatos do usuário
func ListContacts(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var contacts []models.Contact
	if err := config.DB.Where("user_id = ?", userID).Find(&contacts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar contatos"})
		return
	}

	c.JSON(http.StatusOK, contacts)
}

// AddContactRequest representa a payload para adicionar um contato
type AddContactRequest struct {
	ContactUsername string `json:"contact_username" binding:"required,alphanum"`
	Nickname        string `json:"nickname" binding:"required"`
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

	// Verificar se já é contato
	var existingContact models.Contact
	if err := config.DB.Where("user_id = ? AND contact_id = ?", userID, contactUser.ID).First(&existingContact).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Contato já existe"})
		return
	}

	// Adicionar o contato
	contact := models.Contact{
		UserID:    userID,
		ContactID: contactUser.ID,
		Nickname:  req.Nickname,
		AddedAt:   time.Now(),
	}

	if err := config.DB.Create(&contact).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar contato"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Contato adicionado com sucesso"})
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
	if err := config.DB.Where("user_id = ? AND contact_id = ?", userID, contactID).First(&contact).Error; err != nil {
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