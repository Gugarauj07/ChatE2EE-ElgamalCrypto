interface PublicKey {
  p: string; // Usando string para representar BigInt
  g: string;
  y: string;
}

interface PrivateKey {
  x: string;
}

interface EncryptedMessage {
  a: string;
  b: string;
}

export class ElGamal {
  publicKey: PublicKey;
  privateKey: PrivateKey;

  constructor() {
    this.publicKey = { p: '0', g: '0', y: '0' };
    this.privateKey = { x: '0' };
    this.generateKeys();
  }

  /**
   * Gera as chaves públicas e privadas para o algoritmo ElGamal.
   */
  generateKeys(): void {
    const p = this.generateLargePrime(16); // Tamanho reduzido para demonstração (16 bits)
    const g = this.findPrimitiveRoot(p);
    const x = this.generateSecureRandomBigInt(1n, p - 2n);
    const y = this.modularExponentiation(BigInt(g), BigInt(x), BigInt(p));

    this.publicKey = { p: p.toString(), g: g.toString(), y: y.toString() };
    this.privateKey = { x: x.toString() };
  }

  /**
   * Criptografa uma mensagem usando a chave pública do receptor.
   *
   * @param message A mensagem a ser criptografada.
   * @param receiverPublicKey A chave pública do receptor.
   * @returns Um objeto EncryptedMessage contendo 'a' e 'b'.
   */
  encrypt(message: string, receiverPublicKey: PublicKey): EncryptedMessage {
    const { p, g, y } = receiverPublicKey;
    const pBig = BigInt(p);
    const gBig = BigInt(g);
    const yBig = BigInt(y);
    const k = this.generateSecureRandomBigInt(2n, pBig - 2n);
    const a = this.modularExponentiation(gBig, k, pBig);
    const s = this.modularExponentiation(yBig, k, pBig);
    const m = this.stringToBigInt(message);
    const b = (m * s) % pBig;
    return { a: a.toString(), b: b.toString() };
  }

  /**
   * Descriptografa uma mensagem usando a chave privada do receptor.
   *
   * @param encrypted O objeto EncryptedMessage contendo 'a' e 'b'.
   * @param privateKey A chave privada do receptor.
   * @param p O módulo primo usado na criptografia.
   * @returns A mensagem descriptografada como string.
   */
  decrypt(encrypted: EncryptedMessage, privateKey: PrivateKey, p: string): string {
    const { a, b } = encrypted;
    const aBig = BigInt(a);
    const bBig = BigInt(b);
    const pBig = BigInt(p);
    const xBig = BigInt(privateKey.x);
    const s = this.modularExponentiation(aBig, xBig, pBig);
    const sInv = this.modularInverse(s, pBig);
    const m = (bBig * sInv) % pBig;
    return this.bigIntToString(m);
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
    } while (!this.isProbablePrime(prime, 5));
    return prime;
  }

  /**
   * Encontra uma raiz primitiva módulo p.
   *
   * @param p O módulo primo.
   * @returns Uma raiz primitiva.
   */
  private findPrimitiveRoot(p: bigint): bigint {
    if (p === 2n) return 1n;
    const factors = this.factorize(p - 1n);
    for (let g = 2n; g < p; g++) {
      let flag = true;
      for (const factor of factors) {
        if (this.modularExponentiation(g, (p - 1n) / factor, p) === 1n) {
          flag = false;
          break;
        }
      }
      if (flag) return g;
    }
    throw new Error('Raiz primitiva não encontrada');
  }

  /**
   * Gera um BigInt aleatório entre min e max (inclusive).
   *
   * @param min O valor mínimo.
   * @param max O valor máximo.
   * @returns Um BigInt aleatório.
   */
  private generateSecureRandomBigInt(min: bigint, max: bigint): bigint {
    const range = max - min + 1n;
    const byteLength = Math.ceil(Number(range.toString(2).length) / 8);
    let randomBigInt: bigint;
    do {
      const randomBytes = new Uint8Array(byteLength);
      window.crypto.getRandomValues(randomBytes);
      randomBigInt = 0n;
      for (let i = 0; i < randomBytes.length; i++) {
        randomBigInt = (randomBigInt << 8n) + BigInt(randomBytes[i]);
      }
    } while (randomBigInt >= range);
    return min + (randomBigInt % range);
  }

  /**
   * Gera um BigInt aleatório com um número específico de bits.
   *
   * @param bitLength O número de bits.
   * @returns Um BigInt aleatório.
   */
  private randomBigInt(bitLength: number): bigint {
    const byteLength = Math.ceil(bitLength / 8);
    const randomBytes = new Uint8Array(byteLength);
    window.crypto.getRandomValues(randomBytes);
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
      let continueOuter = false;
      for (let r = 0n; r < s - 1n; r++) {
        x = this.modularExponentiation(x, 2n, n);
        if (x === n - 1n) {
          continueOuter = true;
          break;
        }
      }
      if (continueOuter) continue;
      return false;
    }
    return true;
  }

  /**
   * Fatora p-1 e retorna os fatores únicos.
   *
   * @param n O número a ser fatorado.
   * @returns Um array de fatores únicos.
   */
  private factorize(n: bigint): bigint[] {
    const factors: bigint[] = [];
    let divisor = 2n;
    while (n % divisor === 0n) {
      if (!factors.includes(divisor)) factors.push(divisor);
      n /= divisor;
    }
    divisor = 3n;
    while (divisor * divisor <= n) {
      while (n % divisor === 0n) {
        if (!factors.includes(divisor)) factors.push(divisor);
        n /= divisor;
      }
      divisor += 2n;
    }
    if (n > 2n && !factors.includes(n)) factors.push(n);
    return factors;
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
  private modularInverse(a: bigint, modulus: bigint): bigint {
    let m0 = modulus;
    let y = 0n;
    let x = 1n;

    if (modulus === 1n) return 0n;

    while (a > 1n) {
      const q = a / modulus;
      let t = modulus;

      modulus = a % modulus;
      a = t;
      t = y;

      y = x - q * y;
      x = t;
    }

    if (x < 0n) x += m0;

    return x;
  }

  /**
   * Converte uma string para BigInt.
   *
   * @param str A string a ser convertida.
   * @returns O BigInt correspondente.
   */
  private stringToBigInt(str: string): bigint {
    return BigInt('0x' + Buffer.from(str, 'utf-8').toString('hex'));
  }

  /**
   * Converte um BigInt para string.
   *
   * @param num O BigInt a ser convertido.
   * @returns A string correspondente.
   */
  private bigIntToString(num: bigint): string {
    let hex = num.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    return Buffer.from(hex, 'hex').toString('utf-8');
  }
}