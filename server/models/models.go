package models

import (
	"time"
	"gorm.io/gorm"
	"encoding/json"
)

// EncryptedMessage representa a estrutura de uma mensagem criptografada
type EncryptedMessage struct {
	A string `json:"a"`
	B string `json:"b"`
}

// ChatMessage representa uma mensagem no chat
type ChatMessage struct {
	ID                uint            `gorm:"primaryKey" json:"id"`
	SenderId          string          `json:"senderId"`
	EncryptedContent  EncryptedMessage `json:"encryptedContent" gorm:"-"`
	EncryptedContentRaw string        `json:"-" gorm:"type:JSON"`
	Timestamp         time.Time       `json:"timestamp"`
}

// BeforeSave é um hook que é chamado antes de salvar um ChatMessage
func (c *ChatMessage) BeforeSave(tx *gorm.DB) (err error) {
	bytes, err := json.Marshal(c.EncryptedContent)
	if err != nil {
		return err
	}
	c.EncryptedContentRaw = string(bytes)
	return
}

// AfterFind é um hook que é chamado depois de recuperar um ChatMessage
func (c *ChatMessage) AfterFind(tx *gorm.DB) (err error) {
	err = json.Unmarshal([]byte(c.EncryptedContentRaw), &c.EncryptedContent)
	return
}

// PublicKey representa a chave pública de um usuário
type PublicKey struct {
	P string `json:"p"`
	G string `json:"g"`
	Y string `json:"y"`
}

// User representa um usuário no sistema
type User struct {
	UserId       string    `json:"userId" gorm:"primaryKey"`
	Username     string    `json:"username"`     // Novo campo para nome de usuário
	PasswordHash string    `json:"-"`            // Hash da senha (não exposto via JSON)
	PublicKey    PublicKey `json:"publicKey" gorm:"embedded"`
	LastActivity time.Time `json:"-"`
}

// Group representa um grupo de chat
type Group struct {
	GroupID    string   `json:"groupId" gorm:"primaryKey"`
	Members    []string `json:"members" gorm:"-"`
	MembersRaw string   `json:"-" gorm:"type:JSON"`
	SenderKey  string   `json:"senderKey"` // Chave do remetente criptografada
}

// BeforeSave é um hook que é chamado antes de salvar um Group
func (g *Group) BeforeSave(tx *gorm.DB) (err error) {
	data, err := json.Marshal(g.Members)
	if err != nil {
		return err
	}
	g.MembersRaw = string(data)
	return nil
}

// AfterFind é um hook que é chamado depois de recuperar um Group
func (g *Group) AfterFind(tx *gorm.DB) (err error) {
	err = json.Unmarshal([]byte(g.MembersRaw), &g.Members)
	return
}
