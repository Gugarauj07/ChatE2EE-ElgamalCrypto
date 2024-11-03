package models

import (
	"time"
)

type Message struct {
	ID              string    `gorm:"primaryKey"`
	ConversationID  string    `gorm:"not null;index"`
	SenderID        string    `gorm:"not null;index"`
	EncryptedContent []byte    `gorm:"not null"`
	CreatedAt       time.Time
	IsDelivered     bool

	// Relacionamentos
	Conversation Conversation `gorm:"foreignKey:ConversationID"`
	Sender       User         `gorm:"foreignKey:SenderID"`
}