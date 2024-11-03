package routes

import (
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	// Rotas públicas (auth)
	AuthRoutes(router)

	// Rotas protegidas
	ProtectedRoutes(router)
}