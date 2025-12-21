/**
 * Password-based encryption utilities
 * Uses PBKDF2 for key derivation and AES-256-GCM for encryption
 */

import { arrayBufferToBase64, base64ToArrayBuffer } from './cryptoText';

/**
 * Derive an encryption key from a password using PBKDF2
 * @param {string} password - The password to derive key from
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} - Derived AES key
 */
export async function deriveKeyFromPassword(password, salt) {
  // Import password as raw key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive AES key using PBKDF2
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with password
 * @param {ArrayBuffer} data - Data to encrypt
 * @param {string} password - Password for encryption
 * @returns {Promise<{encryptedData: ArrayBuffer, salt: string, iv: string}>}
 */
export async function encryptWithPassword(data, password) {
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from password
  const key = await deriveKeyFromPassword(password, salt);
  
  // Encrypt data
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );
  
  return {
    encryptedData,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv)
  };
}

/**
 * Decrypt data with password
 * @param {ArrayBuffer} encryptedData - Encrypted data
 * @param {string} password - Password for decryption
 * @param {string} saltBase64 - Base64 encoded salt
 * @param {string} ivBase64 - Base64 encoded IV
 * @returns {Promise<ArrayBuffer>} - Decrypted data
 */
export async function decryptWithPassword(encryptedData, password, saltBase64, ivBase64) {
  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  const iv = base64ToArrayBuffer(ivBase64);
  
  // Derive key from password
  const key = await deriveKeyFromPassword(password, salt);
  
  // Decrypt data
  return await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encryptedData
  );
}

/**
 * Hash password for storage and later verification
 * @param {string} password - Password to hash
 * @returns {Promise<{hash: string, salt: string, iv: string}>} - Password hash data
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from password
  const key = await deriveKeyFromPassword(password, salt);
  
  // Encrypt a known value with the derived key to create verifiable hash
  const verificationData = encoder.encode('LOCKBIN_PASSWORD_VERIFICATION');
  const encryptedVerification = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    verificationData
  );
  
  return {
    hash: arrayBufferToBase64(encryptedVerification),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv)
  };
}

/**
 * Verify password against stored hash
 * @param {string} password - Password to verify
 * @param {string} storedHash - Stored password hash (base64)
 * @param {string} saltBase64 - Salt used for hashing (base64)
 * @param {string} ivBase64 - IV used for hashing (base64)
 * @returns {Promise<boolean>} - True if password is correct
 */
export async function verifyPassword(password, storedHash, saltBase64, ivBase64) {
  try {
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
    const iv = base64ToArrayBuffer(ivBase64);
    const encryptedData = base64ToArrayBuffer(storedHash);
    
    // Derive key from password
    const key = await deriveKeyFromPassword(password, salt);
    
    // Try to decrypt the verification data
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedData
    );
    
    // Check if decrypted value matches expected verification string
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedData);
    return decryptedString === 'LOCKBIN_PASSWORD_VERIFICATION';
  } catch (err) {
    // Decryption failed = wrong password
    return false;
  }
}
