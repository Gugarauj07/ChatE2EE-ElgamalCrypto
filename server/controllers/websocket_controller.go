package controllers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"server/utils"
)

// Message representa uma mensagem transmitida via WebSocket
type Message struct {
	Content        string `json:"content"`
	ConversationID string `json:"conversation_id"`
	SenderID       string `json:"sender_id"`
}

// Client representa um cliente conectado via WebSocket
type Client struct {
	ID             string
	Conn           *websocket.Conn
	Send           chan []byte
	Hub            *Hub
	ConversationID string
}

// Hub gerencia todas as conexões de clientes e mensagens
type Hub struct {
	Clients    map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan Message
}

// NovoHub cria e retorna um novo Hub
func NovoHub() *Hub {
	return &Hub{
		Clients:    make(map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan Message),
	}
}

// Run inicia o loop do Hub para gerenciar registros, desregistros e broadcasts
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
			log.Printf("Cliente %s conectado", client.ID)
		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				log.Printf("Cliente %s desconectado", client.ID)
			}
		case message := <-h.Broadcast:
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
		}
	}
}

// readPump lê mensagens do WebSocket e as encaminha para o Hub
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

// writePump escreve mensagens recebidas do Hub no WebSocket
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

// Define o Upgrader com configurações apropriadas
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Permitir todas as origens (para desenvolvimento; ajuste conforme necessário)
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Instância global do Hub
var WSHub = NovoHub()

// ServeWS atualiza a conexão HTTP para WebSocket
func ServeWS(c *gin.Context) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	conversationID := c.Query("conversation_id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID da conversa é obrigatório"})
		return
	}

	// Atualizar a conexão para WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Erro ao atualizar para WebSocket: %v", err)
		return
	}

	client := &Client{
		ID:             userID,
		Conn:           conn,
		Send:           make(chan []byte, 256),
		Hub:            WSHub,
		ConversationID: conversationID,
	}

	client.Hub.Register <- client

	// Iniciar as goroutines para leitura e escrita
	go client.readPump()
	go client.writePump()
}