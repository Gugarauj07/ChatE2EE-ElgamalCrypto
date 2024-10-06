package models

type KeyPair struct {
	PublicKey  int64 `json:"publicKey"`
	PrivateKey int64 `json:"privateKey"`
}


type EncryptedMessage struct {
	C1 string `json:"c1"`
	C2 string `json:"c2"`
}

type ChatMessage struct {
	SenderId string `json:"senderId"`
	Content  string `json:"content"`
}

type User struct {
	UserId    string `json:"userId"`
	PublicKey string `json:"publicKey"`
}

type PublicKey int64