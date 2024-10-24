    // server/middleware/auth.go
    package middleware

    import (
    	"fmt"
    	"net/http"
    	"os"
    	"strings"

    	"github.com/gin-gonic/gin"
    	"github.com/golang-jwt/jwt/v4"
    )

    var jwtSecret []byte

    func init() {
    	secret := os.Getenv("JWT_SECRET")
    	if secret == "" {
    		panic("JWT_SECRET não está definido")
    	}
    	jwtSecret = []byte(secret)
    }

    func AuthMiddleware() gin.HandlerFunc {
    	return func(c *gin.Context) {
    		authHeader := c.GetHeader("Authorization")
    		if authHeader == "" {
    			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token de autorização ausente"})
    			c.Abort()
    			return
    		}

    		parts := strings.Split(authHeader, " ")
    		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
    			c.JSON(http.StatusUnauthorized, gin.H{"error": "Formato de token inválido"})
    			c.Abort()
    			return
    		}

    		tokenString := parts[1]

    		// Parse e validação do token
    		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
    			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
    				return nil, fmt.Errorf("método de assinatura inválido")
    			}
    			return jwtSecret, nil
    		})

    		if err != nil || !token.Valid {
    			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token de autorização inválido"})
    			c.Abort()
    			return
    		}

    		claims, ok := token.Claims.(jwt.MapClaims)
    		if !ok || !token.Valid {
    			c.JSON(http.StatusUnauthorized, gin.H{"error": "Reivindicações de token inválidas"})
    			c.Abort()
    			return
    		}

    		userId, ok := claims["userId"].(string)
    		if !ok {
    			c.JSON(http.StatusUnauthorized, gin.H{"error": "Reivindicações de usuário inválidas"})
    			c.Abort()
    			return
    		}

    		// Anexa o userId ao contexto para uso nas handlers
    		c.Set("userId", userId)

    		c.Next()
    	}
    }
