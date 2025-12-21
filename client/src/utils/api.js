/**
 * API utility functions for communicating with the backend
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Store encrypted text on the server
 * @param {string} encryptedData - Base64 encrypted data
 * @param {string} iv - Base64 IV
 * @param {object} options - Optional settings
 * @param {string} options.expiresIn - Expiry time (5m, 10m, 30m, 1h, 24h)
 * @param {string} options.passwordHash - Hashed password
 * @param {string} options.passwordSalt - Password salt
 * @param {string} options.passwordIv - Password IV
 * @returns {Promise<{id: string, expiresIn: number}>}
 */
export async function storeEncryptedText(encryptedData, iv, options = {}) {
  const response = await fetch(`${API_BASE}/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      encryptedData, 
      iv,
      expiresIn: options.expiresIn,
      passwordHash: options.passwordHash,
      passwordSalt: options.passwordSalt,
      passwordIv: options.passwordIv
    })
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to store secret';
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch (e) {
      // Response is not JSON
    }
    throw new Error(errorMessage);
  }
  
  return await response.json();
}

/**
 * Retrieve encrypted text from the server
 * @param {string} id - Secret ID
 * @returns {Promise<{encryptedData: string, iv: string, type: string}>}
 */
export async function getEncryptedText(id) {
  const response = await fetch(`${API_BASE}/text/${id}`);
  
  if (response.status === 404) {
    throw new Error('Secret not found or already accessed');
  }
  
  if (response.status === 410) {
    throw new Error('Secret has already been accessed and destroyed');
  }
  
  if (!response.ok) {
    let errorMessage = 'Failed to retrieve secret';
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch (e) {
      // Response is not JSON
    }
    throw new Error(errorMessage);
  }
  
  return await response.json();
}

/**
 * Store encrypted file on the server
 * @param {Blob} encryptedBlob - Encrypted file blob
 * @param {string} iv - Base64 IV
 * @param {string} originalName - Original filename
 * @param {string} mimeType - Original MIME type
 * @param {object} options - Optional settings
 * @param {string} options.expiresIn - Expiry time (5m, 10m, 30m, 1h, 24h)
 * @param {string} options.passwordHash - Hashed password
 * @param {string} options.passwordSalt - Password salt
 * @param {string} options.passwordIv - Password IV
 * @returns {Promise<{id: string, expiresIn: number, size: number}>}
 */
export async function storeEncryptedFile(encryptedBlob, iv, originalName, mimeType, options = {}) {
  const formData = new FormData();
  formData.append('encryptedFile', encryptedBlob, 'encrypted.bin');
  formData.append('iv', iv);
  formData.append('originalName', originalName);
  formData.append('mimeType', mimeType);
  
  if (options.expiresIn) formData.append('expiresIn', options.expiresIn);
  if (options.passwordHash) formData.append('passwordHash', options.passwordHash);
  if (options.passwordSalt) formData.append('passwordSalt', options.passwordSalt);
  if (options.passwordIv) formData.append('passwordIv', options.passwordIv);
  
  const response = await fetch(`${API_BASE}/file`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to store file';
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch (e) {
      // Response is not JSON
    }
    throw new Error(errorMessage);
  }
  
  return await response.json();
}

/**
 * Retrieve encrypted file from the server
 * @param {string} id - Secret ID
 * @returns {Promise<{encryptedData: string, iv: string, type: string, originalName: string, mimeType: string}>}
 */
export async function getEncryptedFile(id) {
  const response = await fetch(`${API_BASE}/file/${id}`);
  
  if (response.status === 404) {
    throw new Error('Secret not found or already accessed');
  }
  
  if (response.status === 410) {
    throw new Error('Secret has already been accessed and destroyed');
  }
  
  if (!response.ok) {
    let errorMessage = 'Failed to retrieve file';
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch (e) {
      // Response is not JSON
    }
    throw new Error(errorMessage);
  }
  
  return await response.json();
}

/**
 * Check if a secret exists
 * @param {string} id - Secret ID
 * @param {string} type - 'text' or 'file'
 * @returns {Promise<{exists: boolean, type?: string, expiresAt?: number}>}
 */
export async function checkSecretExists(id, type = 'text') {
  const response = await fetch(`${API_BASE}/${type}/${id}/exists`);
  
  if (!response.ok) {
    return { exists: false };
  }
  
  return await response.json();
}

/**
 * Get server health status
 * @returns {Promise<{status: string, uptime: number, secrets: number}>}
 */
export async function getHealth() {
  const response = await fetch(`${API_BASE.replace('/api', '')}/health`);
  
  if (!response.ok) {
    throw new Error('Server unavailable');
  }
  
  return await response.json();
}
