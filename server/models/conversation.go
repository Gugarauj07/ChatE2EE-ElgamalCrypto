package models

import (
	"time"
)

// Conversation representa uma conversa entre usuários ou grupos
type Conversation struct {
	ID              string    `gorm:"primaryKey"`
	Type            string    `gorm:"not null"` // "individual" ou "group"
	CreatedAt       time.Time
	GroupID         *string   `gorm:"index"` // Nullable para conversas individuais
	EncryptedKey    []byte    `gorm:"not null"` // Chave de conversa criptografada

	// Relacionamentos
	Messages      []Message `gorm:"foreignKey:ConversationID"`
	Participating []User    `gorm:"many2many:conversations_users;"`
}