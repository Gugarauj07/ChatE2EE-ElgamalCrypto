package ws

import (
	"net/http"
	"server/models"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Permitir CORS para WebSockets
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Clients conectados
var clients = make(map[string]*websocket.Conn)

// Broadcast canal para mensagens
var broadcast = make(chan models.ChatMessage)

// WebSocketHandler gerencia a conexão WebSocket
func WebSocketHandler(c *gin.Context) {
	userId := c.Query("userId")
	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId é obrigatório"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	clients[userId] = conn

	for {
		var msg models.ChatMessage
		err := conn.ReadJSON(&msg)
		if err != nil {
			delete(clients, userId)
			break
		}
		broadcast <- msg
	}
}

// SetupRoutes configura as rotas de WebSocket
func WSRoutes(router *gin.Engine) {
	router.GET("/ws", WebSocketHandler)

	// Goroutine para broadcast de mensagens
	go func() {
		for {
			msg := <-broadcast
			if conn, ok := clients[msg.RecipientId]; ok {
				conn.WriteJSON(msg)
			}
		}
	}()
}