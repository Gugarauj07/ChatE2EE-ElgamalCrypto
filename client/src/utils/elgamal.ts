import { PublicKey, PrivateKey, EncryptedMessage } from '../types';
import { randomBytes } from 'crypto';

export class ElGamal {
  publicKey: PublicKey;
  privateKey: PrivateKey;

  constructor() {
    this.publicKey = {} as PublicKey;
    this.privateKey = {} as PrivateKey;
    this.generateKeys();
  }

  /**
   * Gera as chaves públicas e privadas para o algoritmo ElGamal.
   *
   * Etapas:
   * 1. Gera um número primo grande 'p'.
   * 2. Encontra uma raiz primitiva 'g' módulo 'p'.
   * 3. Gera um número aleatório 'x' como chave privada.
   * 4. Calcula 'y = g^x mod p' como parte da chave pública.
   */
  generateKeys(): void {
    const p = this.generateLargePrime();
    const g = this.findPrimitiveRoot(p);
    const x = this.generateSecureRandomNumber(2, p - 2);
    const y = this.modularExponentiation(g, x, p);

    this.publicKey = { p, g, y };
    this.privateKey = { x };
  }

  /**
   * Criptografa uma mensagem usando a chave pública do receptor.
   *
   * Etapas:
   * 1. Gera um número aleatório 'k'.
   * 2. Calcula 'a = g^k mod p'.
   * 3. Calcula 's = y^k mod p'.
   * 4. Converte a mensagem em um número.
   * 5. Calcula 'b = (mensagem * s) mod p'.
   *
   * @param message A mensagem a ser criptografada.
   * @param receiverPublicKey A chave pública do receptor.
   * @returns Um objeto EncryptedMessage contendo 'a' e 'b'.
   */
  encrypt(message: string, receiverPublicKey: PublicKey): EncryptedMessage {
    const { p, g, y } = receiverPublicKey;
    const k = this.generateSecureRandomNumber(2, p - 2);
    const a = this.modularExponentiation(g, k, p);
    const s = this.modularExponentiation(y, k, p);
    const b = this.multiplyAndMod(this.stringToNumber(message), s, p);
    return { a, b };
  }

  /**
   * Descriptografa uma mensagem usando a chave privada do receptor.
   *
   * Etapas:
   * 1. Calcula 's = a^x mod p' usando a chave privada.
   * 2. Calcula o inverso modular de s.
   * 3. Recupera a mensagem como '(b * s^-1) mod p'.
   * 4. Converte o número da mensagem de volta para string.
   *
   * @param encrypted O objeto EncryptedMessage contendo 'a' e 'b'.
   * @param privateKey A chave privada do receptor.
   * @param p O módulo primo usado na criptografia.
   * @returns A mensagem descriptografada como string.
   */
  decrypt(encrypted: EncryptedMessage, privateKey: PrivateKey, p: number): string {
    const { a, b } = encrypted;
    const s = this.modularExponentiation(a, privateKey.x, p);
    const sInv = this.modularInverse(s, p);
    const messageNumber = this.multiplyAndMod(b, sInv, p);
    return this.numberToString(messageNumber);
  }

  // Funções auxiliares melhoradas
  private generateLargePrime(): number {
    // Na prática, use uma biblioteca criptográfica para gerar primos grandes
    return (2^16 + 1);
  }

  private findPrimitiveRoot(p: number): number {
    // Implementação simplificada para encontrar uma raiz primitiva
    for (let g = 2; g < p; g++) {
      if (this.isPrimitiveRoot(g, p)) {
        return g;
      }
    }
    throw new Error("Raiz primitiva não encontrada");
  }

  private isPrimitiveRoot(g: number, p: number): boolean {
    const factors = this.primeFactors(p - 1);
    for (const factor of factors) {
      if (this.modularExponentiation(g, (p - 1) / factor, p) === 1) {
        return false;
      }
    }
    return true;
  }

  private primeFactors(n: number): number[] {
    const factors: number[] = [];
    let d = 2;
    while (n > 1) {
      while (n % d === 0) {
        if (!factors.includes(d)) {
          factors.push(d);
        }
        n /= d;
      }
      d++;
      if (d * d > n) {
        if (n > 1) {
          factors.push(n);
        }
        break;
      }
    }
    return factors;
  }

  private generateSecureRandomNumber(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    let randomNumber: number;
    do {
      const randomBytesBuffer = randomBytes(bytesNeeded);
      randomNumber = parseInt(randomBytesBuffer.toString('hex'), 16);
    } while (randomNumber >= range);
    return min + randomNumber;
  }

  private modularExponentiation(base: number, exponent: number, modulus: number): number {
    if (modulus === 1) return 0;
    let result = 1;
    base = base % modulus;
    while (exponent > 0) {
      if (exponent % 2 === 1) {
        result = this.multiplyAndMod(result, base, modulus);
      }
      exponent = Math.floor(exponent / 2);
      base = this.multiplyAndMod(base, base, modulus);
    }
    return result;
  }

  private modularInverse(a: number, modulus: number): number {
    let m0 = modulus, t, q;
    let x0 = 0, x1 = 1;

    if (modulus === 1) return 0;

    while (a > 1) {
      q = Math.floor(a / modulus);
      t = modulus;

      modulus = a % modulus;
      a = t;
      t = x0;

      x0 = x1 - q * x0;
      x1 = t;
    }

    if (x1 < 0)
      x1 += m0;

    return x1;
  }

  private stringToNumber(str: string): number {
    // Conversão simples de string para número
    return parseInt(Buffer.from(str).toString('hex'), 16);
  }

  private numberToString(num: number): string {
    // Conversão simples de número para string
    const hex = num.toString(16);
    return Buffer.from(hex, 'hex').toString('utf-8');
  }

  private multiplyAndMod(a: number, b: number, modulus: number): number {
    return (a * b) % modulus;
  }
}