import { openDB } from 'idb';
import { PrivateKey } from '../utils/elgamal';
import { deriveKey } from '../utils/crypto';

const DB_NAME = 'ChatAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  },
});

/**
 * Salva a chave privada criptografada associada a um userId específico.
 * @param userId ID único do usuário.
 * @param privateKey Chave privada a ser armazenada.
 * @param password Senha do usuário para derivar a chave de criptografia.
 */
export const savePrivateKey = async (userId: string, privateKey: PrivateKey, password: string) => {
  const db = await dbPromise;

  // Converter a chave privada para string JSON
  const privateKeyString = JSON.stringify(privateKey);

  // Gerar um salt aleatório
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  // Derivar a chave criptográfica a partir da senha e salt
  const cryptoKey = await deriveKey(password, salt);

  // Gerar um IV aleatório
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Criptografar a chave privada
  const encoder = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    cryptoKey,
    encoder.encode(privateKeyString)
  );

  // Armazenar salt, iv e encrypted data
  const storedData = {
    salt: Array.from(salt),
    iv: Array.from(iv),
    encrypted: Array.from(new Uint8Array(encrypted)),
  };

  await db.put(STORE_NAME, storedData, `privateKey_${userId}`);
};

/**
 * Obtém a chave privada desencriptada associada a um userId específico.
 * @param userId ID único do usuário.
 * @param password Senha do usuário para derivar a chave de descriptografia.
 * @returns Chave privada ou undefined se não encontrada ou falha na descriptografia.
 */
export const getPrivateKey = async (userId: string, password: string): Promise<PrivateKey | undefined> => {
  const db = await dbPromise;
  const storedData = await db.get(STORE_NAME, `privateKey_${userId}`);

  if (!storedData) return undefined;

  const { salt, iv, encrypted }: { salt: number[]; iv: number[]; encrypted: number[] } = storedData;

  // Reconstituir Uint8Array
  const saltBytes = new Uint8Array(salt);
  const ivBytes = new Uint8Array(iv);
  const encryptedBytes = new Uint8Array(encrypted);

  // Derivar a chave criptográfica a partir da senha e salt
  const cryptoKey = await deriveKey(password, saltBytes);

  try {
    // Desencriptar a chave privada
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      cryptoKey,
      encryptedBytes
    );

    const decoder = new TextDecoder();
    const privateKeyString = decoder.decode(decrypted);
    return JSON.parse(privateKeyString) as PrivateKey;
  } catch (error) {
    console.error('Falha na descriptografia da chave privada:', error);
    return undefined;
  }
};

/**
 * Limpa a chave privada associada a um userId específico.
 * @param userId ID único do usuário.
 */
export const clearPrivateKey = async (userId: string) => {
  const db = await dbPromise;
  await db.delete(STORE_NAME, `privateKey_${userId}`);
};
