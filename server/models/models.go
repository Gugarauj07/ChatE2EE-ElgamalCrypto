package models

import (
	"time"
)

type EncryptedMessage struct {
	A string `json:"a"`
	B string `json:"b"`
}

type ChatMessage struct {
	SenderId         string                            `json:"senderId"`
	EncryptedContent map[string]EncryptedMessage       `json:"encryptedContent"`
	Timestamp        time.Time                         `json:"timestamp"`
	IsRead           bool                              `json:"isRead"`
}

type PublicKey struct {
	P string `json:"p"`
	G string `json:"g"`
	Y string `json:"y"`
}

type User struct {
	UserId       string    `json:"userId"`
	PublicKey    PublicKey `json:"publicKey"`
	LastActivity time.Time `json:"-"`
}

// Removemos UserJSON e PublicKeyJSON, pois não são mais necessários