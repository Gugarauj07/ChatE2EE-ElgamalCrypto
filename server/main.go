package main

import (
	"server/api"
	"server/db"
	_ "server/docs"
	"server/ws"

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


	// Rota do Swagger
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Inicialize o banco de dados
	db.Init()

	// Inicialize as rotas da API
	api.SetupRoutes(r)

	// Inicialize o WebSocket
	ws.SetupRoutes(r)

	r.Run(":3000")
}
