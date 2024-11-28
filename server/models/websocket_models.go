package models

import "encoding/json"

type WSMessage struct {
    Type    string          `json:"type"`
    Payload json.RawMessage `json:"payload"`
}

type AuthMessage struct {
    Token string `json:"token"`
}