import { PrivateKey } from './elgamal';
import CryptoJS from 'crypto-js';

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
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
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
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // IV de 96 bits para AES-GCM
  const encodedPrivateKey = encoder.encode(privateKey.x);
  const encrypted = await window.crypto.subtle.encrypt(
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
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
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
  const decrypted = await window.crypto.subtle.decrypt(
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
 */
const bufferToBase64 = (buffer: Uint8Array): string => {
  let binary = '';
  buffer.forEach((b) => binary += String.fromCharCode(b));
  return window.btoa(binary);
};

/**
 * Função auxiliar para converter base64 para Uint8Array
 */
const base64ToBuffer = (base64: string): Uint8Array => {
  const binary = window.atob(base64);
  const buffer = new Uint8Array(binary.length);
  Array.from(binary).forEach((char, i) => {
    buffer[i] = char.charCodeAt(0);
  });
  return buffer;
};

export const encryptMessage = (message: string, senderKey: string): string => {
  return CryptoJS.AES.encrypt(message, senderKey).toString();
};

export const decryptMessage = (encryptedContent: string, senderKey: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedContent, senderKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};