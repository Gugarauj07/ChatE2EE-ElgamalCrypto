// server/models/conversation.go

package models

import (
	"time"
)

type Conversation struct {
	ID            string           `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time        `json:"created_at"`
	GroupID       *string          `json:"group_id,omitempty"`
	EncryptedKeys EncryptedKeyMap  `gorm:"type:jsonb" json:"encrypted_keys"`
	Participants  []ConversationParticipant  `json:"participants"`
	Messages      []Message        `json:"messages"`
}

type ConversationParticipant struct {
	ID             string           `gorm:"primaryKey"`
	ConversationID string           `gorm:"index;not null"`
	UserID         string           `gorm:"index;not null"`
	EncryptedKey   EncryptedMessage `gorm:"type:jsonb" json:"encrypted_key"`
	JoinedAt       time.Time        `gorm:"not null" json:"joined_at"`
}