package models

import (
	"math/big"
	"time"
)

type KeyPair struct {
	PublicKey  *big.Int `json:"publicKey"`
	PrivateKey *big.Int `json:"privateKey"`
}

type EncryptedMessage struct {
    A string `json:"a"`
    B string `json:"b"`
}

type ChatMessage struct {
    SenderId        string           `json:"senderId"`
    EncryptedContent EncryptedMessage `json:"encryptedContent"`
    Timestamp       time.Time        `json:"timestamp"`
    IsRead          bool             `json:"isRead"`
}

type PublicKey struct {
	P string `json:"p"`
	G int64  `json:"g"`
	Y string `json:"y"`
}

type PublicKeyJSON struct {
	P interface{} `json:"p"`
	G int64       `json:"g"`
	Y interface{} `json:"y"`
}

type UserJSON struct {
	UserId    string        `json:"userId"`
	PublicKey PublicKeyJSON `json:"publicKey"`
}

type User struct {
	UserId       string    `json:"userId"`
	PublicKey    PublicKey `json:"publicKey"`
	LastActivity time.Time  `json:"-"`
}

// SendMessageRequest representa a estrutura de requisição para enviar uma mensagem
type SendMessageRequest struct {
	EncryptedMessage struct {
		A string `json:"a"`
		B string `json:"b"`
	} `json:"encryptedMessage"`
	SenderId   string `json:"senderId"`
	ReceiverId string `json:"receiverId"`
}

// ReceiveMessagesRequest representa a estrutura de requisição para receber mensagens
type ReceiveMessagesRequest struct {
	UserId string `json:"userId"`
}