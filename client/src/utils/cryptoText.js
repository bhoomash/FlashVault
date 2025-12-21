/**
 * Text Encryption/Decryption Utilities
 * Uses Web Crypto API with AES-256-GCM
 */

/**
 * Generate a random AES-256 key
 * @returns {Promise<CryptoKey>} - Generated AES key
 */
export async function generateKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export CryptoKey to base64 string (for URL sharing)
 * @param {CryptoKey} key - The CryptoKey to export
 * @returns {Promise<string>} - Base64 encoded key
 */
export async function exportKey(key) {
  const rawKey = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(rawKey);
}

/**
 * Import base64 key string to CryptoKey
 * @param {string} base64Key - Base64 encoded key
 * @returns {Promise<CryptoKey>} - Imported CryptoKey
 */
export async function importKey(base64Key) {
  const rawKey = base64ToArrayBuffer(base64Key);
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text using AES-256-GCM
 * @param {string} plaintext - Text to encrypt
 * @param {CryptoKey} key - AES key
 * @returns {Promise<{encryptedData: string, iv: string}>} - Encrypted data and IV (base64)
 */
export async function encryptText(plaintext, key) {
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encode text to bytes
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);
  
  // Encrypt
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    plaintextBytes
  );
  
  return {
    encryptedData: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv)
  };
}

/**
 * Decrypt text using AES-256-GCM
 * @param {string} encryptedData - Base64 encrypted data
 * @param {string} ivBase64 - Base64 IV
 * @param {CryptoKey} key - AES key
 * @returns {Promise<string>} - Decrypted plaintext
 */
export async function decryptText(encryptedData, ivBase64, key) {
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);
  const iv = base64ToArrayBuffer(ivBase64);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encryptedBuffer
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Convert ArrayBuffer to base64 string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} - Base64 string
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 * @param {string} base64 - Base64 string
 * @returns {ArrayBuffer} - Converted buffer
 */
export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Make base64 string URL-safe
 * @param {string} base64 - Standard base64 string
 * @returns {string} - URL-safe base64 string
 */
export function toUrlSafeBase64(base64) {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert URL-safe base64 to standard base64
 * @param {string} urlSafe - URL-safe base64 string
 * @returns {string} - Standard base64 string
 */
export function fromUrlSafeBase64(urlSafe) {
  let base64 = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
}
