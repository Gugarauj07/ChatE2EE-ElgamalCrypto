package handlers

import (
	"net/http"
	"server/db"
	"server/models"
	"server/ws"
	"time"

	"github.com/gin-gonic/gin"
)

// SendMessageRequest representa a requisição para enviar uma mensagem
type SendMessageRequest struct {
	RecipientId      string                 `json:"recipientId" binding:"required"`       // Pode ser userId ou groupId
	EncryptedContent models.EncryptedMessage `json:"encryptedContent" binding:"required"`
}

// SendMessageHandler trata o envio de mensagens
// @Summary Enviar uma mensagem
// @Description Envia uma mensagem criptografada para um usuário ou grupo
// @Tags Mensagens
// @Accept json
// @Produce json
// @Param Authorization header string true "Bearer Token"
// @Param message body SendMessageRequest true "Dados da mensagem"
// @Success 201 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router messages/send [post]
func SendMessageHandler(c *gin.Context) {
	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Verificar se o recipientId é um usuário ou um grupo
	var recipientUser models.User
	var recipientGroup models.Group
	isUser := true
	if err := db.DB.Where("user_id = ?", req.RecipientId).First(&recipientUser).Error; err != nil {
		// Não encontrou usuário, verificar se é grupo
		if err := db.DB.Where("group_id = ?", req.RecipientId).First(&recipientGroup).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "RecipientId inválido"})
			return
		}
		isUser = false
	}

	// Obter o userId do usuário autenticado
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}

	// Criar nova mensagem
	message := models.ChatMessage{
		SenderId:         userId.(string),
		RecipientId:      req.RecipientId,
		EncryptedContent: req.EncryptedContent,
		Timestamp:        time.Now(),
	}

	if err := db.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao enviar mensagem"})
		return
	}

	// Enviar através do WebSocket
	if isUser {
		// Enviar para usuário específico
		if conn, ok := ws.Clients[recipientUser.UserId]; ok {
			conn.WriteJSON(message)
		}
	} else {
		// Enviar para todos os membros do grupo
		for _, memberId := range recipientGroup.Members {
			if conn, ok := ws.Clients[memberId]; ok {
				conn.WriteJSON(message)
			}
		}
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Mensagem enviada com sucesso"})
}

// GetMessagesHandler trata o recebimento de mensagens para um usuário específico
// @Summary Recuperar mensagens
// @Description Recupera todas as mensagens enviadas e recebidas pelo usuário autenticado
// @Tags Mensagens
// @Accept json
// @Produce json
// @Param Authorization header string true "Bearer Token"
// @Success 200 {array} models.ChatMessage
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router messages [get]
func GetMessagesHandler(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}

	var messages []models.ChatMessage
	// Buscar mensagens recebidas e enviadas pelo usuário
	if err := db.DB.Where("recipient_id = ? OR sender_id = ?", userId.(string), userId.(string)).Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar mensagens"})
		return
	}

	c.JSON(http.StatusOK, messages)
}
