/**
 * Background cleanup job for expired secrets
 * Runs every minute to delete expired encrypted files and metadata
 */

const fs = require('fs');
const path = require('path');
const store = require('./store');

const TEMP_DIR = path.join(__dirname, 'temp');
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

/**
 * Delete an encrypted file from disk
 * @param {string} id - Secret ID (filename without extension)
 */
function deleteEncryptedFile(id) {
  const filePath = path.join(TEMP_DIR, `${id}.enc`);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Cleanup] Deleted file: ${id}.enc`);
    }
  } catch (error) {
    console.error(`[Cleanup] Error deleting file ${id}.enc:`, error.message);
  }
}

/**
 * Run cleanup job
 * Deletes expired secrets and their associated files
 */
function runCleanup() {
  const expiredIds = store.getExpiredSecrets();
  
  if (expiredIds.length > 0) {
    console.log(`[Cleanup] Found ${expiredIds.length} expired secrets`);
    
    expiredIds.forEach(id => {
      // Delete file from disk
      deleteEncryptedFile(id);
      
      // Delete metadata from memory
      store.deleteSecret(id);
    });
    
    console.log(`[Cleanup] Cleaned up ${expiredIds.length} secrets`);
  }
}

/**
 * Start the cleanup scheduler
 */
function startCleanupScheduler() {
  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  
  // Run cleanup immediately on start
  runCleanup();
  
  // Schedule cleanup to run every minute
  setInterval(runCleanup, CLEANUP_INTERVAL);
  
  console.log(`[Cleanup] Scheduler started (interval: ${CLEANUP_INTERVAL / 1000}s)`);
}

/**
 * Delete a specific secret immediately
 * @param {string} id - Secret ID
 */
function deleteSecretNow(id) {
  deleteEncryptedFile(id);
  store.deleteSecret(id);
  console.log(`[Cleanup] Immediately deleted secret: ${id}`);
}

module.exports = {
  startCleanupScheduler,
  deleteSecretNow,
  runCleanup
};
