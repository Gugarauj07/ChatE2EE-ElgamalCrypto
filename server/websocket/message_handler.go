package websocket

import (
    "encoding/json"
    "server/config"
    "server/models"
    "server/utils"
    "time"
)

type WSMessagePayload struct {
    ConversationID string                           `json:"conversationId"`
    SenderID       string                           `json:"senderId"`
    EncryptedContents map[string]models.ElGamalContent `json:"encryptedContents"`
}

func ProcessMessage(messageBytes []byte) error {
    var wsMessage struct {
        Type    string          `json:"type"`
        Payload json.RawMessage `json:"payload"`
    }

    if err := json.Unmarshal(messageBytes, &wsMessage); err != nil {
        return err
    }

    if wsMessage.Type == "message" {
        var payload WSMessagePayload
        if err := json.Unmarshal(wsMessage.Payload, &payload); err != nil {
            return err
        }

        // Criar a mensagem no banco
        message := models.Message{
            ID:             utils.GenerateUUID(),
            ConversationID: payload.ConversationID,
            SenderID:       payload.SenderID,
            CreatedAt:      time.Now(),
        }

        tx := config.DB.Begin()

        if err := tx.Create(&message).Error; err != nil {
            tx.Rollback()
            return err
        }

        // Salvar os conteúdos criptografados para cada destinatário
        for recipientID, content := range payload.EncryptedContents {
            recipient := models.MessageRecipient{
                ID:               utils.GenerateUUID(),
                MessageID:        message.ID,
                RecipientID:     recipientID,
                EncryptedContent: content,
                Status:          "SENT",
                StatusUpdatedAt: time.Now(),
            }

            if err := tx.Create(&recipient).Error; err != nil {
                tx.Rollback()
                return err
            }
        }

        return tx.Commit().Error
    }

    return nil
}
