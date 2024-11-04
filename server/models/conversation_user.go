package models

import (
	"time"
)

// ConversationUser representa a associação entre conversas e usuários
type ConversationUser struct {
	ID             string    `gorm:"primaryKey"`
	ConversationID string    `gorm:"index;not null"`
	UserID         string    `gorm:"index;not null"`
	JoinedAt       time.Time `gorm:"not null"`
} 