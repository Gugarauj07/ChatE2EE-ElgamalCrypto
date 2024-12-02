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
    Hub            *Hub
    ID             string
    ConversationID string
    Conn           *gorilla.Conn
    Send           chan []byte
    mu             sync.Mutex
}

// Hub mantém o registro de clientes ativos e gerencia mensagens
type Hub struct {
    Clients    map[string]map[string]*Client // conversationID -> clientID -> client
    Register   chan *Client
    Unregister chan *Client
    Broadcast  chan BroadcastMessage
    mu         sync.RWMutex
}

type BroadcastMessage struct {
    ConversationID string
    Message        []byte
}

func NewHub() *Hub {
    return &Hub{
        Clients:    make(map[string]map[string]*Client),
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
            if _, ok := h.Clients[client.ConversationID]; !ok {
                h.Clients[client.ConversationID] = make(map[string]*Client)
            }
            h.Clients[client.ConversationID][client.ID] = client
            h.mu.Unlock()

        case client := <-h.Unregister:
            h.mu.Lock()
            if clients, ok := h.Clients[client.ConversationID]; ok {
                if _, ok := clients[client.ID]; ok {
                    delete(clients, client.ID)
                    close(client.Send)
                }
            }
            h.mu.Unlock()

        case broadcastMsg := <-h.Broadcast:
            h.mu.RLock()
            clients := h.Clients[broadcastMsg.ConversationID]
            for _, client := range clients {
                select {
                case client.Send <- broadcastMsg.Message:
                default:
                    close(client.Send)
                    delete(h.Clients[client.ConversationID], client.ID)
                }
            }
            h.mu.RUnlock()
        }
    }
}

func (h *Hub) broadcastMessage(bm BroadcastMessage) {
    h.mu.RLock()
    clients := h.Clients[bm.ConversationID]
    h.mu.RUnlock()

    log.Printf("Mensagem original recebida para broadcast: %+v", string(bm.Message))

    // Adicione este log para ver a estrutura completa da mensagem
    var messageStruct map[string]interface{}
    if err := json.Unmarshal(bm.Message, &messageStruct); err != nil {
        log.Printf("Erro ao decodificar mensagem: %v", err)
        return
    }
    prettyJSON, _ := json.MarshalIndent(messageStruct, "", "    ")
    log.Printf("Estrutura da mensagem que será enviada aos clientes:\n%s", string(prettyJSON))

    for _, client := range clients {
        select {
        case client.Send <- bm.Message:
            log.Printf("Mensagem enviada para cliente %s", client.ID)
        default:
            log.Printf("Falha ao enviar mensagem para cliente %s", client.ID)
            close(client.Send)
            h.Unregister <- client
        }
    }
}
