// server/models/encrypted_key_map.go

package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type EncryptedKeyMap map[string]EncryptedMessage

// Value implementa a interface driver.Valuer para converter o EncryptedKeyMap em um valor que o banco de dados pode armazenar.
func (e EncryptedKeyMap) Value() (driver.Value, error) {
	return json.Marshal(e)
}

// Scan implementa a interface sql.Scanner para converter os dados do banco de dados em um EncryptedKeyMap.
func (e *EncryptedKeyMap) Scan(value interface{}) error {
	if value == nil {
		*e = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal EncryptedKeyMap: unsupported type %T", value)
	}

	return json.Unmarshal(bytes, e)
}