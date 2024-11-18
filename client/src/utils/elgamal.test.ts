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

    // Verificar se o objeto encrypted tem todas as propriedades necessárias
    expect(encrypted).toHaveProperty('a');
    expect(encrypted).toHaveProperty('b');
    expect(encrypted).toHaveProperty('p');

    const decrypted = elgamal.decrypt(encrypted, elgamal.privateKey);
    expect(decrypted).toBe(message);
  });

  test('Criptografia com chave pública diferente', () => {
    const message = 'Test message';
    const newElgamal = new ElGamal();
    const encrypted = elgamal.encrypt(message, newElgamal.publicKey);
    const decrypted = newElgamal.decrypt(encrypted, newElgamal.privateKey);
    expect(decrypted).toBe(message);
  });

  test('Teste de formato da mensagem criptografada', () => {
    const message = 'Test message';
    const encrypted = elgamal.encrypt(message, elgamal.publicKey);

    // Verificar se os valores são strings não vazias
    expect(typeof encrypted.a).toBe('string');
    expect(encrypted.a.length).toBeGreaterThan(0);
    expect(typeof encrypted.b).toBe('string');
    expect(encrypted.b.length).toBeGreaterThan(0);
    expect(typeof encrypted.p).toBe('string');
    expect(encrypted.p.length).toBeGreaterThan(0);

    // Verificar se p corresponde ao valor da chave pública
    expect(encrypted.p).toBe(elgamal.publicKey.p);
  });

  test('Erro ao descriptografar com chave inválida', () => {
    const message = 'Test message';
    const encrypted = elgamal.encrypt(message, elgamal.publicKey);
    encrypted.a = '0'; // Forçar um erro

    expect(() => {
      elgamal.decrypt(encrypted, elgamal.privateKey);
    }).toThrow("Invalid encrypted message: 'a' cannot be zero");
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

  test('Teste de string criptografada formatada', () => {
    const message = 'Test message';
    const encrypted = elgamal.encrypt(message, elgamal.publicKey);
    const formattedString = `${encrypted.a};${encrypted.b};${encrypted.p}`;

    // Simular o processo que acontece no ConversationContext
    const [a, b, p] = formattedString.split(';');
    const reconstructedEncrypted = { a, b, p };

    const decrypted = elgamal.decrypt(reconstructedEncrypted, elgamal.privateKey);
    expect(decrypted).toBe(message);
  });

  test('Criptografia com mensagens de diferentes tamanhos', () => {
    const messages = [
      'A',
      'Hello',
      'This is a longer message',
      'Special chars: !@#$%^&*()',
      'Numbers: 1234567890',
      'Unicode: 你好世界'
    ];

    messages.forEach(message => {
      const encrypted = elgamal.encrypt(message, elgamal.publicKey);
      const decrypted = elgamal.decrypt(encrypted, elgamal.privateKey);
      expect(decrypted).toBe(message);
    });
  });
});