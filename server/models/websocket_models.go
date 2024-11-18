package models

import "encoding/json"

// AuthMessage representa a mensagem de autenticação enviada pelo cliente
type AuthMessage struct {
	Token string `json:"token"`
}

// WSMessage representa uma mensagem genérica no WebSocket
type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
} 