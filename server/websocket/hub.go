package websocket

import (
	"encoding/json"
	"log"
	"sync"

	gorilla "github.com/gorilla/websocket"
)

// WSMessage representa uma mensagem WebSocket
type WSMessage struct {
    Type    string          `json:"type"`
    Payload json.RawMessage `json:"payload"`
}

// Client representa uma conexão WebSocket
type Client struct {
    Hub     *Hub
    ID      string
    UserID  string
    Conn    *gorilla.Conn
    Send    chan []byte
    mu      sync.Mutex
}

// Hub mantém o registro de clientes ativos e gerencia mensagens
type Hub struct {
    Clients    map[string]*Client // userID -> client
    Register   chan *Client
    Unregister chan *Client
    Broadcast  chan BroadcastMessage
    mu         sync.RWMutex
}

type BroadcastMessage struct {
    ConversationID string
    Message        []byte
    Recipients     []string
}

func NewHub() *Hub {
    return &Hub{
        Clients:    make(map[string]*Client),
        Register:   make(chan *Client),
        Unregister: make(chan *Client),
        Broadcast:  make(chan BroadcastMessage),
    }
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.Register:
            h.mu.Lock()
            h.Clients[client.UserID] = client
            h.mu.Unlock()
            log.Printf("Cliente registrado: UserID=%s", client.UserID)

        case client := <-h.Unregister:
            h.mu.Lock()
            if _, ok := h.Clients[client.UserID]; ok {
                delete(h.Clients, client.UserID)
                close(client.Send)
            }
            h.mu.Unlock()
            log.Printf("Cliente desregistrado: UserID=%s", client.UserID)

        case bm := <-h.Broadcast:
            h.broadcastMessage(bm)
        }
    }
}

func (h *Hub) broadcastMessage(bm BroadcastMessage) {
    h.mu.RLock()
    defer h.mu.RUnlock()

    for _, recipientID := range bm.Recipients {
        if client, ok := h.Clients[recipientID]; ok {
            select {
            case client.Send <- bm.Message:
                log.Printf("Mensagem enviada para usuário %s", recipientID)
            default:
                log.Printf("Buffer cheio para usuário %s", recipientID)
                close(client.Send)
                delete(h.Clients, recipientID)
            }
        }
    }
}
