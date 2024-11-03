package config

import (
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"server/models"
)

var DB *gorm.DB

// ConnectDatabase inicializa a conexão com o banco de dados SQLite e realiza as migrações
func ConnectDatabase() {
	var err error
	DB, err = gorm.Open(sqlite.Open("chat_e2ee.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Falha ao conectar ao banco de dados: %v", err)
	}

	log.Println("Conexão com o banco de dados estabelecida com sucesso!")

	// Realizar as migrações
	err = DB.AutoMigrate(
		&models.User{},
		&models.Contact{},
		&models.Conversation{},
		&models.Message{},
		&models.Group{},
		&models.GroupMember{},
		&models.ConversationsUsers{},
	)
	if err != nil {
		log.Fatalf("Falha ao migrar o banco de dados: %v", err)
	}

	log.Println("Migrações realizadas com sucesso!")
}