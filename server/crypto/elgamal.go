package crypto

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"server/models"
)

// EncryptElGamal criptografa a sender key usando a chave pública ElGamal do usuário
func EncryptElGamal(senderKey string, pub models.PublicKey) (string, error) {
	// Converter P, G e Y de string para *big.Int
	p := new(big.Int)
	if _, ok := p.SetString(pub.P, 10); !ok {
		return "", fmt.Errorf("falha ao converter P para *big.Int")
	}

	g := new(big.Int)
	if _, ok := g.SetString(pub.G, 10); !ok {
		return "", fmt.Errorf("falha ao converter G para *big.Int")
	}

	y := new(big.Int)
	if _, ok := y.SetString(pub.Y, 10); !ok {
		return "", fmt.Errorf("falha ao converter Y para *big.Int")
	}

	// Converter senderKey de string para *big.Int
	m := new(big.Int)
	if _, ok := m.SetString(senderKey, 10); !ok {
		return "", fmt.Errorf("falha ao converter senderKey para *big.Int")
	}

	// Gerar k aleatório em [1, p-2]
	k, err := rand.Int(rand.Reader, new(big.Int).Sub(p, big.NewInt(2)))
	if err != nil {
		return "", fmt.Errorf("erro ao gerar k aleatório: %v", err)
	}
	k.Add(k, big.NewInt(1)) // k ∈ [1, p-2]

	// Calcular c1 = g^k mod p
	c1 := new(big.Int).Exp(g, k, p)

	// Calcular c2 = m * y^k mod p
	yk := new(big.Int).Exp(y, k, p)
	c2 := new(big.Int).Mul(m, yk)
	c2.Mod(c2, p)

	// Retornar a chave criptografada no formato "c1_c2"
	return fmt.Sprintf("%s_%s", c1.String(), c2.String()), nil
}