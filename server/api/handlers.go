package api

import (
	"server/models"
	"server/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

var users = make(map[string]models.User)
var messages = make(map[string][]models.ChatMessage)

// EncryptRequest representa a estrutura de requisição para encriptar uma mensagem
type EncryptRequest struct {
	Message   string           `json:"message"`
	PublicKey models.PublicKey `json:"publicKey"`
}

// DecryptRequest representa a estrutura de requisição para decriptar uma mensagem
type DecryptRequest struct {
	EncryptedMessage models.EncryptedMessage `json:"encryptedMessage"`
	PrivateKey       int                     `json:"privateKey"`
}

// SendMessageRequest representa a estrutura de requisição para enviar uma mensagem
type SendMessageRequest struct {
	EncryptedMessage models.EncryptedMessage `json:"encryptedMessage"`
	SenderId         string                  `json:"senderId"`
	ReceiverId       string                  `json:"receiverId"`
}

// ReceiveMessagesRequest representa a estrutura de requisição para receber mensagens
type ReceiveMessagesRequest struct {
	UserId string `json:"userId"`
}

// GenerateKeys godoc
// @Summary Gera um novo par de chaves
// @Description Gera e retorna um novo par de chaves pública e privada
// @Tags keys
// @Produce json
// @Success 200 {object} models.KeyPair
// @Failure 500 {object} map[string]string
// @Router /generate-keys [get]
func GenerateKeys(c *gin.Context) {
	keys, err := services.GenerateKeys()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate keys"})
		return
	}
	c.JSON(http.StatusOK, keys)
}

// Connect godoc
// @Summary Conecta um usuário ao servidor
// @Description Registra um novo usuário com seu ID e chave pública
// @Tags users
// @Accept json
// @Produce json
// @Param user body models.User true "Informações do usuário"
// @Success 200
// @Failure 400 {object} map[string]string
// @Router /connect [post]
func Connect(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	users[user.ID] = user
	c.Status(http.StatusOK)
}

// GetUsers godoc
// @Summary Lista todos os usuários
// @Description Retorna uma lista de IDs de todos os usuários conectados
// @Tags users
// @Produce json
// @Success 200 {array} string
// @Router /users [get]
func GetUsers(c *gin.Context) {
	userIDs := make([]string, 0, len(users))
	for id := range users {
		userIDs = append(userIDs, id)
	}
	c.JSON(http.StatusOK, userIDs)
}

// GetPublicKey godoc
// @Summary Obtém a chave pública de um usuário
// @Description Retorna a chave pública de um usuário específico
// @Tags users
// @Produce json
// @Param userId path string true "ID do usuário"
// @Success 200 {integer} int
// @Failure 404 {object} map[string]string
// @Router /public-key/{userId} [get]
func GetPublicKey(c *gin.Context) {
	userID := c.Param("userId")
	user, exists := users[userID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user.PublicKey)
}

// EncryptMessage godoc
// @Summary Encripta uma mensagem
// @Description Encripta uma mensagem usando a chave pública fornecida
// @Tags messages
// @Accept json
// @Produce json
// @Param request body EncryptRequest true "Mensagem e chave pública"
// @Success 200 {object} models.EncryptedMessage
// @Failure 400 {object} map[string]string
// @Router /encrypt [post]
func EncryptMessage(c *gin.Context) {
	var req EncryptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	encrypted := services.Encrypt(req.Message, req.PublicKey)
	c.JSON(http.StatusOK, encrypted)
}

// DecryptMessage godoc
// @Summary Decripta uma mensagem
// @Description Decripta uma mensagem usando a chave privada fornecida
// @Tags messages
// @Accept json
// @Produce json
// @Param request body DecryptRequest true "Mensagem encriptada e chave privada"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /decrypt [post]
func DecryptMessage(c *gin.Context) {
	var req DecryptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	decrypted := services.Decrypt(req.EncryptedMessage, req.PrivateKey)
	c.JSON(http.StatusOK, gin.H{"decryptedMessage": decrypted})
}

// SendMessage godoc
// @Summary Envia uma mensagem
// @Description Envia uma mensagem encriptada para um usuário específico
// @Tags messages
// @Accept json
// @Produce json
// @Param request body SendMessageRequest true "Mensagem encriptada e IDs de remetente e destinatário"
// @Success 200
// @Failure 400 {object} map[string]string
// @Router /send-message [post]
func SendMessage(c *gin.Context) {
	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	message := models.ChatMessage{
		SenderId: req.SenderId,
		Content:  req.EncryptedMessage,
	}
	messages[req.ReceiverId] = append(messages[req.ReceiverId], message)
	c.Status(http.StatusOK)
}

// ReceiveMessages godoc
// @Summary Recebe mensagens
// @Description Retorna as mensagens encriptadas para um usuário específico
// @Tags messages
// @Accept json
// @Produce json
// @Param request body ReceiveMessagesRequest true "ID do usuário"
// @Success 200 {array} models.ChatMessage
// @Failure 400 {object} map[string]string
// @Router /receive-messages [post]
func ReceiveMessages(c *gin.Context) {
	var req struct {
		UserId string `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userMessages := messages[req.UserId]
	delete(messages, req.UserId) // Clear messages after sending
	c.JSON(http.StatusOK, userMessages)
}