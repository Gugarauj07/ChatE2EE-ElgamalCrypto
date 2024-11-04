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
	Name           string   `json:"name" binding:"required"`
	ParticipantIDs []string `json:"participant_ids" binding:"required"`
	SenderKey      []byte   `json:"sender_key" binding:"required"` // Sender key gerada pelo cliente
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
		SenderKey: req.SenderKey, // Armazena a sender key fornecida pelo cliente
		AdminID:   userID,
		CreatedAt: time.Now(),
	}

	if err := config.DB.Create(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar grupo"})
		return
	}

	// Adicionar o administrador como membro
	groupMember := models.GroupMember{
		GroupID:  group.ID,
		UserID:   userID,
		JoinedAt: time.Now(),
	}

	if err := config.DB.Create(&groupMember).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar administrador ao grupo"})
		return
	}

	// Adicionar outros participantes
	for _, participantID := range req.ParticipantIDs {
		member := models.GroupMember{
			GroupID:  group.ID,
			UserID:   participantID,
			JoinedAt: time.Now(),
		}

		if err := config.DB.Create(&member).Error; err != nil {
			continue
		}
	}

	c.JSON(http.StatusCreated, group)
}

// AddGroupMemberRequest atualizado
type AddGroupMemberRequest struct {
	UserID string `json:"user_id" binding:"required"`
}

func AddGroupMember(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	groupID := c.Param("id")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do grupo é obrigatório"})
		return
	}

	var req AddGroupMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se o usuário é admin do grupo
	var group models.Group
	if err := config.DB.First(&group, "id = ? AND admin_id = ?", groupID, userID).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Somente o administrador pode adicionar membros"})
		return
	}

	// Adicionar o novo membro
	member := models.GroupMember{
		GroupID:  groupID,
		UserID:   req.UserID,
		JoinedAt: time.Now(),
	}

	if err := config.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar membro"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Membro adicionado com sucesso"})
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

// RemoveGroupMember remove um membro de um grupo
func RemoveGroupMember(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	groupID := c.Param("id")
	memberID := c.Param("user_id")

	if groupID == "" || memberID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "IDs do grupo e do membro são obrigatórios"})
		return
	}

	// Verificar se o usuário é admin do grupo
	var group models.Group
	if err := config.DB.First(&group, "id = ? AND admin_id = ?", groupID, userID).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Somente o administrador pode remover membros"})
		return
	}

	// Verificar se o membro existe
	var member models.GroupMember
	if err := config.DB.Where("group_id = ? AND user_id = ?", groupID, memberID).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Membro não encontrado no grupo"})
		return
	}

	// Remover o membro do grupo
	if err := config.DB.Delete(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover membro"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Membro removido com sucesso"})
}