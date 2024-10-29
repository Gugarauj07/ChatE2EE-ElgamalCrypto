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
  try {
    const db = await dbPromise;

    const privateKeyString = JSON.stringify(privateKey);

    const salt = window.crypto.getRandomValues(new Uint8Array(16));

    const cryptoKey = await deriveKey(password, salt);

    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encoder = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      cryptoKey,
      encoder.encode(privateKeyString)
    );

    const storedData = {
      salt: Array.from(salt),
      iv: Array.from(iv),
      encrypted: Array.from(new Uint8Array(encrypted)),
    };

    await db.put(STORE_NAME, storedData, `privateKey_${userId}`);
  } catch (error) {
    console.error('Erro ao salvar a chave privada:', error);
    throw error;
  }
};

/**
 * Obtém a chave privada desencriptada associada a um userId específico.
 * @param userId ID único do usuário.
 * @param password Senha do usuário para derivar a chave de descriptografia.
 * @returns Chave privada ou undefined se não encontrada ou falha na descriptografia.
 */
export const getPrivateKey = async (userId: string, password: string): Promise<PrivateKey | undefined> => {
  try {
    const db = await dbPromise;
    const storedData = await db.get(STORE_NAME, `privateKey_${userId}`);

    if (!storedData) {
      console.warn('Dados armazenados não encontrados para userId:', userId);
      return undefined;
    }

    const { salt, iv, encrypted }: { salt: number[]; iv: number[]; encrypted: number[] } = storedData;

    const saltBytes = new Uint8Array(salt);
    const ivBytes = new Uint8Array(iv);
    const encryptedBytes = new Uint8Array(encrypted);

    const cryptoKey = await deriveKey(password, saltBytes);

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
