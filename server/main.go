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
	// Configurar o fuso horário padrão para Brasil
	time.Local = time.FixedZone("BRT", -3*3600)

	// Inicializar o banco de dados
	config.InitDatabase()

	// Criar e iniciar o Hub do WebSocket
	hub := websocket.NewHub()
	go hub.Run()

	// Configurar o router
	router := gin.Default()

	// Configurar CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
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