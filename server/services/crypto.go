package services

import (
	"crypto/rand"
	"math/big"
	"server/models"
)

var (
	p *big.Int // Número primo grande
	g *big.Int // Gerador
)

func init() {
	// Inicializa p e g (em uma implementação real, estes seriam números maiores)
	p, _ = new(big.Int).SetString("2410312426921032588552076022197566074856950548502459942654116941958108831682612228890093858261341614673227141477904012196503648957050582631942730706805009223062734745341073406696246014589361659774041027169249453200378729434170325843778659198143763193776859869524088940195577346119843545301547043747207749969763750084308926339295559968882457872412993810129130294592999947926365264059284647209730384947211681434464714438488520940127459844288859336526896320919633919", 10)
	g = big.NewInt(2)
}

func GenerateKeys() (models.KeyPair, error) {
	// Gera a chave privada
	privateKey, err := rand.Int(rand.Reader, new(big.Int).Sub(p, big.NewInt(2)))
	if err != nil {
		return models.KeyPair{}, err
	}
	privateKey.Add(privateKey, big.NewInt(1)) // Garante que seja entre 1 e p-1

	// Calcula a chave pública
	publicKey := new(big.Int).Exp(g, privateKey, p)

	return models.KeyPair{
		PrivateKey: privateKey.Int64(),
		PublicKey:  publicKey.Int64(),
	}, nil
}

func Encrypt(message string, publicKey models.PublicKey) models.EncryptedMessage {
	m := new(big.Int).SetBytes([]byte(message))
	k, _ := rand.Int(rand.Reader, new(big.Int).Sub(p, big.NewInt(2)))
	k.Add(k, big.NewInt(1)) // Garante que k esteja entre 1 e p-1

	c1 := new(big.Int).Exp(g, k, p)
	s := new(big.Int).Exp(big.NewInt(int64(publicKey)), k, p)
	c2 := new(big.Int).Mul(m, s)
	c2.Mod(c2, p)

	return models.EncryptedMessage{
		C1: c1.String(),
		C2: c2.String(),
	}
}

func Decrypt(encryptedMessage models.EncryptedMessage, privateKey int) string {
	c1, _ := new(big.Int).SetString(encryptedMessage.C1, 10)
	c2, _ := new(big.Int).SetString(encryptedMessage.C2, 10)

	s := new(big.Int).Exp(c1, big.NewInt(int64(privateKey)), p)
	s.ModInverse(s, p)
	m := new(big.Int).Mul(c2, s)
	m.Mod(m, p)

	return string(m.Bytes())
}