package main

import (
	"log"
	"server/config"
	"server/websocket"
	"server/routes"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
)

func main() {
	// Inicializar o banco de dados
	config.InitDatabase()

	// Criar e iniciar o Hub do WebSocket
	hub := websocket.NewHub()
	go hub.Run()

	// Configurar o router
	router := gin.Default()

	// Configurar CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		 AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Configurar rotas
	routes.SetupRoutes(router, hub)

	// Iniciar o servidor
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Falha ao iniciar o servidor:", err)
	}
}