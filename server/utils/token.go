package utils

import (
    "errors"

    "github.com/dgrijalva/jwt-go"
)

var JWTSecret = []byte("sua_chave_secreta_aqui") // Substitua por uma chave segura

func ValidateToken(tokenString string) (string, error) {
    if tokenString == "" {
        return "", errors.New("token não fornecido")
    }

    // Parse do token
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        // Valide o método de assinatura
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("método de assinatura inválido")
        }
        return JWTSecret, nil
    })

    if err != nil {
        return "", err
    }

    if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
        userID, ok := claims["user_id"].(string)
        if !ok {
            return "", errors.New("user_id não encontrado no token")
        }
        return userID, nil
    }

    return "", errors.New("token inválido")
}