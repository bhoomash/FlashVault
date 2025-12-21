import { useState } from 'react'
import { motion } from 'framer-motion'
import FileUploader from '../components/FileUploader'
import ShareLink from '../components/ShareLink'
import LoadingSpinner from '../components/LoadingSpinner'
import PasswordInput from '../components/PasswordInput'
import ExpirySelector from '../components/ExpirySelector'
import { generateKey, exportKey, encryptFile } from '../utils/cryptoFile'
import { toUrlSafeBase64 } from '../utils/cryptoText'
import { hashPassword } from '../utils/cryptoPassword'
import { storeEncryptedFile } from '../utils/api'

export default function CreateFile() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [password, setPassword] = useState('')
  const [expiresIn, setExpiresIn] = useState('10m')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setError('Please select a file')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      // Step 1: Generate encryption key
      setProgress('Generating encryption key...')
      const key = await generateKey()
      
      // Step 2: Encrypt the file
      setProgress('Encrypting file...')
      const { encryptedBlob, iv, originalName, mimeType } = await encryptFile(selectedFile, key)
      
      // Step 3: Export key for URL
      setProgress('Preparing secure link...')
      const exportedKey = await exportKey(key)
      const urlSafeKey = toUrlSafeBase64(exportedKey)
      
      // Step 4: Handle password protection if set
      let passwordData = {}
      if (password.trim()) {
        setProgress('Setting up password protection...')
        const { hash, salt, iv: pwIv } = await hashPassword(password)
        passwordData = {
          passwordHash: hash,
          passwordSalt: salt,
          passwordIv: pwIv
        }
      }
      
      // Step 5: Upload encrypted file
      setProgress('Uploading encrypted file...')
      const response = await storeEncryptedFile(encryptedBlob, iv, originalName, mimeType, {
        expiresIn,
        ...passwordData
      })
      
      // Step 6: Create shareable link
      const baseUrl = window.location.origin
      const shareLink = `${baseUrl}/secret/${response.id}#key=${urlSafeKey}&type=file`
      
      setResult({
        link: shareLink,
        expiresIn: response.expiresIn,
        hasPassword: !!password.trim()
      })
      setProgress('')
      
    } catch (err) {
      console.error('Encryption error:', err)
      setError(err.message || 'Failed to encrypt and upload file')
      setProgress('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPassword('')
    setExpiresIn('10m')
    setResult(null)
    setError('')
    setProgress('')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Share Encrypted File</h1>
          <p className="text-gray-400">Upload any file up to 20 MB — encrypted in your browser</p>
        </div>

        {/* Main Card */}
        <div className="card">
          {result ? (
            <>
              <ShareLink link={result.link} expiresIn={result.expiresIn} />
              
              <div className="mt-6 pt-6 border-t border-white/5">
                <button
                  onClick={handleReset}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Share Another File
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select File
                </label>
                <FileUploader
                  onFileSelect={handleFileSelect}
                  disabled={isLoading}
                  maxSizeMB={20}
                />
              </div>

              {/* Advanced Options */}
              <div className="pt-2 space-y-4 border-t border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Security Options</p>
                
                <PasswordInput 
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter a password (optional)"
                />
                
                <ExpirySelector
                  value={expiresIn}
                  onChange={setExpiresIn}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </motion.div>
              )}

              {isLoading && progress && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-primary-400 text-sm bg-primary-500/10 border border-primary-500/20 rounded-lg p-3"
                >
                  <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                  {progress}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading || !selectedFile}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" text="" />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Encrypt & Upload
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Info Box */}
        <motion.div
          className="mt-6 flex items-start gap-3 text-sm text-gray-500 bg-dark-300/30 rounded-xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <p className="font-medium text-gray-400 mb-1">Supported file types:</p>
            <ul className="space-y-1 text-gray-500">
              <li>• PDF, Word, Excel, PowerPoint documents</li>
              <li>• Images (JPEG, PNG, GIF, WebP)</li>
              <li>• Archives (ZIP, RAR, 7z)</li>
              <li>• Any other file type up to 20 MB</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
