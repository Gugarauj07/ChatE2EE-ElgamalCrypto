package api

import (
	"server/models"
	"net/http"
	"bytes"
	"io/ioutil"
	"log"
	"time"
	"sync"

	"github.com/gin-gonic/gin"
)

var users = make(map[string]models.User)
var messages = make(map[string][]models.ChatMessage)
var usersMutex = &sync.Mutex{}

const userTimeout = 5 * time.Minute

// SendMessageRequest representa a estrutura de requisição para enviar uma mensagem
type SendMessageRequest struct {
	EncryptedMessage string `json:"encryptedMessage"`
	SenderId         string `json:"senderId"`
	ReceiverId       string `json:"receiverId"`
}

// ReceiveMessagesRequest representa a estrutura de requisição para receber mensagens
type ReceiveMessagesRequest struct {
	UserId string `json:"userId"`
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
	body, _ := ioutil.ReadAll(c.Request.Body)
	log.Printf("Raw request body: %s", string(body))
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(body))

	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Parsed user data: UserId='%s', PublicKey={P:%d, G:%d, Y:%d}", user.UserId, user.PublicKey.P, user.PublicKey.G, user.PublicKey.Y)

	if user.UserId == "" || user.PublicKey.P == 0 || user.PublicKey.G == 0 || user.PublicKey.Y == 0 {
		log.Printf("Invalid user data: UserId='%s', PublicKey={P:%d, G:%d, Y:%d}", user.UserId, user.PublicKey.P, user.PublicKey.G, user.PublicKey.Y)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}

	if _, exists := users[user.UserId]; exists {
		log.Printf("User ID already exists: %s", user.UserId)
		c.JSON(http.StatusConflict, gin.H{"error": "User ID already exists"})
		return
	}

	user.LastActivity = time.Now()
	usersMutex.Lock()
	users[user.UserId] = user
	usersMutex.Unlock()

	log.Printf("User connected successfully: UserId='%s', PublicKey={P:%d, G:%d, Y:%d}", user.UserId, user.PublicKey.P, user.PublicKey.G, user.PublicKey.Y)

	c.JSON(http.StatusOK, gin.H{
		"message": "User connected successfully",
		"userId":  user.UserId,
	})
}

// GetUsers godoc
// @Summary Lista todos os usuários
// @Description Retorna uma lista de IDs de todos os usuários conectados
// @Tags users
// @Produce json
// @Success 200 {array} string
// @Router /users [get]
func GetUsers(c *gin.Context) {
	usersMutex.Lock()
	defer usersMutex.Unlock()

	userIDs := make([]string, 0, len(users))
	for id, user := range users {
		if time.Since(user.LastActivity) < userTimeout {
			userIDs = append(userIDs, id)
		} else {
			delete(users, id)
			delete(messages, id)
		}
	}
	c.JSON(http.StatusOK, userIDs)
}

// GetPublicKey godoc
// @Summary Obtém a chave pública de um usuário
// @Description Retorna a chave pública de um usuário específico
// @Tags users
// @Produce json
// @Param userId path string true "ID do usuário"
// @Success 200 {string} string
// @Failure 404 {object} map[string]string
// @Router /public-key/{userId} [get]
func GetPublicKey(c *gin.Context) {
	userID := c.Param("userId")
	usersMutex.Lock()
	user, exists := users[userID]
	if !exists {
		usersMutex.Unlock()
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	user.LastActivity = time.Now()
	users[userID] = user
	usersMutex.Unlock()
	c.JSON(http.StatusOK, user.PublicKey)
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

	usersMutex.Lock()
	userMessages, exists := messages[req.UserId]
	if !exists {
		userMessages = []models.ChatMessage{} // Retorna um array vazio se não houver mensagens
	} else {
		delete(messages, req.UserId) // Limpa as mensagens após enviar
	}
	usersMutex.Unlock()

	c.JSON(http.StatusOK, userMessages)
}

// Disconnect godoc
// @Summary Desconecta um usuário do servidor
// @Description Remove um usuário do servidor
// @Tags users
// @Accept json
// @Produce json
// @Param userId body string true "ID do usuário"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /disconnect [post]
func Disconnect(c *gin.Context) {
	var req struct {
		UserId string `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if _, exists := users[req.UserId]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	delete(users, req.UserId)
	delete(messages, req.UserId)

	log.Printf("User disconnected: UserId='%s'", req.UserId)

	c.JSON(http.StatusOK, gin.H{
		"message": "User disconnected successfully",
		"userId":  req.UserId,
	})
}

// Nova função para o heartbeat
func Heartbeat(c *gin.Context) {
	var req struct {
		UserId string `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usersMutex.Lock()
	if user, exists := users[req.UserId]; exists {
		user.LastActivity = time.Now()
		users[req.UserId] = user
		usersMutex.Unlock()
		c.JSON(http.StatusOK, gin.H{"message": "Heartbeat received"})
	} else {
		usersMutex.Unlock()
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
	}
}