package db

import (
	"fmt"
	"log"
	"server/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Init inicializa a conexão com o banco de dados
func Init() {
	var err error
	DB, err = gorm.Open(sqlite.Open("chat.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Erro ao conectar ao banco de dados: %v", err)
	}

	// Migrar os modelos para o banco de dados
	err = DB.AutoMigrate(&models.User{}, &models.Group{}, &models.ChatMessage{})
	if err != nil {
		log.Fatalf("Erro ao migrar modelos: %v", err)
	}

	fmt.Println("Conexão com o banco de dados estabelecida com sucesso!")
}

