package models

import (
	"time"
)

type GroupMember struct {
	GroupID  string    `gorm:"primaryKey"`
	UserID   string    `gorm:"primaryKey"`
	JoinedAt time.Time

	// Relacionamentos
	Group Group `gorm:"foreignKey:GroupID"`
	User  User  `gorm:"foreignKey:UserID"`
} 