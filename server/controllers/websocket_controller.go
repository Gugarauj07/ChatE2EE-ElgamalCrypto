package controllers

import (
	"log"
	"net/http"
	"server/utils"
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
    userID, err := utils.GetUserIDFromContext(c)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
        return
    }

    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        log.Printf("Erro ao atualizar para WebSocket: %v", err)
        return
    }

    client := &websocket.Client{
        Hub:    hub,
        ID:     utils.GenerateUUID(),
        UserID: userID,
        Conn:   conn,
        Send:   make(chan []byte, 256),
    }

    client.Hub.Register <- client

    go client.WritePump()
    go client.ReadPump()
}