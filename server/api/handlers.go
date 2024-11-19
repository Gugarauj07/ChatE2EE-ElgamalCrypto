package api

import (
	"net/http"
	"server/models"
	"sort"
	"sync"
	"time"
	"strings"

	"github.com/gin-gonic/gin"
)

var users = make(map[string]models.User)
var chatHistory = make(map[string][]models.ChatMessage)
var usersMutex = &sync.Mutex{}
var chatHistoryMutex = &sync.RWMutex{}

const userTimeout = 5 * time.Minute

// SendMessageRequest representa a estrutura de requisição para enviar uma mensagem
type SendMessageRequest struct {
	EncryptedMessage map[string]models.EncryptedMessage `json:"encryptedMessage"`
	SenderId         string                             `json:"senderId"`
	ReceiverId       string                             `json:"receiverId"`
}

// ReceiveMessagesRequest representa a estrutura de requisição para receber mensagens
type ReceiveMessagesRequest struct {
	UserId      string `json:"userId"`
	OtherUserId string `json:"otherUserId"`
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
		SenderId:         req.SenderId,
		EncryptedContent: req.EncryptedMessage,
		Timestamp:        time.Now(),
		IsRead:           false,
	}

	chatHistoryMutex.Lock()
	defer chatHistoryMutex.Unlock()

	// Cria um ID único para o chat (ordenado alfabeticamente)
	chatID := getChatID(req.SenderId, req.ReceiverId)

	if _, exists := chatHistory[chatID]; !exists {
		chatHistory[chatID] = []models.ChatMessage{}
	}

	// Adiciona a mensagem ao histórico do chat
	chatHistory[chatID] = append(chatHistory[chatID], message)

	c.Status(http.StatusOK)
}

func getChatID(user1, user2 string) string {
	if user1 < user2 {
		return user1 + "_" + user2
	}
	return user2 + "_" + user1
}

// ReceiveMessages godoc
// @Summary Recebe mensagens
// @Description Retorna as mensagens encriptadas para um usuário específico
// @Tags messages
// @Accept json
// @Produce json
// @Param request body ReceiveMessagesRequest true "ID do usuário e ID do outro usuário"
// @Success 200 {array} models.ChatMessage
// @Failure 400 {object} map[string]string
// @Router /receive-messages [post]
func ReceiveMessages(c *gin.Context) {
	var req ReceiveMessagesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	chatHistoryMutex.RLock()
	defer chatHistoryMutex.RUnlock()

	chatID := getChatID(req.UserId, req.OtherUserId)

	var allMessages []models.ChatMessage
	if msgs, exists := chatHistory[chatID]; exists {
		allMessages = append(allMessages, msgs...)
	}

	// Ordena as mensagens por timestamp
	sort.Slice(allMessages, func(i, j int) bool {
		return allMessages[i].Timestamp.Before(allMessages[j].Timestamp)
	})

	c.JSON(http.StatusOK, allMessages)
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

	usersMutex.Lock()
	defer usersMutex.Unlock()

	if _, exists := users[user.UserId]; exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Usuário já existe"})
		return
	}

	user.LastActivity = time.Now()
	users[user.UserId] = user

	c.Status(http.StatusOK)
}

// Disconnect godoc
// @Summary Desconecta um usuário do servidor
// @Description Remove um usuário do servidor e seu histórico de chat
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

	usersMutex.Lock()
	defer usersMutex.Unlock()

	if _, exists := users[req.UserId]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	delete(users, req.UserId)

	// Remover o histórico de chat do usuário
	chatHistoryMutex.Lock()
	defer chatHistoryMutex.Unlock()
	for chatID, _ := range chatHistory {
		if strings.Contains(chatID, req.UserId+"_") || strings.Contains(chatID, "_"+req.UserId) {
			delete(chatHistory, chatID)
		}
	}

	c.Status(http.StatusOK)
}

// GetPublicKey godoc
// @Summary Obtém a chave pública de um usuário
// @Description Retorna a chave pública de um usuário específico
// @Tags users
// @Accept json
// @Produce json
// @Param userId path string true "ID do usuário"
// @Success 200 {object} models.PublicKey
// @Failure 404 {object} map[string]string
// @Router /public-key/{userId} [get]
func GetPublicKey(c *gin.Context) {
	userId := c.Param("userId")

	usersMutex.Lock()
	defer usersMutex.Unlock()

	user, exists := users[userId]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	c.JSON(http.StatusOK, user.PublicKey)
}

// GetUsers godoc
// @Summary Lista todos os usuários
// @Description Retorna uma lista de IDs de todos os usuários conectados
// @Tags users
// @Accept json
// @Produce json
// @Success 200 {array} string
// @Router /users [get]
func GetUsers(c *gin.Context) {
	usersMutex.Lock()
	defer usersMutex.Unlock()

	var userIds []string
	for userId := range users {
		userIds = append(userIds, userId)
	}

	c.JSON(http.StatusOK, userIds)
}

// Heartbeat godoc
// @Summary Envia um heartbeat para manter o usuário conectado
// @Description Atualiza a última atividade do usuário
// @Tags users
// @Accept json
// @Produce json
// @Param userId body string true "ID do usuário"
// @Success 200
// @Failure 400 {object} map[string]string
// @Router /heartbeat [post]
func Heartbeat(c *gin.Context) {
	var req struct {
		UserId string `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usersMutex.Lock()
	defer usersMutex.Unlock()

	user, exists := users[req.UserId]
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Usuário não encontrado"})
		return
	}

	user.LastActivity = time.Now()
	users[req.UserId] = user

	c.Status(http.StatusOK)
}