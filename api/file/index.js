/**
 * Serverless function for file operations
 * POST: Store encrypted file
 * Note: Vercel has a 4.5MB request body limit on free tier
 */

const { v4: uuidv4 } = require('uuid');

const EXPIRY_OPTIONS = {
  '5m': 5 * 60 * 1000,
  '10m': 10 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000
};

function getExpiryTime(option) {
  return EXPIRY_OPTIONS[option] || EXPIRY_OPTIONS['10m'];
}

// Use global to persist between warm invocations
if (!global.fileSecrets) {
  global.fileSecrets = new Map();
}

// Export config for larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { encryptedData, iv, originalName, mimeType, expiresIn, passwordHash, passwordSalt, passwordIv } = req.body;

      if (!encryptedData || !iv) {
        return res.status(400).json({
          error: 'Missing required fields: encryptedData and iv'
        });
      }

      // Validate expiry option
      const validExpiry = ['5m', '10m', '30m', '1h', '24h'];
      const expiryOption = validExpiry.includes(expiresIn) ? expiresIn : '10m';

      // Generate unique ID
      const id = uuidv4();

      // Store in global memory
      global.fileSecrets.set(id, {
        type: 'file',
        encryptedData,
        iv,
        originalName: originalName || 'unknown',
        mimeType: mimeType || 'application/octet-stream',
        size: encryptedData.length,
        hasPassword: !!passwordHash,
        passwordHash: passwordHash || null,
        passwordSalt: passwordSalt || null,
        passwordIv: passwordIv || null,
        createdAt: Date.now(),
        expiresAt: Date.now() + getExpiryTime(expiryOption),
        accessed: false
      });

      console.log(`[File] Created secret: ${id} (expires: ${expiryOption})`);

      return res.status(201).json({
        id,
        expiresIn: getExpiryTime(expiryOption) / 1000,
        size: encryptedData.length
      });

    } catch (error) {
      console.error('[File] Error creating secret:', error);
      return res.status(500).json({ error: 'Failed to store encrypted file' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
