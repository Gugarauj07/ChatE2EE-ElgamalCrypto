package utils

import (
	"github.com/google/uuid"
)

// GenerateUUID gera um UUID v4
func GenerateUUID() string {
	return uuid.New().String()
} 