package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"server/config"
	"server/models"
	"server/utils"
)

// CreateGroupRequest representa a payload para criar um grupo
type CreateGroupRequest struct {
	Name           string   `json:"name" binding:"required"`
	ParticipantIDs []string `json:"participant_ids" binding:"required"`
}

// CreateGroup cria um novo grupo
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

	// Gerar Sender Key (simplesmente um placeholder aqui)
	senderKey := []byte("sender_key_placeholder") // Implementar geração real com AES-256

	group := models.Group{
		ID:        utils.GenerateUUID(),
		Name:      req.Name,
		SenderKey: senderKey,
		AdminID:   userID,
		CreatedAt: time.Now(),
	}

	// Criar o grupo no banco de dados
	if err := config.DB.Create(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar grupo"})
		return
	}

	// Adicionar o administrador como membro do grupo
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
		// Verificar se o participante existe
		var user models.User
		if err := config.DB.First(&user, "id = ?", participantID).Error; err != nil {
			continue // Ignorar usuários inexistentes
		}

		member := models.GroupMember{
			GroupID:  group.ID,
			UserID:   participantID,
			JoinedAt: time.Now(),
		}

		if err := config.DB.Create(&member).Error; err != nil {
			continue // Ignorar erros ao adicionar membros
		}

		// Aqui você pode implementar a lógica para criptografar e enviar a Sender Key para os novos membros
	}

	c.JSON(http.StatusCreated, group)
}

// ListGroups lista todos os grupos que o usuário participa
func ListGroups(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var groups []models.Group
	if err := config.DB.
		Joins("JOIN group_members ON group_members.group_id = groups.id").
		Where("group_members.user_id = ?", userID).
		Find(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar grupos"})
		return
	}

	c.JSON(http.StatusOK, groups)
}

// AddGroupMemberRequest representa a payload para adicionar um membro ao grupo
type AddGroupMemberRequest struct {
	UserID string `json:"user_id" binding:"required"`
}

// AddGroupMember adiciona um novo membro a um grupo
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

	// Verificar se o usuário a ser adicionado existe
	var user models.User
	if err := config.DB.First(&user, "id = ?", req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Verificar se o usuário já é membro
	var existingMember models.GroupMember
	if err := config.DB.Where("group_id = ? AND user_id = ?", groupID, req.UserID).First(&existingMember).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Usuário já é membro do grupo"})
		return
	}

	// Adicionar o membro ao grupo
	member := models.GroupMember{
		GroupID:  groupID,
		UserID:   req.UserID,
		JoinedAt: time.Now(),
	}

	if err := config.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar membro"})
		return
	}

	// Aqui você pode implementar a lógica para criptografar e enviar a Sender Key para o novo membro

	c.JSON(http.StatusOK, gin.H{"message": "Membro adicionado com sucesso"})
}

// RemoveGroupMember remove um membro do grupo
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

	// Aqui você pode implementar a lógica para remover as Sender Keys do membro removido

	c.JSON(http.StatusOK, gin.H{"message": "Membro removido com sucesso"})
} 