package models

import (
	"time"
)

type Message struct {
	ID             string    `gorm:"primaryKey" json:"id"`
	ConversationID string    `gorm:"index;not null" json:"conversation_id"`
	SenderID       string    `gorm:"index;not null" json:"sender_id"`
	CreatedAt      time.Time `json:"created_at"`

	// Relacionamentos
	Conversation Conversation       `gorm:"foreignKey:ConversationID"`
	Sender       User              `gorm:"foreignKey:SenderID"`
	Recipients   []MessageRecipient `gorm:"foreignKey:MessageID"`
}

type MessageRecipient struct {
	ID              string        `gorm:"primaryKey" json:"id"`
	MessageID       string        `gorm:"index;not null" json:"message_id"`
	RecipientID     string        `gorm:"index;not null" json:"recipient_id"`
	EncryptedContent ElGamalContent `gorm:"type:jsonb" json:"encrypted_content"`
	Status          string        `gorm:"not null" json:"status"` // SENT, RECEIVED, READ
	StatusUpdatedAt time.Time     `json:"status_updated_at"`

	// Relacionamentos
	Message   Message `gorm:"foreignKey:MessageID"`
	Recipient User    `gorm:"foreignKey:RecipientID"`
}

type ElGamalContent struct {
	A string `json:"a"`
	B string `json:"b"`
	P string `json:"p"`
}