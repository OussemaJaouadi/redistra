/// <reference types="@types/bun" />
import { env } from '@/env'

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256 // 256 bits
const IV_LENGTH = 12 // GCM standard

// Derive key from ENCRYPTION_KEY using PBKDF2
async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.ENCRYPTION_KEY),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('redis-ui-connection'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(text: string): Promise<string> {
  const key = await getKey()
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(text)
  )

  // Combine IV + encrypted data + auth tag
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return Buffer.from(combined).toString('base64')
}

export async function decrypt(encryptedText: string): Promise<string> {
  const key = await getKey()
  const decoder = new TextDecoder()
  const combined = Buffer.from(encryptedText, 'base64')

  const iv = combined.slice(0, IV_LENGTH)
  const data = combined.slice(IV_LENGTH)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data
  )

  return decoder.decode(decrypted)
}
