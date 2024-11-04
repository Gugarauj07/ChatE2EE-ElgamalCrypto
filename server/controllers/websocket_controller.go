package controllers

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"server/utils"
)

var (
	// Define os parâmetros do WebSocket
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		// Permite qualquer origem para simplificar; em produção, restrinja conforme necessário
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

// Client representa uma conexão WebSocket com um usuário
type Client struct {
	ID         string
	Conn       *websocket.Conn
	Send       chan []byte
	Hub        *Hub
	ConversationID string
}

// Hub gerencia as conexões e difusão de mensagens
type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan Message
	Register   chan *Client
	Unregister chan *Client
	Mutex      sync.Mutex
}

// Message representa uma mensagem enviada via WebSocket
type Message struct {
	ConversationID string `json:"conversation_id"`
	SenderID       string `json:"sender_id"`
	Content        string `json:"content"`
}

// Initialize Hub
var hub = Hub{
	Clients:    make(map[*Client]bool),
	Broadcast:  make(chan Message),
	Register:   make(chan *Client),
	Unregister: make(chan *Client),
}

// Run Hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Mutex.Lock()
			h.Clients[client] = true
			h.Mutex.Unlock()
		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				h.Mutex.Lock()
				delete(h.Clients, client)
				close(client.Send)
				h.Mutex.Unlock()
			}
		case message := <-h.Broadcast:
			h.Mutex.Lock()
			for client := range h.Clients {
				if client.ConversationID == message.ConversationID {
					select {
					case client.Send <- []byte(message.Content):
					default:
						close(client.Send)
						delete(h.Clients, client)
					}
				}
			}
			h.Mutex.Unlock()
		}
	}
}

// ServeWS gerencia a conexão WebSocket
func ServeWS(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	conversationID := c.Query("conversation_id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "conversation_id é obrigatório"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao estabelecer conexão WebSocket"})
		return
	}

	client := &Client{
		ID:             userID,
		Conn:           conn,
		Send:           make(chan []byte, 256),
		Hub:            &hub,
		ConversationID: conversationID,
	}

	client.Hub.Register <- client

	// Iniciar goroutines para leitura e escrita
	go client.readPump()
	go client.writePump()
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	for {
		var msg Message
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			break
		}
		c.Hub.Broadcast <- msg
	}
}

func (c *Client) writePump() {
	defer func() {
		c.Conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				// O canal foi fechado
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			err := c.Conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				return
			}
		}
	}
} 