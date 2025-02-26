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
        log.Printf("ReadPump encerrado para cliente %s", c.UserID)
    }()

    c.Conn.SetReadLimit(maxMessageSize)
    c.Conn.SetReadDeadline(time.Now().Add(pongWait))
    c.Conn.SetPongHandler(func(string) error {
        c.Conn.SetReadDeadline(time.Now().Add(pongWait))
        c.isAlive = true
        return nil
    })

    for {
        _, message, err := c.Conn.ReadMessage()
        if err != nil {
            if gorilla.IsUnexpectedCloseError(err, gorilla.CloseGoingAway, gorilla.CloseAbnormalClosure) {
                log.Printf("Erro na leitura para cliente %s: %v", c.UserID, err)
            }
            break
        }

        var wsMessage struct {
            Type    string          `json:"type"`
            Payload json.RawMessage `json:"payload"`
        }

        if err := json.Unmarshal(message, &wsMessage); err != nil {
            log.Printf("Erro ao decodificar mensagem de %s: %v", c.UserID, err)
            continue
        }

        log.Printf("Mensagem recebida de %s: tipo=%s", c.UserID, wsMessage.Type)

        if err := c.Hub.HandleMessage(wsMessage.Type, wsMessage.Payload, c.UserID); err != nil {
            log.Printf("Erro ao processar mensagem de %s: %v", c.UserID, err)
        }
    }
}

// WritePump bombeia mensagens do hub para a conexão websocket
func (c *Client) WritePump() {
    ticker := time.NewTicker(pingPeriod)
    defer func() {
        ticker.Stop()
        c.Conn.Close()
        log.Printf("WritePump encerrado para cliente %s", c.UserID)
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
                log.Printf("Erro ao obter writer para cliente %s: %v", c.UserID, err)
                return
            }

            // Verificar se a mensagem é válida antes de enviar
            var msgCheck map[string]interface{}
            if err := json.Unmarshal(message, &msgCheck); err != nil {
                log.Printf("Mensagem inválida para cliente %s: %v", c.UserID, err)
                w.Close()
                continue
            }

            if _, err := w.Write(message); err != nil {
                log.Printf("Erro ao escrever mensagem para cliente %s: %v", c.UserID, err)
                return
            }

            if err := w.Close(); err != nil {
                log.Printf("Erro ao fechar writer para cliente %s: %v", c.UserID, err)
                return
            }

            // Marcar cliente como ativo após envio bem-sucedido
            c.isAlive = true

        case <-ticker.C:
            c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
            if err := c.Conn.WriteMessage(gorilla.PingMessage, nil); err != nil {
                log.Printf("Erro ao enviar ping para cliente %s: %v", c.UserID, err)
                return
            }
        }
    }
}

// SendAck envia uma confirmação de recebimento para o cliente
func (c *Client) SendAck(messageID string) {
    ack := map[string]interface{}{
        "type": "ack",
        "payload": map[string]string{
            "messageId": messageID,
            "status": "received",
        },
    }

    ackBytes, err := json.Marshal(ack)
    if err != nil {
        log.Printf("Erro ao criar ACK: %v", err)
        return
    }

    select {
    case c.Send <- ackBytes:
        log.Printf("ACK enviado para cliente %s (mensagem: %s)", c.UserID, messageID)
    default:
        log.Printf("Falha ao enviar ACK para cliente %s", c.UserID)
    }
}