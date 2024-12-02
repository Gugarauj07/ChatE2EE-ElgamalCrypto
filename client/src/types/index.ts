// src/types/index.ts

export interface User {
  id: string
  username: string
  publicKey: {
    p: string
    g: string
    y: string
  }
}

export interface AuthResponse {
  token: string
  user: User
  publicKey: User['publicKey']
  encryptedPrivateKey: string
}