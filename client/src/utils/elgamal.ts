// Importa o módulo crypto do Node.js se estiver em um ambiente de servidor
const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
const crypto = isNode ? require('crypto') : window.crypto;

export interface PublicKey {
  p: string;
  g: string;
  y: string;
}

export interface PrivateKey {
  x: string;
}

export interface EncryptedMessage {
  a: string;
  b: string;
  p: string;
}

export class ElGamal {
  static cachedKeys: { publicKey: PublicKey; privateKey: PrivateKey } | null = null;

  publicKey: PublicKey;
  privateKey: PrivateKey;

  constructor() {
    if (ElGamal.cachedKeys) {
      this.publicKey = ElGamal.cachedKeys.publicKey;
      this.privateKey = ElGamal.cachedKeys.privateKey;
    } else {
      this.publicKey = { p: '0', g: '0', y: '0' };
      this.privateKey = { x: '0' };
      this.generateKeys();
      ElGamal.cachedKeys = { publicKey: this.publicKey, privateKey: this.privateKey };
    }
  }

  /**
   * Gera as chaves públicas e privadas para o algoritmo ElGamal.
   */
  generateKeys(): { publicKey: PublicKey; privateKey: PrivateKey } {
    const bitLength = 256;
    let p: bigint, q: bigint;
    do {
      q = this.generateLargePrime(bitLength - 1);
      p = 2n * q + 1n;
    } while (!this.isProbablePrime(p, 5));

    const g = this.findPrimitiveRoot(p, q);
    const x = this.generateSecureRandomBigInt(2n, p - 2n);
    const y = this.modularExponentiation(g, x, p);

    // Convertendo todos os valores para string antes de retornar
    const publicKey: PublicKey = {
      p: p.toString(),
      g: g.toString(),
      y: y.toString()
    };
    const privateKey: PrivateKey = { x: x.toString() };

    this.publicKey = publicKey;
    this.privateKey = privateKey;

    return { publicKey, privateKey };
  }

  /**
   * Criptografa uma mensagem usando a chave pública do receptor.
   *
   * @param message A mensagem a ser criptografada.
   * @param receiverPublicKey A chave pública do receptor.
   * @returns Um objeto EncryptedMessage contendo 'a', 'b' e 'p'.
   */
  encrypt(message: string, publicKey: PublicKey): EncryptedMessage {
    try {
      if (!publicKey.p || !publicKey.g || !publicKey.y) {
        throw new Error('Chave pública inválida: faltam propriedades necessárias');
      }

      // Converter strings para BigInt
      const p = BigInt(publicKey.p);
      const g = BigInt(publicKey.g);
      const y = BigInt(publicKey.y);

      const k = this.generateSecureRandomBigInt(2n, p - 2n);
      const a = this.modularExponentiation(g, k, p);
      const s = this.modularExponentiation(y, k, p);
      const m = this.stringToBigInt(message);
      const b = (m * s) % p;

      return {
        a: a.toString(),
        b: b.toString(),
        p: p.toString()
      };
    } catch (error) {
      console.error('Erro na criptografia ElGamal:', error);
      throw error;
    }
  }

  /**
   * Descriptografa uma mensagem usando a chave privada do receptor.
   *
   * @param encrypted O objeto EncryptedMessage contendo 'a', 'b' e 'p'.
   * @param privateKey A chave privada do receptor.
   * @returns A mensagem descriptografada como string.
   */
  decrypt(encrypted: EncryptedMessage, privateKey: PrivateKey): string {
    const { a, b, p } = encrypted;
    const aBig = BigInt(a);
    const bBig = BigInt(b);
    const pBig = BigInt(p);
    const xBig = BigInt(privateKey.x);

    if (aBig === 0n) {
      throw new Error("Invalid encrypted message: 'a' cannot be zero");
    }

    const s = this.modularExponentiation(aBig, xBig, pBig);
    if (s === 0n) {
      throw new Error("Decryption error: 's' is zero");
    }

    const sInv = this.modularInverse(s, pBig);
    const m = (bBig * sInv) % pBig;
    return this.bigIntToString(m);
  }

  /**
   * Define as chaves pública e privada para o algoritmo ElGamal.
   *
   * @param publicKey A chave pública a ser definida.
   * @param privateKey A chave privada a ser definida.
   */
  setKeys(publicKey: PublicKey, privateKey: PrivateKey): void {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    ElGamal.cachedKeys = { publicKey, privateKey };
  }

  /**
   * Gera um número primo grande usando o teste de primalidade de Miller-Rabin.
   *
   * @param bitLength O comprimento em bits do número primo.
   * @returns Um BigInt que é um número primo.
   */
  private generateLargePrime(bitLength: number): bigint {
    let prime: bigint;
    do {
      prime = this.randomBigInt(bitLength);
      // Garante que o número é ímpar
      prime = prime | 1n;
    } while (!this.isProbablePrime(prime, 5));
    return prime;
  }

  /**
   * Encontra uma raiz primitiva módulo p, sabendo que p = 2q + 1 com q primo.
   *
   * @param p O módulo primo.
   * @param q O primo tal que p = 2q + 1.
   * @returns Uma raiz primitiva.
   */
  private findPrimitiveRoot(p: bigint, q: bigint): bigint {
    const candidates = [2n, 3n, 5n, 7n, 11n];
    for (const g of candidates) {
      if (
        this.modularExponentiation(g, 2n, p) !== 1n &&
        this.modularExponentiation(g, q, p) !== 1n
      ) {
        return g;
      }
    }
    throw new Error('Raiz primitiva não encontrada');
  }

