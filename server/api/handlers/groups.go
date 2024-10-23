package handlers

import (
	"net/http"
	"time"

	"server/db"
	"server/models"

	"github.com/gin-gonic/gin"
)

// CreateGroupRequest representa a requisição para criar um grupo
type CreateGroupRequest struct {
	GroupID   string   `json:"groupId" binding:"required"`
	Members   []string `json:"members" binding:"required"`
	SenderKey string   `json:"senderKey" binding:"required"` // Chave do remetente criptografada
}

// CreateGroupHandler trata a criação de novos grupos
func CreateGroupHandler(c *gin.Context) {
	var req CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Verificar se o grupo já existe
	var existingGroup models.Group
	if err := db.DB.Where("group_id = ?", req.GroupID).First(&existingGroup).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Grupo já existe"})
		return
	}

	// Criar novo grupo
	group := models.Group{
		GroupID:    req.GroupID,
		Members:    req.Members,
		SenderKey:  req.SenderKey,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := db.DB.Create(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar grupo"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Grupo criado com sucesso", "groupId": group.GroupID})
}

// EditGroupRequest representa a requisição para editar um grupo
type EditGroupRequest struct {
	Members   []string `json:"members,omitempty"`
	SenderKey string   `json:"senderKey,omitempty"` // Nova chave do remetente criptografada
}

// EditGroupHandler trata a edição de grupos existentes
func EditGroupHandler(c *gin.Context) {
	groupId := c.Param("groupId")

	var group models.Group
	if err := db.DB.Where("group_id = ?", groupId).First(&group).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grupo não encontrado"})
		return
	}

	var req EditGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Atualizar membros se fornecido
	if len(req.Members) > 0 {
		group.Members = req.Members
	}

	// Atualizar sender key se fornecido
	if req.SenderKey != "" {
		group.SenderKey = req.SenderKey
	}

	group.UpdatedAt = time.Now()

	if err := db.DB.Save(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar grupo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Grupo atualizado com sucesso"})
}

// DeleteGroupHandler trata a exclusão de grupos
func DeleteGroupHandler(c *gin.Context) {
	groupId := c.Param("groupId")

	var group models.Group
	if err := db.DB.Where("group_id = ?", groupId).First(&group).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grupo não encontrado"})
		return
	}

	if err := db.DB.Delete(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar grupo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Grupo deletado com sucesso"})
}