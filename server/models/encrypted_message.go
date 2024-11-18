// server/models/encrypted_message.go

package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type EncryptedMessage struct {
	A string `json:"a"`
	B string `json:"b"`
	P string `json:"p"`
}

// Value implementa a interface driver.Valuer para converter EncryptedMessage em JSON
func (e EncryptedMessage) Value() (driver.Value, error) {
	return json.Marshal(e)
}

// Scan implementa a interface sql.Scanner para converter JSON de volta para EncryptedMessage
func (e *EncryptedMessage) Scan(value interface{}) error {
	if value == nil {
		*e = EncryptedMessage{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal EncryptedMessage: unsupported type %T", value)
	}

	return json.Unmarshal(bytes, e)
}