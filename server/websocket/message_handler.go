package websocket

import (
	"encoding/json"
	"server/config"
	"server/models"
	"time"
)

type WSMessagePayload struct {
    ConversationID string                           `json:"conversationId"`
    SenderID       string                           `json:"senderId"`
    EncryptedContents map[string]models.ElGamalContent `json:"encryptedContents"`
}

type MessageStatusPayload struct {
    MessageID string `json:"messageId"`
    Status    string `json:"status"`
    UserID    string `json:"userId"`
}

func ProcessMessage(messageBytes []byte, userID string) ([]string, []byte, error) {
    var wsMessage struct {
        Type    string          `json:"type"`
        Payload json.RawMessage `json:"payload"`
    }

    if err := json.Unmarshal(messageBytes, &wsMessage); err != nil {
        return nil, nil, err
    }

    switch wsMessage.Type {
    case "message_sent":
        var payload struct {
            MessageID      string `json:"messageId"`
            ConversationID string `json:"conversationId"`
        }
        if err := json.Unmarshal(wsMessage.Payload, &payload); err != nil {
            return nil, nil, err
        }

        // Buscar a mensagem e seus destinatários
        var message models.Message
        if err := config.DB.
            Preload("Recipients").
            First(&message, "id = ?", payload.MessageID).Error; err != nil {
            return nil, nil, err
        }

        // Preparar o payload da mensagem para broadcast
        responsePayload := WSMessagePayload{
            ConversationID:    payload.ConversationID,
            SenderID:          message.SenderID,
            EncryptedContents: make(map[string]models.ElGamalContent),
        }

        // Adicionar conteúdo criptografado para cada destinatário
        recipients := make([]string, 0)
        for _, recipient := range message.Recipients {
            responsePayload.EncryptedContents[recipient.RecipientID] = recipient.EncryptedContent
            recipients = append(recipients, recipient.RecipientID)
        }

        // Serializar o payload
        payloadBytes, err := json.Marshal(responsePayload)
        if err != nil {
            return nil, nil, err
        }

        // Criar a mensagem completa
        response := struct {
            Type    string          `json:"type"`
            Payload json.RawMessage `json:"payload"`
        }{
            Type:    "message",
            Payload: payloadBytes,
        }

        // Serializar a mensagem completa
        responseBytes, err := json.Marshal(response)
        if err != nil {
            return nil, nil, err
        }

        return recipients, responseBytes, nil
    case "message_status":
        var payload MessageStatusPayload
        if err := json.Unmarshal(wsMessage.Payload, &payload); err != nil {
            return nil, nil, err
        }

        // Atualizar status no banco
        if err := config.DB.Model(&models.MessageRecipient{}).
            Where("message_id = ? AND recipient_id = ?", payload.MessageID, userID).
            Updates(map[string]interface{}{
                "status":            payload.Status,
                "status_updated_at": time.Now(),
            }).Error; err != nil {
            return nil, nil, err
        }

        // Buscar a mensagem para obter o remetente
        var message models.Message
        if err := config.DB.First(&message, "id = ?", payload.MessageID).Error; err != nil {
            return nil, nil, err
        }

        // Preparar resposta para notificar o remetente
        statusUpdate := struct {
            Type    string             `json:"type"`
            Payload MessageStatusPayload `json:"payload"`
        }{
            Type:    "status_update",
            Payload: payload,
        }

        responseBytes, err := json.Marshal(statusUpdate)
        if err != nil {
            return nil, nil, err
        }

        // Retornar apenas o remetente como destinatário
        return []string{message.SenderID}, responseBytes, nil
    }

    return nil, nil, nil
}
