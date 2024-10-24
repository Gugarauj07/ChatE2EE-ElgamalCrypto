package ws

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"server/db"
	"server/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/websocket"
)

var jwtSecret []byte

func init() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		panic("JWT_SECRET não está definido")
	}
	jwtSecret = []byte(secret)
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Implementar verificação de origem se necessário
		return true
	},
}

// Clients conectados (exportado para acesso externo)
var Clients = make(map[string]*websocket.Conn)

// Broadcast canal para mensagens
var Broadcast = make(chan models.ChatMessage)

// WebSocketHandler gerencia a conexão WebSocket
// @Summary Conectar ao WebSocket
// @Description Estabelece uma conexão WebSocket para o usuário
// @Tags WebSocket
// @Accept json
// @Produce json
// @Param token query string true "JWT Token"
// @Success 101 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /ws [get]
func WebSocketHandler(c *gin.Context) {
	tokenString := c.Query("token")
	if tokenString == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token ausente"})
		return
	}

	// Parse e validação do token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de assinatura inválido")
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Reivindicações de token inválidas"})
		return
	}

	userId, ok := claims["userId"].(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Reivindicações de usuário inválidas"})
		return
	}

	// Atualiza o último horário de atividade do usuário
	if err := db.DB.Model(&models.User{}).Where("user_id = ?", userId).Update("last_activity", time.Now()).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar atividade do usuário"})
		return
	}

	// Upgrade da conexão HTTP para WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao estabelecer conexão WebSocket"})
		return
	}

	// Armazena a conexão no mapa de clientes
	Clients[userId] = conn

	// Gerencia a conexão
	go handleClient(userId, conn)
}

func handleClient(userId string, conn *websocket.Conn) {
	defer func() {
		conn.Close()
		delete(Clients, userId)
	}()

	for {
		// Lê mensagens do cliente (implementação conforme necessidade)
		var message interface{}
		if err := conn.ReadJSON(&message); err != nil {
			fmt.Printf("Erro ao ler mensagem do usuário %s: %v\n", userId, err)
			break
		}

		// Processa a mensagem recebida (implementação conforme necessidade)
		fmt.Printf("Mensagem recebida de %s: %v\n", userId, message)
	}
}

// WSRoutes configura as rotas de WebSocket
func WSRoutes(router *gin.Engine) {
	router.GET("/ws", WebSocketHandler)

	// Goroutine para broadcast de mensagens
	go func() {
		for {
			msg := <-Broadcast
			if conn, ok := Clients[msg.RecipientId]; ok {
				conn.WriteJSON(msg)
			} else {
				// Se RecipientId for um grupo, enviar para todos os membros
				var group models.Group
				if err := db.DB.Where("group_id = ?", msg.RecipientId).First(&group).Error; err == nil {
					for _, memberId := range group.Members {
						if memberConn, exists := Clients[memberId]; exists {
							memberConn.WriteJSON(msg)
						}
					}
				}
			}
		}
	}()
}
