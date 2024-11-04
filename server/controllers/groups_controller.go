package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"server/models"
	"server/utils"
	"server/config"
)

// CreateGroupRequest atualizado
type CreateGroupRequest struct {
	Name           string            `json:"name" binding:"required"`
	ParticipantIDs []string          `json:"participant_ids" binding:"required"`
	SenderKeys     map[string][]byte `json:"sender_keys" binding:"required"` // Chave por UserID
}

func CreateGroup(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var req CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	group := models.Group{
		ID:        utils.GenerateUUID(),
		Name:      req.Name,
		SenderKey: nil, // SenderKey agora está associada a cada membro
		AdminID:   userID,
		CreatedAt: time.Now(),
	}

	if err := config.DB.Create(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar grupo"})
		return
	}

	// Adicionar o administrador como membro com a sender key criptografada
	adminSenderKey, exists := req.SenderKeys[userID]
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sender key criptografada para o administrador é obrigatória"})
		return
	}

	adminMember := models.GroupMember{
		ID:                 utils.GenerateUUID(),
		GroupID:            group.ID,
		UserID:             userID,
		EncryptedSenderKey: adminSenderKey,
		JoinedAt:           time.Now(),
	}

	if err := config.DB.Create(&adminMember).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar administrador ao grupo"})
		return
	}

	// Adicionar outros participantes com suas sender keys criptografadas
	for _, participantID := range req.ParticipantIDs {
		senderKey, exists := req.SenderKeys[participantID]
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Sender key criptografada faltando para algum participante"})
			return
		}

		member := models.GroupMember{
			ID:                 utils.GenerateUUID(),
			GroupID:            group.ID,
			UserID:             participantID,
			EncryptedSenderKey: senderKey,
			JoinedAt:           time.Now(),
		}

		if err := config.DB.Create(&member).Error; err != nil {
			// Opcional: Trate erros específicos ou registre logs
			continue
		}
	}

	c.JSON(http.StatusCreated, group)
}

// ListGroups lista todos os grupos do usuário
func ListGroups(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var groups []models.Group
	if err := config.DB.Joins("JOIN group_members ON group_members.group_id = groups.id").
		Where("group_members.user_id = ?", userID).Find(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar grupos"})
		return
	}

	c.JSON(http.StatusOK, groups)
}