// server/services/auth_service.go
package services

import (
	"time"

	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"
	"server/config"
)

// HashPassword cria um hash a partir de uma senha fornecida
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash compara uma senha com seu hash
func CheckPasswordHash(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// GenerateJWT gera um token JWT para um usuário específico
func GenerateJWT(userID string) (string, error) {
	// Definir as declarações/claims
	claims := jwt.MapClaims{}
	claims["authorized"] = true
	claims["user_id"] = userID
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix() // Validade de 72 horas

	// Criar o token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Assinar o token com a chave secreta do config
	return token.SignedString(config.JWTSecret)
}