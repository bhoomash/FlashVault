/**
 * Routes for encrypted file sharing
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const store = require('../store');
const { deleteSecretNow } = require('../cleanup');

const router = express.Router();
const TEMP_DIR = path.join(__dirname, '..', 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB limit
  }
});

/**
 * POST /api/file
 * Store encrypted file
 * Multipart form: encryptedFile (binary), iv (string), originalName (string), mimeType (string), expiresIn, passwordHash, passwordSalt, passwordIv
 */
router.post('/', upload.single('encryptedFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }
    
    const { iv, originalName, mimeType, expiresIn, passwordHash, passwordSalt, passwordIv } = req.body;
    
    if (!iv) {
      return res.status(400).json({ 
        error: 'Missing required field: iv' 
      });
    }
    
    // Validate expiry option
    const validExpiry = ['5m', '10m', '30m', '1h', '24h'];
    const expiryOption = validExpiry.includes(expiresIn) ? expiresIn : '10m';
    
    // Generate unique ID
    const id = uuidv4();
    
    // Store encrypted file to disk
    const filePath = path.join(TEMP_DIR, `${id}.enc`);
    fs.writeFileSync(filePath, req.file.buffer);
    
    // Store metadata in memory
    store.setSecret(id, {
      type: 'file',
      iv: iv,
      originalName: originalName || 'unknown',
      mimeType: mimeType || 'application/octet-stream',
      size: req.file.size,
      hasPassword: !!passwordHash,
      passwordHash: passwordHash || null,
      passwordSalt: passwordSalt || null,
      passwordIv: passwordIv || null
    }, expiryOption);
    
    console.log(`[File] Created secret: ${id} (${originalName}, ${req.file.size} bytes, expires: ${expiryOption}, password: ${!!passwordHash})`);
    
    res.status(201).json({
      id: id,
      expiresIn: store.getExpiryTime(expiryOption) / 1000, // seconds
      size: req.file.size
    });
    
  } catch (error) {
    console.error('[File] Error creating secret:', error);
    res.status(500).json({ error: 'Failed to store encrypted file' });
  }
});

/**
 * GET /api/file/:id
 * Retrieve and delete encrypted file (one-time access)
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
    
    if (metadata.type !== 'file') {
      return res.status(400).json({ 
        error: 'Invalid secret type. Expected file.' 
      });
    }
    
    // Read encrypted file from disk
    const filePath = path.join(TEMP_DIR, `${id}.enc`);
    
    if (!fs.existsSync(filePath)) {
      store.deleteSecret(id);
      return res.status(404).json({ 
        error: 'Encrypted file not found' 
      });
    }
    
    const encryptedData = fs.readFileSync(filePath);
    
    // Mark as accessed and delete immediately (one-time access)
    deleteSecretNow(id);
    
    console.log(`[File] Secret accessed and destroyed: ${id}`);
    
    // Send as JSON with base64 encoded data
    res.json({
      encryptedData: encryptedData.toString('base64'),
      iv: metadata.iv,
      type: 'file',
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      hasPassword: metadata.hasPassword || false,
      passwordSalt: metadata.passwordSalt || null,
      passwordIv: metadata.passwordIv || null
    });
    
  } catch (error) {
    console.error('[File] Error retrieving secret:', error);
    res.status(500).json({ error: 'Failed to retrieve encrypted file' });
  }
});

/**
 * GET /api/file/:id/exists
 * Check if a secret exists without consuming it
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
    originalName: metadata.originalName,
    mimeType: metadata.mimeType,
    size: metadata.size,
    expiresAt: metadata.expiresAt,
    hasPassword: metadata.hasPassword || false,
    // Include password verification data so client can verify before consuming
    passwordHash: metadata.passwordHash || null,
    passwordSalt: metadata.passwordSalt || null,
    passwordIv: metadata.passwordIv || null
  });
});

module.exports = router;
