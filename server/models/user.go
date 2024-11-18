package models

import (
	"time"
)

// User representa um usuário do sistema
type User struct {
	ID                 string    `gorm:"primaryKey" json:"id"`
	Username           string    `gorm:"unique;not null" json:"username"`
	PasswordHash       string    `json:"-"`
	EncryptedPrivateKey string   `json:"encrypted_private_key"`
	PublicKey          string    `json:"publicKey"`
	CreatedAt          time.Time `json:"created_at"`
	LastSeen           time.Time `json:"last_seen"`

	// Relacionamentos
	Conversations []Conversation `gorm:"many2many:conversations_users;"`
	Groups        []Group        `gorm:"foreignKey:AdminID"`
}

// PublicKeyData ainda será útil para unmarshaling
type PublicKeyData struct {
	P string `json:"p"`
	G string `json:"g"`
	Y string `json:"y"`
}