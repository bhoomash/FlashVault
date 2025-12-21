/**
 * File Encryption/Decryption Utilities
 * Uses Web Crypto API with AES-256-GCM
 */

import { 
  generateKey, 
  exportKey, 
  importKey, 
  arrayBufferToBase64, 
  base64ToArrayBuffer 
} from './cryptoText';

// Re-export key utilities
export { generateKey, exportKey, importKey };

/**
 * Encrypt file using AES-256-GCM
 * @param {File} file - File to encrypt
 * @param {CryptoKey} key - AES key
 * @returns {Promise<{encryptedBlob: Blob, iv: string, originalName: string, mimeType: string}>}
 */
export async function encryptFile(file, key) {
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();
  
  // Encrypt
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    fileBuffer
  );
  
  // Create blob from encrypted data
  const encryptedBlob = new Blob([encryptedBuffer], { 
    type: 'application/octet-stream' 
  });
  
  return {
    encryptedBlob,
    iv: arrayBufferToBase64(iv),
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream'
  };
}

/**
 * Decrypt file using AES-256-GCM
 * @param {string} encryptedDataBase64 - Base64 encrypted data
 * @param {string} ivBase64 - Base64 IV
 * @param {CryptoKey} key - AES key
 * @param {string} mimeType - Original file MIME type
 * @returns {Promise<Blob>} - Decrypted file as Blob
 */
export async function decryptFile(encryptedDataBase64, ivBase64, key, mimeType) {
  const encryptedBuffer = base64ToArrayBuffer(encryptedDataBase64);
  const iv = base64ToArrayBuffer(ivBase64);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encryptedBuffer
  );
  
  return new Blob([decryptedBuffer], { type: mimeType });
}

/**
 * Create a download link and trigger download
 * @param {Blob} blob - File blob to download
 * @param {string} filename - Filename for download
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format file size to human readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file icon based on MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} - Emoji icon
 */
export function getFileIcon(mimeType) {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('text')) return '📃';
  return '📁';
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {{valid: boolean, message: string}}
 */
export function validateFileSize(file, maxSizeMB = 20) {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    return {
      valid: false,
      message: `File too large. Maximum size is ${maxSizeMB} MB.`
    };
  }
  
  return { valid: true, message: '' };
}
