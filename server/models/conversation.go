package models

import (
	"time"
)

// Conversation representa uma conversa entre usuários ou grupos
type Conversation struct {
	ID        string    `gorm:"primaryKey"`
	CreatedAt time.Time
	GroupID   *string `gorm:"index"` // Nullable para conversas individuais tratadas como grupos com 2 participantes

	// Relacionamentos
	Messages      []Message `gorm:"foreignKey:ConversationID"`
	Participating []User    `gorm:"many2many:conversation_users;"`
}