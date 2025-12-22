/**
 * Serverless function for retrieving file by ID
 * GET: Retrieve and delete encrypted file (one-time access)
 * POST: Verify password for protected file
 */

// Use global to persist between warm invocations
if (!global.fileSecrets) {
  global.fileSecrets = new Map();
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing secret ID' });
  }

  // Clean up expired secrets
  const now = Date.now();
  for (const [secretId, data] of global.fileSecrets.entries()) {
    if (data.expiresAt < now) {
      global.fileSecrets.delete(secretId);
    }
  }

  const metadata = global.fileSecrets.get(id);

  if (!metadata) {
    return res.status(404).json({
      error: 'Secret not found or already accessed'
    });
  }

  if (metadata.accessed) {
    global.fileSecrets.delete(id);
    return res.status(410).json({
      error: 'Secret has already been accessed and destroyed'
    });
  }

  if (metadata.expiresAt < now) {
    global.fileSecrets.delete(id);
    return res.status(410).json({
      error: 'Secret has expired and been destroyed'
    });
  }

  // Handle password verification (POST request)
  if (req.method === 'POST') {
    if (!metadata.hasPassword) {
      return res.status(400).json({ error: 'This secret is not password protected' });
    }

    return res.json({
      passwordHash: metadata.passwordHash,
      passwordSalt: metadata.passwordSalt,
      passwordIv: metadata.passwordIv
    });
  }

  // GET request - retrieve the secret
  if (req.method === 'GET') {
    // Check if password required but not yet verified
    if (metadata.hasPassword) {
      return res.json({
        requiresPassword: true,
        type: metadata.type,
        originalName: metadata.originalName,
        mimeType: metadata.mimeType,
        size: metadata.size
      });
    }

    // Mark as accessed and return data
    metadata.accessed = true;

    // Schedule deletion
    setTimeout(() => {
      global.fileSecrets.delete(id);
    }, 1000);

    return res.json({
      encryptedData: metadata.encryptedData,
      iv: metadata.iv,
      type: metadata.type,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      size: metadata.size
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
