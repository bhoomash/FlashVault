/**
 * Routes for encrypted text sharing
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const store = require('../store');
const { deleteSecretNow } = require('../cleanup');

const router = express.Router();
const TEMP_DIR = path.join(__dirname, '..', 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * POST /api/text
 * Store encrypted text
 * Body: { encryptedData: string (base64), iv: string (base64), expiresIn: string, passwordHash: string, passwordSalt: string, passwordIv: string }
 */
router.post('/', (req, res) => {
  try {
    const { encryptedData, iv, expiresIn, passwordHash, passwordSalt, passwordIv } = req.body;
    
    if (!encryptedData || !iv) {
      return res.status(400).json({ 
        error: 'Missing required fields: encryptedData and iv' 
      });
    }
    
    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(encryptedData) || !base64Regex.test(iv)) {
      return res.status(400).json({ 
        error: 'Invalid data format. Expected base64 encoded strings.' 
      });
    }
    
    // Validate expiry option
    const validExpiry = ['5m', '10m', '30m', '1h', '24h'];
    const expiryOption = validExpiry.includes(expiresIn) ? expiresIn : '10m';
    
    // Generate unique ID
    const id = uuidv4();
    
    // Store encrypted data to file
    const filePath = path.join(TEMP_DIR, `${id}.enc`);
    fs.writeFileSync(filePath, encryptedData, 'utf8');
    
    // Store metadata in memory
    store.setSecret(id, {
      type: 'text',
      iv: iv,
      hasPassword: !!passwordHash,
      passwordHash: passwordHash || null,
      passwordSalt: passwordSalt || null,
      passwordIv: passwordIv || null
    }, expiryOption);
    
    console.log(`[Text] Created secret: ${id} (expires: ${expiryOption}, password: ${!!passwordHash})`);
    
    res.status(201).json({
      id: id,
      expiresIn: store.getExpiryTime(expiryOption) / 1000 // seconds
    });
    
  } catch (error) {
    console.error('[Text] Error creating secret:', error);
    res.status(500).json({ error: 'Failed to store encrypted text' });
  }
});

/**
 * GET /api/text/:id
 * Retrieve and delete encrypted text (one-time access)
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Get metadata
    const metadata = store.getSecret(id);
    
    if (!metadata) {
      return res.status(404).json({ 
        error: 'Secret not found or already accessed' 
      });
    }
    
    if (metadata.accessed) {
      // Already accessed, delete and return error
      deleteSecretNow(id);
      return res.status(410).json({ 
        error: 'Secret has already been accessed and destroyed' 
      });
    }
    
    if (metadata.type !== 'text') {
      return res.status(400).json({ 
        error: 'Invalid secret type. Expected text.' 
      });
    }
    
    // Read encrypted data from file
    const filePath = path.join(TEMP_DIR, `${id}.enc`);
    
    if (!fs.existsSync(filePath)) {
      store.deleteSecret(id);
      return res.status(404).json({ 
        error: 'Encrypted data not found' 
      });
    }
    
    const encryptedData = fs.readFileSync(filePath, 'utf8');
    
    // Mark as accessed and delete immediately (one-time access)
    deleteSecretNow(id);
    
    console.log(`[Text] Secret accessed and destroyed: ${id}`);
    
    res.json({
      encryptedData: encryptedData,
      iv: metadata.iv,
      type: 'text',
      hasPassword: metadata.hasPassword || false,
      passwordSalt: metadata.passwordSalt || null,
      passwordIv: metadata.passwordIv || null
    });
    
  } catch (error) {
    console.error('[Text] Error retrieving secret:', error);
    res.status(500).json({ error: 'Failed to retrieve encrypted text' });
  }
});

/**
 * GET /api/text/:id/exists
 * Check if a secret exists without consuming it
 * Also returns password verification data for pre-verification
 */
router.get('/:id/exists', (req, res) => {
  const { id } = req.params;
  const metadata = store.getSecret(id);
  
  if (!metadata || metadata.accessed) {
    return res.json({ exists: false });
  }
  
  res.json({ 
    exists: true,
    type: metadata.type,
    expiresAt: metadata.expiresAt,
    hasPassword: metadata.hasPassword || false,
    // Include password verification data so client can verify before consuming
    passwordHash: metadata.passwordHash || null,
    passwordSalt: metadata.passwordSalt || null,
    passwordIv: metadata.passwordIv || null
  });
});

module.exports = router;
