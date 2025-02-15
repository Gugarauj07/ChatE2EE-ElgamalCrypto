package controllers

import (
	"log"
	"net/http"
	"server/websocket"

	"server/utils"

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
    // Obter token da query string
    token := c.Query("token")
    if token == "" {
        log.Printf("Token não encontrado na query string")
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Token não fornecido"})
        return
    }

    // Validar token
    userID, err := utils.ValidateToken(token)
    if err != nil {
        log.Printf("Erro na validação do token: %v", err)
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
        return
    }

    // Configurar CORS para WebSocket
    upgrader.CheckOrigin = func(r *http.Request) bool {
        origin := r.Header.Get("Origin")
        // Permitir localhost em desenvolvimento
        return origin == "http://localhost:5173" || origin == "http://localhost:3000"
    }

    // Fazer upgrade da conexão HTTP para WebSocket
    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        log.Printf("Erro no upgrade para WebSocket: %v", err)
        return
    }

    // Criar novo cliente
    client := &websocket.Client{
        Hub:    hub,
        Conn:   conn,
        Send:   make(chan []byte, 256),
        UserID: userID,
    }

    // Registrar cliente no hub
    client.Hub.Register <- client

    // Iniciar goroutines para leitura e escrita
    go client.ReadPump()
    go client.WritePump()
}