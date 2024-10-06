package main

import (
	"server/api"
	_ "server/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title Chat API
// @version 1.0
// @description Esta é uma API de servidor de chat simples.
// @host localhost:3000
// @BasePath /
func main() {
	r := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173"} 
	r.Use(cors.New(config))

	// Rotas
	r.POST("/connect", api.Connect)
	r.POST("/disconnect", api.Disconnect)
	r.GET("/users", api.GetUsers)
	r.GET("/public-key/:userId", api.GetPublicKey)
	r.POST("/send-message", api.SendMessage)
	r.POST("/receive-messages", api.ReceiveMessages)

	// Rota do Swagger
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	r.Run(":3000")
}