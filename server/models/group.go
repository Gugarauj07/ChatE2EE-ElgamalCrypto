package models

import "time"

// Group representa um grupo de conversa
type Group struct {
	ConversationID string `gorm:"primaryKey" json:"conversationId"`
	Name           string `gorm:"not null" json:"name"`
	AdminID        string `gorm:"index;not null" json:"adminId"`
	CreatedAt      time.Time `json:"createdAt"`

	// Relacionamentos
	Conversation Conversation `gorm:"foreignKey:ConversationID"`
	Admin        User        `gorm:"foreignKey:AdminID"`
}