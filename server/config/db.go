package config

import (
	"log"
	"server/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDatabase() {
	var err error
	DB, err = gorm.Open(sqlite.Open("chat_e2ee.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Falha ao conectar ao banco de dados:", err)
	}

	// Migrar os esquemas
	err = DB.AutoMigrate(
		&models.User{},
		&models.Contact{},
		&models.Group{},
		&models.GroupMember{},
		&models.Conversation{},
		&models.Message{},
		&models.ConversationUser{},
	)
	if err != nil {
		log.Fatal("Falha ao migrar o banco de dados:", err)
	}
}