package models

import "time"

// Group representa um grupo de conversa
type Group struct {
	ConversationID string `gorm:"primaryKey" json:"conversation_id"`
	Name           string `gorm:"not null" json:"name"`
	AdminID        string `gorm:"index;not null" json:"admin_id"`
	CreatedAt      time.Time `json:"created_at"`

	// Relacionamentos
	Conversation Conversation `gorm:"foreignKey:ConversationID"`
	Admin        User        `gorm:"foreignKey:AdminID"`
}