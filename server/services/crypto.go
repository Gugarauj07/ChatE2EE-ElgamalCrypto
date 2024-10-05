package services

import (
	"crypto/rand"
	"math/big"
	"server/models"
)

// Parâmetros globais do sistema ElGamal
var (
	p *big.Int // p: Número primo grande (módulo)
	g *big.Int // g: Gerador do grupo multiplicativo módulo p
)

func init() {
	// Inicialização dos parâmetros globais
	// p: Um número primo grande que define o tamanho do grupo cíclico
	// g: Um gerador do grupo multiplicativo módulo p
	p, _ = new(big.Int).SetString("2410312426921032588552076022197566074856950548502459942654116941958108831682612228890093858261341614673227141477904012196503648957050582631942730706805009223062734745341073406696246014589361659774041027169249453200378729434170325843778659198143763193776859869524088940195577346119843545301547043747207749969763750084308926339295559968882457872412993810129130294592999947926365264059284647209730384947211681434464714438488520940127459844288859336526896320919633919", 10)
	g = big.NewInt(2)
	// Nota: Em uma implementação real, p seria um número primo muito maior e g seria escolhido cuidadosamente
}

// GenerateKeys gera um par de chaves pública e privada para o ElGamal
func GenerateKeys() (models.KeyPair, error) {
	// 1. Geração da chave privada
	// A chave privada é um número aleatório x, onde 1 < x < p-1
	privateKey, err := rand.Int(rand.Reader, new(big.Int).Sub(p, big.NewInt(2)))
	if err != nil {
		return models.KeyPair{}, err
	}
	privateKey.Add(privateKey, big.NewInt(1)) // Garante que seja entre 1 e p-1

	// 2. Cálculo da chave pública
	// A chave pública y é calculada como y = g^x mod p
	publicKey := new(big.Int).Exp(g, privateKey, p)

	return models.KeyPair{
		PrivateKey: privateKey.Int64(),
		PublicKey:  publicKey.Int64(),
	}, nil
}

// Encrypt realiza a criptografia ElGamal de uma mensagem
func Encrypt(message string, publicKey models.PublicKey) models.EncryptedMessage {
	// 1. Conversão da mensagem para um número grande
	m := new(big.Int).SetBytes([]byte(message))

	// 2. Geração de um número aleatório k (efêmero)
	// k deve ser um número aleatório onde 1 < k < p-1
	k, _ := rand.Int(rand.Reader, new(big.Int).Sub(p, big.NewInt(2)))
	k.Add(k, big.NewInt(1)) // Garante que k esteja entre 1 e p-1

	// 3. Cálculo de c1 = g^k mod p
	c1 := new(big.Int).Exp(g, k, p)

	// 4. Cálculo de s = y^k mod p, onde y é a chave pública
	s := new(big.Int).Exp(big.NewInt(int64(publicKey)), k, p)

	// 5. Cálculo de c2 = m * s mod p
	c2 := new(big.Int).Mul(m, s)
	c2.Mod(c2, p)

	// A mensagem criptografada é o par (c1, c2)
	return models.EncryptedMessage{
		C1: c1.String(),
		C2: c2.String(),
	}
}

// Decrypt realiza a decriptografia ElGamal de uma mensagem
func Decrypt(encryptedMessage models.EncryptedMessage, privateKey int) string {
	// 1. Conversão de c1 e c2 de string para big.Int
	c1, _ := new(big.Int).SetString(encryptedMessage.C1, 10)
	c2, _ := new(big.Int).SetString(encryptedMessage.C2, 10)

	// 2. Cálculo de s = c1^x mod p, onde x é a chave privada
	s := new(big.Int).Exp(c1, big.NewInt(int64(privateKey)), p)

	// 3. Cálculo do inverso multiplicativo de s modulo p
	s.ModInverse(s, p)

	// 4. Recuperação da mensagem original: m = c2 * s^(-1) mod p
	m := new(big.Int).Mul(c2, s)
	m.Mod(m, p)

	// 5. Conversão do número de volta para string
	return string(m.Bytes())
}