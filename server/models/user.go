package models

import (
	"time"
)

// User representa um usuário do sistema
type User struct {
	ID                 string    `gorm:"primaryKey" json:"id"`
	Username           string    `gorm:"unique;not null" json:"username"`
	PasswordHash       string    `json:"-"`
	EncryptedPrivateKey string    `json:"encrypted_private_key"`
	PublicKey          PublicKeyData `gorm:"serializer:json" json:"public_key"`
	CreatedAt          time.Time `json:"created_at"`
	LastSeen           time.Time `json:"last_seen"`

	// Relacionamentos
	Contacts []Contact `gorm:"foreignKey:UserID"`
	ConversationParticipants []ConversationParticipant `gorm:"foreignKey:UserID"`
}

// PublicKeyData ainda será útil para unmarshaling
type PublicKeyData struct {
	P string `json:"p"`
	G string `json:"g"`
	Y string `json:"y"`
}