// server/middlewares/auth_middleware.go
package middlewares

import (
	"net/http"
	"strings"

	"server/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token não fornecido"})
			c.Abort()
			return
		}

		// Remover o prefixo "Bearer " do token
		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)

		// Validar o token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return config.JWTSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
			c.Abort()
			return
		}

		// Extrair claims do token
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
			c.Abort()
			return
		}

		// Adicionar o ID do usuário ao contexto
		c.Set("user_id", claims["user_id"])
		c.Next()
	}
}