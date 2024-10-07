import { ElGamal } from './elgamal';

describe('ElGamal', () => {
  let elgamal: ElGamal;

  beforeEach(() => {
    elgamal = new ElGamal();
  });

  test('Geração de chaves', () => {
    expect(elgamal.publicKey.p).not.toBe('0');
    expect(elgamal.publicKey.g).not.toBe('0');
    expect(elgamal.publicKey.y).not.toBe('0');
    expect(elgamal.privateKey.x).not.toBe('0');
  });

  test('Criptografia e descriptografia', () => {
    const message = 'ELGAMAL WEBCHAT CRIPTOGRAPHY';
    const encrypted = elgamal.encrypt(message, elgamal.publicKey);
    const decrypted = elgamal.decrypt(encrypted, elgamal.privateKey, elgamal.publicKey.p);
    expect(decrypted).toBe(message);
  });

  test('Criptografia com chave pública diferente', () => {
    const message = 'Test message';
    const newElgamal = new ElGamal();
    const encrypted = elgamal.encrypt(message, newElgamal.publicKey);
    const decrypted = newElgamal.decrypt(encrypted, newElgamal.privateKey, newElgamal.publicKey.p);
    expect(decrypted).toBe(message);
  });

  test('Teste de primalidade', () => {
    const prime = (elgamal as any).generateLargePrime(16);
    expect((elgamal as any).isProbablePrime(prime, 5)).toBe(true);
    expect((elgamal as any).isProbablePrime(prime - 1n, 5)).toBe(false);
  });

  test('Exponenciação modular', () => {
    const base = 3n;
    const exponent = 4n;
    const modulus = 7n;
    const result = (elgamal as any).modularExponentiation(base, exponent, modulus);
    expect(result).toBe(4n); // 3^4 mod 7 = 81 mod 7 = 4
  });

  test('Inverso modular', () => {
    const a = 3n;
    const modulus = 7n;
    const inverse = (elgamal as any).modularInverse(a, modulus);
    expect((a * inverse) % modulus).toBe(1n);
  });

  test('Conversão string para BigInt e vice-versa', () => {
    const originalString = 'Test';
    const bigInt = (elgamal as any).stringToBigInt(originalString);
    const convertedString = (elgamal as any).bigIntToString(bigInt);
    expect(convertedString).toBe(originalString);
  });

  test('Desempenho da geração de chaves', () => {
    const startTime = Date.now();
    new ElGamal();
    const endTime = Date.now();
    console.log(`Tempo de geração de chaves: ${endTime - startTime}ms`);
    expect(endTime - startTime).toBeLessThan(1000); // Espera-se que seja menor que 1 segundo
  });
});