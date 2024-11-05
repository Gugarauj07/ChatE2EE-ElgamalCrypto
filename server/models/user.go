package models

import (
	"time"
)

// User representa um usuário do sistema
type User struct {
	ID                  string    `json:"id" gorm:"primaryKey"`
	Username            string    `json:"username" gorm:"unique"`
	PasswordHash        string    `json:"-"`
	EncryptedPrivateKey string    `json:"encrypted_private_key"`
	PublicKey           PublicKeyData `json:"public_key" gorm:"embedded"`
	CreatedAt           time.Time
	LastSeen            time.Time

	// Relacionamentos
	Conversations []Conversation `gorm:"many2many:conversations_users;"`
	Groups        []Group        `gorm:"foreignKey:AdminID"`
}

type PublicKeyData struct {
	P string `json:"p"`
	G string `json:"g"`
	Y string `json:"y"`
}