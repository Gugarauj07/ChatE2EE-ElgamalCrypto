package models

import (
	"time"
)

// User representa um usuário do sistema
type User struct {
	ID                  string         `json:"id" gorm:"primaryKey"`
	Username            string         `json:"username" gorm:"unique"`
	PasswordHash        string         `json:"-"`
	EncryptedPrivateKey string         `json:"encryptedPrivateKey"`
	PublicKey           PublicKeyData  `json:"publicKey" gorm:"serializer:json"`
	CreatedAt           time.Time      `json:"createdAt"`
	LastSeen           time.Time      `json:"lastSeen"`

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