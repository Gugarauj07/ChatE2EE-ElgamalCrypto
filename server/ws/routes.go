package ws

import (
	"fmt"
	"net/http"
	"server/db"
	"server/models"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Upgrader para upgrades de conexão WebSocket
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Permitir CORS para WebSockets
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Clients conectados (exportado para acesso externo)
var Clients = make(map[string]*websocket.Conn)

// Broadcast canal para mensagens
var Broadcast = make(chan models.ChatMessage)

// WebSocketHandler gerencia a conexão WebSocket
// @Summary Conectar ao WebSocket
// @Description Estabelece uma conexão WebSocket para o usuário
// @Tags WebSocket
// @Accept json
// @Produce json
// @Param userId query string true "ID do usuário"
// @Success 101 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /ws [get]
func WebSocketHandler(c *gin.Context) {
	userId := c.Query("userId") // Recebe o userId como query parameter
	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId é obrigatório"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao estabelecer WebSocket"})
		return
	}
	defer conn.Close()

	Clients[userId] = conn
	fmt.Printf("Usuário %s conectado via WebSocket.\n", userId)

	for {
		var msg models.ChatMessage
		err := conn.ReadJSON(&msg)
		if err != nil {
			delete(Clients, userId)
			fmt.Printf("Usuário %s desconectado do WebSocket.\n", userId)
			break
		}
		Broadcast <- msg
	}
}

// WSRoutes configura as rotas de WebSocket
func WSRoutes(router *gin.Engine) {
	router.GET("/ws", WebSocketHandler)

	// Goroutine para broadcast de mensagens
	go func() {
		for {
			msg := <-Broadcast
			if conn, ok := Clients[msg.RecipientId]; ok {
				conn.WriteJSON(msg)
			} else {
				// Se RecipientId for um grupo, enviar para todos os membros
				var group models.Group
				if err := db.DB.Where("group_id = ?", msg.RecipientId).First(&group).Error; err == nil {
					for _, memberId := range group.Members {
						if memberConn, exists := Clients[memberId]; exists {
							memberConn.WriteJSON(msg)
						}
					}
				}
			}
		}
	}()
}
