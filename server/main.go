package main

import (
	"log"
	"os"
	"server/config"
	"server/routes"
	"server/websocket"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
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
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "Sec-WebSocket-Protocol"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Configurar rotas
	routes.SetupRoutes(router, hub)

	// Ler a porta a partir da variável de ambiente
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Iniciar o servidor na porta especificada
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Falha ao iniciar o servidor:", err)
	}
}