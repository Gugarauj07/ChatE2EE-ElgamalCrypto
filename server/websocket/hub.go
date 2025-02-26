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
    Type       string          `json:"type"`
    Payload    json.RawMessage `json:"payload"`
    Recipients []string        // Lista de userIDs
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
            log.Printf("Cliente %s registrado", client.UserID)

        case client := <-h.Unregister:
            h.mu.Lock()
            if _, ok := h.Clients[client.UserID]; ok {
                delete(h.Clients, client.UserID)
                close(client.Send)
                log.Printf("Cliente %s desregistrado", client.UserID)
            }
            h.mu.Unlock()

        case message := <-h.Broadcast:
            log.Printf("Broadcast para %d destinatários: %s", len(message.Recipients), message.Type)

            // Preparar a mensagem completa com tipo
            completeMessage := WSMessage{
                Type:    message.Type,
                Payload: message.Payload,
            }

            messageBytes, err := json.Marshal(completeMessage)
            if err != nil {
                log.Printf("Erro ao serializar mensagem para broadcast: %v", err)
                continue
            }

            h.mu.RLock()
            for _, userID := range message.Recipients {
                if client, ok := h.Clients[userID]; ok {
                    select {
                    case client.Send <- messageBytes:
                        log.Printf("Mensagem enviada para cliente %s", userID)
                    default:
                        log.Printf("Buffer cheio para cliente %s, desconectando", userID)
                        close(client.Send)
                        delete(h.Clients, userID)
                    }
                } else {
                    log.Printf("Cliente %s não está conectado", userID)
                }
            }
            h.mu.RUnlock()
        }
    }
}
