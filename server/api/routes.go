package api

import (
	"server/api/handlers"
	"server/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configura todas as rotas da API
func SetupRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		// Rotas Públicas
		api.POST("/register", handlers.RegisterHandler)
		api.POST("/login", handlers.LoginHandler)

		// Rotas Protegidas
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Gestão de Usuários
			protected.GET("/users", handlers.GetAllUsersHandler)
			protected.GET("/users/:userId", handlers.GetUserHandler)
			protected.PUT("/users/:userId", handlers.UpdateUserHandler)

			// Gestão de Mensagens
			protected.POST("/messages/send", handlers.SendMessageHandler)
			protected.GET("/messages", handlers.GetMessagesHandler)

			// Gestão de Grupos com Autorização
			protected.GET("/groups", handlers.ListGroupsHandler) // Novo Endpoint
			protected.POST("/groups", handlers.CreateGroupHandler)
			protected.PUT("/groups/:groupId", handlers.EditGroupHandler).Use(middleware.IsGroupMember())
			protected.DELETE("/groups/:groupId", handlers.DeleteGroupHandler).Use(middleware.IsGroupMember())
		}
	}
}
