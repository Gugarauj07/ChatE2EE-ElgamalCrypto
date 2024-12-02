package routes

import (
	"github.com/gin-gonic/gin"
	"server/controllers"
	"server/websocket"
)

func SetupRoutes(router *gin.Engine, hub *websocket.Hub) {
    // Rota WebSocket
    router.GET("/ws", func(c *gin.Context) {
        controllers.ServeWS(c, hub)
    })

	// Rotas públicas (auth)
	AuthRoutes(router)

	// Rotas protegidas
	ProtectedRoutes(router)
}