/**
 * In-memory metadata store for encrypted secrets
 * All data is lost on server restart (privacy by design)
 */

const secrets = new Map();

// Default expiry time in milliseconds (10 minutes)
const DEFAULT_EXPIRY = 10 * 60 * 1000;

// Available expiry options in milliseconds
const EXPIRY_OPTIONS = {
  '5m': 5 * 60 * 1000,
  '10m': 10 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000
};

/**
 * Get expiry time in milliseconds from option string
 * @param {string} option - Expiry option string (e.g., '5m', '1h', '24h')
 * @returns {number} - Expiry time in milliseconds
 */
function getExpiryTime(option) {
  return EXPIRY_OPTIONS[option] || DEFAULT_EXPIRY;
}

/**
 * Store metadata for a secret
 * @param {string} id - Unique identifier for the secret
 * @param {object} metadata - Metadata object containing type, iv, filename, mimetype
 * @param {string} expiryOption - Expiry time option (e.g., '5m', '10m', '1h')
 */
function setSecret(id, metadata, expiryOption = '10m') {
  const expiryMs = getExpiryTime(expiryOption);
  secrets.set(id, {
    ...metadata,
    createdAt: Date.now(),
    expiresAt: Date.now() + expiryMs,
    expiryOption: expiryOption,
    accessed: false
  });
}

/**
 * Get metadata for a secret
 * @param {string} id - Unique identifier for the secret
 * @returns {object|null} - Metadata object or null if not found
 */
function getSecret(id) {
  return secrets.get(id) || null;
}

/**
 * Mark a secret as accessed (for one-time access)
 * @param {string} id - Unique identifier for the secret
 */
function markAccessed(id) {
  const secret = secrets.get(id);
  if (secret) {
    secret.accessed = true;
  }
}

/**
 * Delete a secret from memory
 * @param {string} id - Unique identifier for the secret
 */
function deleteSecret(id) {
  secrets.delete(id);
}

/**
 * Get all secrets (for cleanup purposes)
 * @returns {Map} - All secrets
 */
function getAllSecrets() {
  return secrets;
}

/**
 * Get expired secrets
 * @returns {Array} - Array of expired secret IDs
 */
function getExpiredSecrets() {
  const now = Date.now();
  const expired = [];
  
  secrets.forEach((metadata, id) => {
    if (metadata.expiresAt < now || metadata.accessed) {
      expired.push(id);
    }
  });
  
  return expired;
}

/**
 * Get store statistics
 * @returns {object} - Statistics about the store
 */
function getStats() {
  return {
    totalSecrets: secrets.size,
    memoryUsage: process.memoryUsage().heapUsed
  };
}

module.exports = {
  setSecret,
  getSecret,
  markAccessed,
  deleteSecret,
  getAllSecrets,
  getExpiredSecrets,
  getStats,
  getExpiryTime,
  DEFAULT_EXPIRY,
  EXPIRY_OPTIONS
};
