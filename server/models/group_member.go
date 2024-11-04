package models

import (
	"time"
)

// GroupMember representa a associação entre grupos e usuários, incluindo a sender key criptografada
type GroupMember struct {
	ID                string    `gorm:"primaryKey"`
	GroupID           string    `gorm:"index;not null"`
	UserID            string    `gorm:"index;not null"`
	EncryptedSenderKey []byte    `gorm:"not null"`
	JoinedAt          time.Time `gorm:"not null"`
}