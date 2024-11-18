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

// Defina o upgrader com a função CheckOrigin adequada
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Permitir todas as origens para desenvolvimento (não recomendado para produção)
		return true
	},
}

// Instância global do Hub
var WSHub = NovoHub()

// ServeWS atualiza a conexão HTTP para WebSocket
func ServeWS(c *gin.Context) {
	log.Println("Tentando estabelecer conexão WebSocket")
	token := c.Query("token")
	log.Printf("Token recebido: %s", token)

	// Valide o token e obtenha o userID
	userID, err := utils.ValidateToken(token)
	if err != nil {
		log.Printf("Falha na validação do token: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
		return
	}
	log.Printf("Usuário autenticado: %s", userID)

	// Atualizar a conexão para WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Erro ao atualizar para WebSocket: %v", err)
		return
	}
	log.Println("Conexão WebSocket estabelecida")

	client := &Client{
		ID:             userID,
		Conn:           conn,
		Send:           make(chan []byte, 256),
		Hub:            WSHub,
		ConversationID: c.Query("conversation_id"),
	}

	client.Hub.Register <- client
	log.Printf("Cliente %s registrado no Hub", userID)

	// Iniciar goroutines
	go client.readPump()
	go client.writePump()
}