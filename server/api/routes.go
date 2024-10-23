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
		// Adicione mais rotas aqui conforme necessário
	}
}
