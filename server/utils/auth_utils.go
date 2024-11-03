package utils

import (
	"errors"

	"github.com/gin-gonic/gin"
)

// GetUserIDFromContext extrai o ID do usuário do contexto Gin
func GetUserIDFromContext(c *gin.Context) (string, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", errors.New("ID do usuário não encontrado no contexto")
	}

	userIDStr, ok := userID.(string)
	if !ok {
		return "", errors.New("ID do usuário inválido")
	}

	return userIDStr, nil
} 