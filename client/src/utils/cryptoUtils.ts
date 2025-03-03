import { PrivateKey } from './elgamal';

// Helper para obter a crypto API correta dependendo do ambiente (browser ou worker)
const getCryptoAPI = () => {
  if (typeof window !== 'undefined') {
    return window.crypto;
  } else if (typeof self !== 'undefined') {
    return self.crypto;
  }
  throw new Error('Ambiente não suportado: crypto API não disponível');
};

// Acessa a API de criptografia
const cryptoAPI = getCryptoAPI();

/**
 * Criptografa a chave privada usando a senha do usuário.
 * Utiliza AES-256-GCM para criptografia simétrica.
 *
 * @param privateKey A chave privada a ser criptografada.
 * @param password A senha do usuário para derivar a chave de criptografia.
 * @returns Uma string base64 contendo o IV e os dados criptografados.
 */
export const encryptPrivateKey = async (privateKey: PrivateKey, password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  // Derivar uma chave a partir da senha usando PBKDF2
  const keyMaterial = await cryptoAPI.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await cryptoAPI.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('unique-salt'), // Utilize um salt único e armazenado de forma segura
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  // Criptografar a chave privada
  const iv = cryptoAPI.getRandomValues(new Uint8Array(12)); // IV de 96 bits para AES-GCM
  const encodedPrivateKey = encoder.encode(privateKey.x);
  const encrypted = await cryptoAPI.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedPrivateKey
  );

  // Concatenar IV e dados criptografados
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);

  // Converter para string base64
  return bufferToBase64(combined);
};

/**
 * Descriptografa a chave privada usando a senha do usuário.
 *
 * @param encryptedData A string base64 contendo o IV e os dados criptografados.
 * @param password A senha do usuário para derivar a chave de descriptografia.
 * @returns A chave privada descriptografada.
 */
export const decryptPrivateKey = async (encryptedData: string, password: string): Promise<PrivateKey> => {
  const decoder = new TextDecoder();
  const combined = base64ToBuffer(encryptedData);

  // Extrair IV e dados criptografados
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  // Derivar a mesma chave a partir da senha usando PBKDF2
  const keyMaterial = await cryptoAPI.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await cryptoAPI.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('unique-salt'), // O mesmo salt utilizado na criptografia
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );

  // Descriptografar a chave privada
  const decrypted = await cryptoAPI.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encrypted
  );

  const decryptedKey = decoder.decode(new Uint8Array(decrypted));
  return { x: decryptedKey };
};

/**
 * Função auxiliar para converter ArrayBuffer para base64
 * Esta implementação funciona em qualquer ambiente (navegador ou worker)
 */
const bufferToBase64 = (buffer: Uint8Array): string => {
  if (typeof window !== 'undefined') {
    // Ambiente de navegador
    let binary = '';
    buffer.forEach((b) => binary += String.fromCharCode(b));
    return window.btoa(binary);
  } else if (typeof self !== 'undefined') {
    // Ambiente de Web Worker
    let binary = '';
    buffer.forEach((b) => binary += String.fromCharCode(b));
    return self.btoa(binary);
  } else {
    // Implementação manual para outros ambientes
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.length;

    for (let i = 0; i < len; i += 3) {
      result += chars[bytes[i] >> 2];
      result += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      result += i + 1 < len ? chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)] : '=';
      result += i + 2 < len ? chars[bytes[i + 2] & 63] : '=';
    }

    return result;
  }
};

/**
 * Função auxiliar para converter base64 para Uint8Array
 * Esta implementação funciona em qualquer ambiente (navegador ou worker)
 */
const base64ToBuffer = (base64: string): Uint8Array => {
  if (typeof window !== 'undefined') {
    // Ambiente de navegador
    const binary = window.atob(base64);
    const buffer = new Uint8Array(binary.length);
    Array.from(binary).forEach((char, i) => {
      buffer[i] = char.charCodeAt(0);
    });
    return buffer;
  } else if (typeof self !== 'undefined') {
    // Ambiente de Web Worker
    const binary = self.atob(base64);
    const buffer = new Uint8Array(binary.length);
    Array.from(binary).forEach((char, i) => {
      buffer[i] = char.charCodeAt(0);
    });
    return buffer;
  } else {
    // Implementação manual para outros ambientes
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let bufferLength = base64.length * 0.75;
    if (base64[base64.length - 1] === '=') {
      bufferLength--;
      if (base64[base64.length - 2] === '=') {
        bufferLength--;
      }
    }

    const bytes = new Uint8Array(bufferLength);
    let p = 0;

    for (let i = 0; i < base64.length; i += 4) {
      const encoded1 = chars.indexOf(base64[i]);
      const encoded2 = chars.indexOf(base64[i + 1]);
      const encoded3 = chars.indexOf(base64[i + 2]);
      const encoded4 = chars.indexOf(base64[i + 3]);

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      if (encoded3 !== -1) {
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      }
      if (encoded4 !== -1) {
        bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
      }
    }

    return bytes;
  }
};

// Chave fixa para criptografia local (em produção, use uma chave mais segura)
const LOCAL_STORAGE_KEY = 'your-secure-key-here'

export const encryptForLocalStorage = async (data: string): Promise<string> => {
  const encoder = new TextEncoder()
  const keyMaterial = await cryptoAPI.subtle.importKey(
    'raw',
    encoder.encode(LOCAL_STORAGE_KEY),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const key = await cryptoAPI.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('local-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  )

  const iv = cryptoAPI.getRandomValues(new Uint8Array(12))
  const encrypted = await cryptoAPI.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  )

  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), iv.byteLength)

  return bufferToBase64(combined)
}

export const decryptFromLocalStorage = async (encryptedData: string): Promise<string> => {
  const decoder = new TextDecoder()
  const combined = base64ToBuffer(encryptedData)
  const iv = combined.slice(0, 12)
  const encrypted = combined.slice(12)

  const encoder = new TextEncoder()
  const keyMaterial = await cryptoAPI.subtle.importKey(
    'raw',
    encoder.encode(LOCAL_STORAGE_KEY),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const key = await cryptoAPI.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('local-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  )

  const decrypted = await cryptoAPI.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  )

  return decoder.decode(new Uint8Array(decrypted))
}
