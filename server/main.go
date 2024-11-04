package main

import (
	"log"
	"server/config"
	"server/controllers"
	"server/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// Inicializar o banco de dados
	config.InitDatabase()

	// Iniciar o Hub
	go controllers.WSHub.Run()

	// Configurar as rotas
	router := gin.Default()
	routes.ProtectedRoutes(router)

	// Iniciar o servidor
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Falha ao iniciar o servidor: %v", err)
	}
}