/**
 * Health check endpoint
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const textCount = global.textSecrets ? global.textSecrets.size : 0;
  const fileCount = global.fileSecrets ? global.fileSecrets.size : 0;
  
  res.json({
    status: 'ok',
    secrets: textCount + fileCount,
    timestamp: new Date().toISOString()
  });
};
