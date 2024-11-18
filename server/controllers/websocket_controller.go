package controllers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"server/utils"
	"server/models"
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

	// Esperar pela mensagem de autenticação
	_, message, err := c.Conn.ReadMessage()
	if err != nil {
		log.Printf("Erro ao ler mensagem de autenticação: %v", err)
		return
	}

	var wsMsg models.WSMessage
	if err := json.Unmarshal(message, &wsMsg); err != nil {
		log.Printf("Erro ao deserializar mensagem: %v", err)
		c.Conn.WriteMessage(websocket.CloseMessage, []byte("Mensagem inválida"))
		return
	}

	if wsMsg.Type != "auth" {
		log.Println("Primeira mensagem deve ser de autenticação")
		c.Conn.WriteMessage(websocket.CloseMessage, []byte("Autenticação requerida"))
		return
	}

	var authMsg models.AuthMessage
	if err := json.Unmarshal(wsMsg.Payload, &authMsg); err != nil {
		log.Printf("Erro ao deserializar mensagem de autenticação: %v", err)
		c.Conn.WriteMessage(websocket.CloseMessage, []byte("Formato de autenticação inválido"))
		return
	}

	userID, err := utils.ValidateToken(authMsg.Token)
	if err != nil {
		log.Printf("Falha na validação do token: %v", err)
		c.Conn.WriteMessage(websocket.CloseMessage, []byte("Token inválido"))
		return
	}

	c.ID = userID
	c.Hub.Register <- c
	log.Printf("Cliente %s registrado no Hub", userID)

	// Agora, continuar a escutar mensagens normalmente
	for {
		_, msg, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Erro inesperado: %v", err)
			}
			break
		}
		// Processar a mensagem recebida
		var incomingMsg models.WSMessage
		if err := json.Unmarshal(msg, &incomingMsg); err != nil {
			log.Printf("Erro ao deserializar mensagem: %v", err)
			continue
		}

		switch incomingMsg.Type {
		case "message":
			var msgPayload Message
			if err := json.Unmarshal(incomingMsg.Payload, &msgPayload); err != nil {
				log.Printf("Erro ao deserializar payload de mensagem: %v", err)
				continue
			}
			c.Hub.Broadcast <- msgPayload
		// Adicione outros tipos de mensagens conforme necessário
		default:
			log.Printf("Tipo de mensagem desconhecido: %s", incomingMsg.Type)
		}
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

// Defina o upgrader com as configurações necessárias
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Configure CheckOrigin conforme necessário
	CheckOrigin: func(r *http.Request) bool {
		// Permitir todas as origens para desenvolvimento (não recomendado para produção)
		return true
	},
}

// Instância global do Hub
var WSHub = NovoHub()

// ServeWS atualiza a conexão HTTP para WebSocket e autentica o cliente
func ServeWS(c *gin.Context) {
	log.Println("Tentando estabelecer conexão WebSocket")

	// Atualizar a conexão para WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Erro ao atualizar para WebSocket: %v", err)
		return
	}
	log.Println("Conexão WebSocket estabelecida")

	// Inicializar o cliente sem ID até a autenticação
	client := &Client{
		Conn: conn,
		Send: make(chan []byte, 256),
		Hub:  WSHub,
	}

	// Iniciar goroutines
	go client.writePump()
	go client.readPump()
}