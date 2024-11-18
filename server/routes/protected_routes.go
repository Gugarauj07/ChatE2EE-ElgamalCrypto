package routes

import (
	"github.com/gin-gonic/gin"
	"server/controllers"
	"server/middlewares"
)

func ProtectedRoutes(router *gin.Engine) {
	router.GET("/api/ws", controllers.ServeWS)
	protected := router.Group("/api")
	protected.Use(middlewares.AuthMiddleware())
	{
		// Rotas de usuário
		protected.GET("/user/profile", controllers.GetUserProfile)
		protected.PUT("/user/profile", controllers.UpdateUserProfile)

		// Rotas de chaves
		protected.PUT("/user/keys", controllers.UpdateKeys)
		protected.GET("/user/:id/public-key", controllers.GetPublicKey)

		// Rotas de contatos
		contacts := protected.Group("/contacts")
		{
			contacts.GET("/", controllers.ListContacts)
			contacts.POST("/add", controllers.AddContact)
			contacts.DELETE("/:id", controllers.RemoveContact)
		}

		// Rotas de grupos
		groups := protected.Group("/groups")
		{
			groups.POST("", controllers.CreateGroup)
			groups.GET("", controllers.ListGroups)
		}

		// Rotas de conversas
		conversations := protected.Group("/conversations")
		{
			conversations.GET("", controllers.ListConversations)
			conversations.POST("", controllers.CreateConversation)
			conversations.GET("/:id/messages", controllers.GetMessages)
			conversations.POST("/:id/messages", controllers.SendMessage)
		}
	}
}