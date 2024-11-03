package models

import (
	"time"
)

type Contact struct {
	UserID     string    `gorm:"primaryKey"`
	ContactID  string    `gorm:"primaryKey"`
	Nickname   string    `gorm:"not null"`
	AddedAt    time.Time
}