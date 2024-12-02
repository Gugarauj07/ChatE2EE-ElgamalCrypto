package models

import (
	"time"
)

type Message struct {
	ID             string    `gorm:"primaryKey" json:"id"`
	ConversationID string    `gorm:"index;not null" json:"conversationId"`
	SenderID       string    `gorm:"index;not null" json:"senderId"`
	CreatedAt      time.Time `json:"createdAt"`

	// Relacionamentos
	Conversation Conversation       `gorm:"foreignKey:ConversationID"`
	Sender       User              `gorm:"foreignKey:SenderID"`
	Recipients   []MessageRecipient `gorm:"foreignKey:MessageID"`
}

type MessageRecipient struct {
	ID               string        `gorm:"primaryKey" json:"id"`
	MessageID        string        `gorm:"index;not null" json:"messageId"`
	RecipientID      string        `gorm:"index;not null" json:"recipientId"`
	EncryptedContent ElGamalContent `gorm:"type:jsonb" json:"encryptedContent"`
	Status           string        `gorm:"not null" json:"status"`
	StatusUpdatedAt  time.Time     `json:"statusUpdatedAt"`

	// Relacionamentos
	Message   Message `gorm:"foreignKey:MessageID"`
	Recipient User    `gorm:"foreignKey:RecipientID"`
}

type ElGamalContent struct {
	A string `json:"a"`
	B string `json:"b"`
	P string `json:"p"`
}