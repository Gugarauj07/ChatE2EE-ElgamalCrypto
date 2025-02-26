package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

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
    isAlive bool
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
    MessageID  string          // ID da mensagem para rastreamento
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
    // Verificador periódico de clientes inativos
    ticker := time.NewTicker(30 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case client := <-h.Register:
            h.mu.Lock()
            client.isAlive = true
            h.Clients[client.UserID] = client
            h.mu.Unlock()
            log.Printf("Cliente %s registrado", client.UserID)

        case client := <-h.Unregister:
            h.mu.Lock()
            if _, ok := h.Clients[client.UserID]; ok {
                client.isAlive = false
                delete(h.Clients, client.UserID)
                close(client.Send)
                log.Printf("Cliente %s desregistrado", client.UserID)
            }
            h.mu.Unlock()

        case message := <-h.Broadcast:
            log.Printf("Broadcast para %d destinatários: %s (ID: %s)",
                len(message.Recipients), message.Type, message.MessageID)

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

            // Criar um mapa para rastrear entrega
            delivered := make(map[string]bool)

            h.mu.RLock()
            for _, userID := range message.Recipients {
                if client, ok := h.Clients[userID]; ok && client.isAlive {
                    select {
                    case client.Send <- messageBytes:
                        log.Printf("Mensagem %s enviada para cliente %s",
                            message.MessageID, userID)
                        delivered[userID] = true
                    default:
                        log.Printf("Buffer cheio para cliente %s, desconectando", userID)
                        client.isAlive = false
                        close(client.Send)
                        delete(h.Clients, userID)
                    }
                } else {
                    log.Printf("Cliente %s não está conectado ou inativo", userID)
                }
            }
            h.mu.RUnlock()

            // Registrar quem não recebeu a mensagem
            for _, userID := range message.Recipients {
                if !delivered[userID] {
                    log.Printf("Falha ao entregar mensagem %s para usuário %s",
                        message.MessageID, userID)
                }
            }

        case <-ticker.C:
            // Verificar clientes inativos periodicamente
            h.mu.Lock()
            for userID, client := range h.Clients {
                if !client.isAlive {
                    log.Printf("Removendo cliente inativo: %s", userID)
                    delete(h.Clients, userID)
                    close(client.Send)
                }
            }
            h.mu.Unlock()
        }
    }
}
