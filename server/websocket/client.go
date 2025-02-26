package websocket

import (
	"encoding/json"
	"log"
	"time"

	gorilla "github.com/gorilla/websocket"
)

const (
    writeWait      = 10 * time.Second
    pongWait       = 60 * time.Second
    pingPeriod     = (pongWait * 9) / 10
    maxMessageSize = 512 * 1024
)

func (c *Client) ReadPump() {
    defer func() {
        c.Hub.Unregister <- c
        c.Conn.Close()
    }()

    c.Conn.SetReadLimit(maxMessageSize)
    c.Conn.SetReadDeadline(time.Now().Add(pongWait))
    c.Conn.SetPongHandler(func(string) error {
        c.Conn.SetReadDeadline(time.Now().Add(pongWait))
        return nil
    })

    for {
        _, message, err := c.Conn.ReadMessage()
        if err != nil {
            if gorilla.IsUnexpectedCloseError(err, gorilla.CloseGoingAway, gorilla.CloseAbnormalClosure) {
                log.Printf("Erro na leitura: %v", err)
            }
            break
        }

        var wsMessage struct {
            Type    string          `json:"type"`
            Payload json.RawMessage `json:"payload"`
        }

        if err := json.Unmarshal(message, &wsMessage); err != nil {
            log.Printf("Erro ao decodificar mensagem: %v", err)
            continue
        }

        if err := c.Hub.HandleMessage(wsMessage.Type, wsMessage.Payload, c.UserID); err != nil {
            log.Printf("Erro ao processar mensagem: %v", err)
        }
    }
}

// WritePump bombeia mensagens do hub para a conexão websocket
func (c *Client) WritePump() {
    ticker := time.NewTicker(pingPeriod)
    defer func() {
        ticker.Stop()
        c.Conn.Close()
    }()

    for {
        select {
        case message, ok := <-c.Send:
            c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
            if !ok {
                // O hub fechou o canal
                c.Conn.WriteMessage(gorilla.CloseMessage, []byte{})
                return
            }

            w, err := c.Conn.NextWriter(gorilla.TextMessage)
            if err != nil {
                return
            }

            // Decodificar a mensagem para adicionar o tipo
            var payload map[string]interface{}
            if err := json.Unmarshal(message, &payload); err != nil {
                log.Printf("Erro ao decodificar payload para envio: %v", err)
                w.Close()
                continue
            }

            // Verificar se já existe um campo "type"
            if _, ok := payload["type"]; !ok {
                // Se não existir, adicionar o tipo "message" por padrão
                completeMessage := map[string]interface{}{
                    "type":    "message",
                    "payload": payload,
                }
                message, _ = json.Marshal(completeMessage)
            }

            w.Write(message)

            if err := w.Close(); err != nil {
                return
            }
        case <-ticker.C:
            c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
            if err := c.Conn.WriteMessage(gorilla.PingMessage, nil); err != nil {
                return
            }
        }
    }
}