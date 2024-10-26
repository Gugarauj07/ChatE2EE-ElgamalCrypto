package handlers

import (
	"net/http"
	"time"
	"fmt"

	"server/db"
	"server/models"
	"server/crypto" // Importando o pacote de criptografia ElGamal

	"github.com/gin-gonic/gin"
)


type CreateGroupRequest struct {
	GroupID   string   `json:"groupId" binding:"required"`
	Members   []string `json:"members" binding:"required"`   // Lista de userIds
	SenderKey string   `json:"senderKey" binding:"required"` // Sender key em texto simples
}

// EditGroupRequest representa a requisição para editar um grupo
type EditGroupRequest struct {
	Members   []string `json:"members"`   // Nova lista de userIds
	SenderKey string   `json:"senderKey"` // Nova sender key em texto simples
}

// CreateGroupRequest representa a requisição para criar um grupo
// @Description Representa a requisição para criar um grupo
// @Tags Grupos
// @Accept json
// @Produce json
// @Param group body CreateGroupRequest true "Dados do grupo"
// @Success 201 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /groups [post]
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
		GroupID:   req.GroupID,
		Members:   req.Members,
		SenderKey: req.SenderKey,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := db.DB.Create(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar grupo"})
		return
	}

	// Atualizar sender keys para todos os membros
	if err := UpdateSenderKeys(group); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Erro ao atualizar sender keys: %v", err)})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Grupo criado com sucesso", "groupId": group.GroupID})
}

// EditGroupHandler trata a edição de um grupo existente
func EditGroupHandler(c *gin.Context) {
	groupId := c.Param("groupId")

	var req EditGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	var group models.Group
	if err := db.DB.Where("group_id = ?", groupId).First(&group).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grupo não encontrado"})
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

	// Atualizar sender keys se houve alteração nos membros ou sender key
	if len(req.Members) > 0 || req.SenderKey != "" {
		if err := UpdateSenderKeys(group); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Erro ao atualizar sender keys: %v", err)})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Grupo atualizado com sucesso"})
}

// DeleteGroupHandler trata a exclusão de um grupo
// @Summary Deletar um grupo
// @Description Deleta um grupo e suas sender keys associadas
// @Tags Grupos
// @Accept json
// @Produce json
// @Param groupId path string true "ID do grupo"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /groups/{groupId} [delete]
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

	// Remover todas as sender keys associadas ao grupo
	if err := db.DB.Where("group_id = ?", groupId).Delete(&models.GroupSenderKey{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover sender keys do grupo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Grupo deletado com sucesso"})
}

// UpdateSenderKeys atualiza as sender keys para todos os membros do grupo
// @Summary Atualizar sender keys
// @Description Atualiza as sender keys para todos os membros do grupo
// @Tags Grupos
// @Accept json
// @Produce json
// @Param group body models.Group true "Dados do grupo"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /groups/update-sender-keys [post]
func UpdateSenderKeys(group models.Group) error {
	for _, memberId := range group.Members {
		// Buscar a chave pública do membro
		var user models.User
		if err := db.DB.Where("user_id = ?", memberId).First(&user).Error; err != nil {
			return fmt.Errorf("usuário %s não encontrado", memberId)
		}

		// Criptografar a sender key usando a chave pública do membro
		encryptedKey, err := crypto.EncryptElGamal(group.SenderKey, user.PublicKey)
		if err != nil {
			return fmt.Errorf("erro ao criptografar sender key para usuário %s: %v", memberId, err)
		}

		// Armazenar a sender key criptografada no banco de dados
		groupSenderKey := models.GroupSenderKey{
			GroupID:      group.GroupID,
			UserID:       memberId,
			EncryptedKey: encryptedKey,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		// Verificar se já existe uma sender key para o usuário e grupo
		var existingGroupSenderKey models.GroupSenderKey
		if err := db.DB.Where("group_id = ? AND user_id = ?", group.GroupID, memberId).First(&existingGroupSenderKey).Error; err != nil {
			// Não existe, então criar
			if err := db.DB.Create(&groupSenderKey).Error; err != nil {
				return fmt.Errorf("erro ao criar sender key para usuário %s: %v", memberId, err)
			}
		} else {
			// Atualizar a sender key existente
			existingGroupSenderKey.EncryptedKey = encryptedKey
			existingGroupSenderKey.UpdatedAt = time.Now()
			if err := db.DB.Save(&existingGroupSenderKey).Error; err != nil {
				return fmt.Errorf("erro ao atualizar sender key para usuário %s: %v", memberId, err)
			}
		}
	}

	return nil
}

// ListGroupsHandler retorna a lista de grupos que o usuário autenticado faz parte
// @Summary Listar grupos do usuário
// @Description Obtém uma lista de grupos dos quais o usuário autenticado faz parte
// @Tags Grupos
// @Accept json
// @Produce json
// @Param Authorization header string true "Bearer Token"
// @Success 200 {array} models.Group
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /groups [get]
func ListGroupsHandler(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}

	var groups []models.Group
	if err := db.DB.Where("members @> ?", []string{userId.(string)}).Find(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar grupos"})
		return
	}

	// Filtrar informações relevantes
	type GroupResponse struct {
		GroupID   string   `json:"groupId"`
		Members   []string `json:"members"`
		SenderKey string   `json:"senderKey"`
	}

	var response []GroupResponse
	for _, group := range groups {
		response = append(response, GroupResponse{
			GroupID:   group.GroupID,
			Members:   group.Members,
			SenderKey: group.SenderKey,
		})
	}

	c.JSON(http.StatusOK, response)
}
