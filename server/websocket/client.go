package websocket

import (
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

        log.Printf("Mensagem recebida: %s", message)

        c.Hub.Broadcast <- BroadcastMessage{
            ConversationID: c.ConversationID,
            Message:        message,
        }
    }
}

func (c *Client) WritePump() {
    ticker := time.NewTicker(pingPeriod)
    defer func() {
        ticker.Stop()
        c.Conn.Close()
    }()

    for {
        select {
        case message, ok := <-c.Send:
            if !ok {
                c.Conn.WriteMessage(gorilla.CloseMessage, []byte{})
                return
            }

            log.Printf("Mensagem sendo enviada para o cliente %s: %s", c.ID, string(message))

            w, err := c.Conn.NextWriter(gorilla.TextMessage)
            if err != nil {
                return
            }
            w.Write(message)

            n := len(c.Send)
            for i := 0; i < n; i++ {
                w.Write([]byte{'\n'})
                w.Write(<-c.Send)
            }

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