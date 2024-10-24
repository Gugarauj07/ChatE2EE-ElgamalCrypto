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
		api.POST("/register", handlers.RegisterHandler) // @Summary Registrar usuário
		api.POST("/login", handlers.LoginHandler)       // @Summary Login de usuário

		// Gestão de Usuários
		api.GET("/users/:userId", handlers.GetUserHandler) // @Summary Obter detalhes do usuário
		api.PUT("/users/:userId", handlers.UpdateUserHandler) // @Summary Atualizar informações do usuário

		// Gestão de Mensagens
		api.POST("/messages/send", handlers.SendMessageHandler) // @Summary Enviar uma mensagem
		api.GET("/messages", handlers.GetMessagesHandler)       // @Summary Recuperar mensagens

		// Gestão de Grupos
		api.POST("/groups", handlers.CreateGroupHandler)       // @Summary Criar grupo
		api.PUT("/groups/:groupId", handlers.EditGroupHandler) // @Summary Editar grupo
		api.DELETE("/groups/:groupId", handlers.DeleteGroupHandler) // @Summary Deletar grupo
	}
}
