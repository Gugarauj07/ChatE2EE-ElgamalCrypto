package models

import (
	"time"
)

// User representa um usuário do sistema
type User struct {
	ID                  string    `gorm:"primaryKey"`
	Username            string    `gorm:"unique;not null"`
	PasswordHash        string    `gorm:"not null"`
	EncryptedPrivateKey []byte
	PublicKey           []byte
	CreatedAt           time.Time
	LastSeen            time.Time

	// Relacionamentos
	Conversations []Conversation `gorm:"many2many:conversations_users;"`
	Groups        []Group        `gorm:"foreignKey:AdminID"`
}