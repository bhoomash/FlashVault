/**
 * Serverless function for accessing password-protected files
 * POST: Access with verified password
 */

// Use global to persist between warm invocations
if (!global.fileSecrets) {
  global.fileSecrets = new Map();
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing secret ID' });
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

  if (metadata.expiresAt < Date.now()) {
    global.fileSecrets.delete(id);
    return res.status(410).json({
      error: 'Secret has expired and been destroyed'
    });
  }

  // Mark as accessed
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
};