  /**
   * Gera um BigInt aleatório entre min e max (inclusive) usando a API Web Crypto.
   *
   * @param min O valor mínimo.
   * @param max O valor máximo.
   * @returns Um BigInt aleatório.
   */
  private generateSecureRandomBigInt(min: bigint, max: bigint): bigint {
    const range = max - min + 1n;
    const byteLength = Math.ceil(range.toString(2).length / 8);
    let randomBigInt: bigint;
    do {
      const randomBytes = this.getRandomBytes(byteLength);
      randomBigInt = 0n;
      for (let i = 0; i < randomBytes.length; i++) {
        randomBigInt = (randomBigInt << 8n) + BigInt(randomBytes[i]);
      }
    } while (randomBigInt >= range);
    return min + (randomBigInt % range);
  }

  /**
   * Gera um BigInt aleatório com um número específico de bits usando a API Web Crypto.
   *
   * @param bitLength O número de bits.
   * @returns Um BigInt aleatório.
   */
  private randomBigInt(bitLength: number): bigint {
    const byteLength = Math.ceil(bitLength / 8);
    const randomBytes = this.getRandomBytes(byteLength);
    let randomBig = 0n;
    for (let i = 0; i < randomBytes.length; i++) {
      randomBig = (randomBig << 8n) + BigInt(randomBytes[i]);
    }
    // Ajusta para o número de bits
    const excessBits = byteLength * 8 - bitLength;
    if (excessBits > 0) {
      randomBig = randomBig >> BigInt(excessBits);
    }
    return randomBig;
  }

  /**
   * Teste de primalidade de Miller-Rabin.
   *
   * @param n O número a ser testado.
   * @param k O número de iterações.
   * @returns Verdadeiro se provável primo, falso se composto.
   */
  private isProbablePrime(n: bigint, k: number): boolean {
    if (n === 2n || n === 3n) return true;
    if (n <= 1n || n % 2n === 0n) return false;

    // Escreve n-1 como 2^s * d
    let s = 0n;
    let d = n - 1n;
    while (d % 2n === 0n) {
      d /= 2n;
      s++;
    }

    for (let i = 0; i < k; i++) {
      const a = this.generateSecureRandomBigInt(2n, n - 2n);
      let x = this.modularExponentiation(a, d, n);
      if (x === 1n || x === n - 1n) continue;
      let flag = false;
      for (let r = 0n; r < s - 1n; r++) {
        x = this.modularExponentiation(x, 2n, n);
        if (x === n - 1n) {
          flag = true;
          break;
        }
      }
      if (flag) continue;
      return false;
    }
    return true;
  }

  /**
   * Exponenciação modular eficiente.
   *
   * @param base A base.
   * @param exponent O expoente.
   * @param modulus O módulo.
   * @returns O resultado da exponenciação modular.
   */
  private modularExponentiation(base: bigint, exponent: bigint, modulus: bigint): bigint {
    if (modulus === 1n) return 0n;
    let result = 1n;
    base = base % modulus;
    while (exponent > 0n) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> 1n;
      base = (base * base) % modulus;
    }
    return result;
  }

  /**
   * Calcula o inverso modular usando o Algoritmo de Euclides Estendido.
   *
   * @param a O número.
   * @param modulus O módulo.
   * @returns O inverso modular.
   */
  private modularInverse(a: bigint, m: bigint): bigint {
    console.log('Calculando inverso modular para a:', a.toString(), 'm:', m.toString());

    if (a === 0n || m === 0n) {
      throw new Error("Inverso modular não existe para zero");
    }

    let [old_r, r] = [a, m];
    let [old_s, s] = [1n, 0n];

    while (r !== 0n) {
      const quotient = old_r / r;
      [old_r, r] = [r, old_r - quotient * r];
      [old_s, s] = [s, old_s - quotient * s];
    }

    if (old_r !== 1n) {
      throw new Error("Inverso modular não existe");
    }

    return (old_s % m + m) % m;
  }

  /**
   * Converte uma string para BigInt.
   *
   * @param str A string a ser convertida.
   * @returns O BigInt correspondente.
   */
  private stringToBigInt(str: string): bigint {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    return BigInt('0x' + Array.from(encoded).map(b => b.toString(16).padStart(2, '0')).join(''));
  }

  /**
   * Converte um BigInt para string.
   *
   * @param num O BigInt a ser convertido.
   * @returns A string correspondente.
   */
  private bigIntToString(num: bigint): string {
    const hex = num.toString(16);
    const paddedHex = hex.padStart(Math.ceil(hex.length / 2) * 2, '0');
    const bytes = new Uint8Array(paddedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  /**
   * Gera bytes aleatórios usando a API Web Crypto.
   *
   * @param size O número de bytes a serem gerados.
   * @returns Um Uint8Array com bytes aleatórios.
   */
  private getRandomBytes(size: number): Uint8Array {
    const array = new Uint8Array(size);
    crypto.getRandomValues(array);
    return array;
  }
}