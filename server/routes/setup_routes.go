package routes

import (
	"server/controllers"
	"server/websocket"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, hub *websocket.Hub) {
    // Rota WebSocket sem middleware de autenticação
    router.GET("/ws", func(c *gin.Context) {
        controllers.ServeWS(c, hub)
    })

	// Rotas públicas (auth)
	AuthRoutes(router)

	// Rotas protegidas
	ProtectedRoutes(router)
}