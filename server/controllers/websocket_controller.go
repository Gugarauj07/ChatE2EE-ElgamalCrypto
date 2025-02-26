package controllers

import (
	"log"
	"net/http"
	"server/websocket"

	"github.com/gin-gonic/gin"
	gorilla "github.com/gorilla/websocket"
)

var upgrader = gorilla.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}

func ServeWS(c *gin.Context, hub *websocket.Hub) {
    userID := c.Query("userId")
    if userID == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ID do usuário é obrigatório"})
        return
    }

    log.Printf("Iniciando conexão WebSocket para usuário: %s", userID)

    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        log.Printf("Erro ao atualizar para WebSocket: %v", err)
        return
    }

    client := &websocket.Client{
        Hub:    hub,
        UserID: userID,
        Conn:   conn,
        Send:   make(chan []byte, 256),
    }

    log.Printf("Registrando cliente WebSocket para usuário: %s", userID)
    client.Hub.Register <- client

    // Iniciar goroutines para leitura e escrita
    go client.WritePump()
    go client.ReadPump()

    log.Printf("Conexão WebSocket estabelecida para usuário: %s", userID)
}