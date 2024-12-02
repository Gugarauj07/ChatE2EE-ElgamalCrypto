// server/models/encrypted_message.go

package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type ElGamalContent struct {
	A string `json:"a"`
	B string `json:"b"`
	P string `json:"p"`
}

// Implementa a interface driver.Valuer para converter ElGamalContent em JSON
func (e ElGamalContent) Value() (driver.Value, error) {
	return json.Marshal(e)
}

// Implementa a interface sql.Scanner para converter JSON de volta para ElGamalContent
func (e *ElGamalContent) Scan(value interface{}) error {
	if value == nil {
		*e = ElGamalContent{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal ElGamalContent: unsupported type %T", value)
	}

	return json.Unmarshal(bytes, e)
}