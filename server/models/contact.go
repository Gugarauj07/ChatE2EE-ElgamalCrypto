package models

import (
	"time"
)

type Contact struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	UserID    string    `gorm:"index;not null" json:"user_id"`
	ContactID string    `gorm:"index;not null" json:"contact_id"`
	AddedAt   time.Time `json:"added_at"`

	User    User `gorm:"foreignKey:UserID"`
	Contact User `gorm:"foreignKey:ContactID"`
}