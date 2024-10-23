package api

import (
	"server/api/handlers"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configura todas as rotas da API
func SetupRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		// Autenticação
		api.POST("/register", handlers.RegisterHandler)
		api.POST("/login", handlers.LoginHandler)

		// Gestão de Usuários
		api.GET("/users/:userId", handlers.GetUserHandler)
		api.PUT("/users/:userId", handlers.UpdateUserHandler)

		// Gestão de Mensagens
		api.POST("/messages/send", handlers.SendMessageHandler)
		api.GET("/messages", handlers.GetMessagesHandler)

		// Gestão de Grupos
		api.PUT("/groups/:groupId", handlers.EditGroupHandler)
		api.DELETE("/groups/:groupId", handlers.DeleteGroupHandler)
		api.POST("/groups", handlers.CreateGroupHandler)
	}
}
