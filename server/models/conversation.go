package models

import (
	"time"
)

type Conversation struct {
	ID        string     `gorm:"primaryKey"`
	Type      string     `gorm:"not null"` // Ex: "individual" ou "group"
	CreatedAt time.Time
	GroupID   *string    `gorm:"index"` // Pode ser null para conversas individuais

	// Relacionamentos
	Messages      []Message     `gorm:"foreignKey:ConversationID"`
	Group         *Group        `gorm:"foreignKey:GroupID"`
	Participating []User        `gorm:"many2many:conversations_users;"`
}