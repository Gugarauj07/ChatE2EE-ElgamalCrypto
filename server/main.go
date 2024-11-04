package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"server/config"
	"server/routes"
)

func main() {
	// Conectar ao banco de dados
	config.InitDatabase()

	router := gin.Default()
	// Configurar as rotas
	routes.SetupRoutes(router)

	// Iniciar o servidor na porta 8080
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Falha ao iniciar o servidor: %v", err)
	}
}