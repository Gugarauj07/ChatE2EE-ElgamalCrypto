package models

import "time"

// DTOs para Conversation
type ConversationDTO struct {
    ID           string           `json:"id"`
    Type         string           `json:"type"`
    Name         string           `json:"name"`
    CreatedAt    time.Time        `json:"createdAt"`
    Participants []ParticipantDTO `json:"participants"`
    Messages     []MessageDTO     `json:"messages,omitempty"`
}

type ParticipantDTO struct {
    ID        string       `json:"id"`
    Username  string       `json:"username"`
    PublicKey PublicKeyData `json:"publicKey,omitempty"`
}

type MessageDTO struct {
    ID        string         `json:"id"`
    SenderID  string         `json:"senderId"`
    CreatedAt time.Time      `json:"createdAt"`
    Content   ElGamalContent `json:"content"`
    Status    string         `json:"status"`
}