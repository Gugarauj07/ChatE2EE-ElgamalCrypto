package main

import (
	"log"
	"server/config"
	"server/controllers"
	"server/routes"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
)

func main() {
	// Inicializar o banco de dados
	config.InitDatabase()

	// Iniciar o Hub
	go controllers.WSHub.Run()

	// Configurar as rotas
	router := gin.Default()

	// Configurar CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
			"X-Requested-With",
		},
		ExposeHeaders:    []string{"Content-Length", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	routes.SetupRoutes(router)

	// Iniciar o servidor
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Falha ao iniciar o servidor: %v", err)
	}
}