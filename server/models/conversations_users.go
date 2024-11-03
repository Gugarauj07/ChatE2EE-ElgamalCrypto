package models

type ConversationsUsers struct {
	ConversationID string `gorm:"primaryKey"`
	UserID         string `gorm:"primaryKey"`
} 