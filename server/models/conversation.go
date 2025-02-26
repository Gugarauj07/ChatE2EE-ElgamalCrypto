// server/models/conversation.go

package models

import (
	"time"
)

type Conversation struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Type      string    `gorm:"not null" json:"type"` // GROUP ou DIRECT
	CreatedAt time.Time `json:"created_at"`

	// Relacionamentos
	Participants []ConversationParticipant `gorm:"foreignKey:ConversationID"`
	Messages     []Message                 `gorm:"foreignKey:ConversationID"`
}

type ConversationParticipant struct {
	ID             string    `gorm:"primaryKey" json:"id"`
	ConversationID string    `gorm:"index;not null" json:"conversation_id"`
	UserID         string    `gorm:"index;not null" json:"user_id"`
	JoinedAt       time.Time `json:"joined_at"`

	// Relacionamentos
	Conversation Conversation `gorm:"foreignKey:ConversationID"`
	User         User        `gorm:"foreignKey:UserID"`
}

type ConversationParticipants []ConversationParticipant

func (p ConversationParticipants) GetUserIDs() []string {
	ids := make([]string, len(p))
	for i, participant := range p {
		ids[i] = participant.UserID
	}
	return ids
}