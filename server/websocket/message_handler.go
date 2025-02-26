package websocket

import (
	"encoding/json"
	"log"
	"server/config"
	"server/models"
	"server/utils"
	"time"
)

type WSMessagePayload struct {
    ConversationID    string                           `json:"conversationId"`
    SenderID          string                           `json:"senderId"`
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

func (h *Hub) HandleMessage(messageType string, payload json.RawMessage, senderID string) error {
    log.Printf("HandleMessage chamado - Type: %s, SenderID: %s", messageType, senderID)
    log.Printf("Payload recebido: %s", string(payload))

    switch messageType {
    case "message":
        var messagePayload struct {
            ConversationID    string                           `json:"conversationId"`
            EncryptedContents map[string]models.ElGamalContent `json:"encryptedContents"`
        }

        if err := json.Unmarshal(payload, &messagePayload); err != nil {
            log.Printf("Erro ao decodificar payload: %v", err)
            return err
        }

        log.Printf("Mensagem decodificada - ConversationID: %s", messagePayload.ConversationID)

        // Buscar participantes da conversa
        var conversation models.Conversation
        if err := config.DB.Preload("Participants").First(&conversation, "id = ?", messagePayload.ConversationID).Error; err != nil {
            log.Printf("Erro ao buscar conversa: %v", err)
            return err
        }

        // Criar a mensagem no banco
        message := models.Message{
            ID:             utils.GenerateUUID(),
            ConversationID: messagePayload.ConversationID,
            SenderID:       senderID,
            CreatedAt:      time.Now(),
        }

        tx := config.DB.Begin()

        if err := tx.Create(&message).Error; err != nil {
            tx.Rollback()
            log.Printf("Erro ao criar mensagem: %v", err)
            return err
        }

        // Salvar os conteúdos criptografados para cada destinatário
        for recipientID, content := range messagePayload.EncryptedContents {
            recipient := models.MessageRecipient{
                ID:               utils.GenerateUUID(),
                MessageID:        message.ID,
                RecipientID:      recipientID,
                EncryptedContent: content,
                Status:           "SENT",
                StatusUpdatedAt:  time.Now(),
            }

            if err := tx.Create(&recipient).Error; err != nil {
                tx.Rollback()
                log.Printf("Erro ao criar destinatário: %v", err)
                return err
            }
        }

        if err := tx.Commit().Error; err != nil {
            log.Printf("Erro ao commit da transação: %v", err)
            return err
        }

        // Obter lista de IDs dos participantes
        recipientIDs := make([]string, len(conversation.Participants))
        for i, participant := range conversation.Participants {
            recipientIDs[i] = participant.UserID
        }

        // Broadcast para todos os participantes
        broadcastPayload := map[string]interface{}{
            "id":               message.ID,
            "conversationId":   message.ConversationID,
            "senderId":         senderID,
            "createdAt":        message.CreatedAt.Format(time.RFC3339),
            "encryptedContents": messagePayload.EncryptedContents,
        }

        payloadBytes, err := json.Marshal(broadcastPayload)
        if err != nil {
            log.Printf("Erro ao serializar payload: %v", err)
            return err
        }

        log.Printf("Enviando broadcast para %d destinatários", len(recipientIDs))
        broadcastMessage := BroadcastMessage{
            Type:       "message",
            Recipients: recipientIDs,
            Payload:    payloadBytes,
        }

        h.Broadcast <- broadcastMessage

        // Notificar atualização de conversa
        updateNotification := BroadcastMessage{
            Type:       "conversation_update",
            Recipients: recipientIDs,
            Payload:    json.RawMessage(`{}`),
        }

        h.Broadcast <- updateNotification
    }

    return nil
}
