import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import LoadingSpinner from '../components/LoadingSpinner'
import { importKey, decryptText, fromUrlSafeBase64 } from '../utils/cryptoText'
import { decryptFile, downloadBlob, getFileIcon, formatFileSize } from '../utils/cryptoFile'
import { verifyPassword } from '../utils/cryptoPassword'
import { getEncryptedText, getEncryptedFile, checkSecretExists } from '../utils/api'

export default function ViewSecret() {
  const { id } = useParams()
  const location = useLocation()
  
  const [status, setStatus] = useState('loading') // loading, confirm, password, decrypting, success, error
  const [error, setError] = useState('')
  const [secretType, setSecretType] = useState(null)
  const [decryptedContent, setDecryptedContent] = useState(null)
  const [fileInfo, setFileInfo] = useState(null)
  const [copied, setCopied] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState(null) // Store password verification data

  // Parse the hash fragment
  const parseHash = () => {
    const hash = location.hash.slice(1) // Remove #
    const params = new URLSearchParams(hash)
    return {
      key: params.get('key'),
      type: params.get('type') || 'text'
    }
  }

  useEffect(() => {
    const checkSecret = async () => {
      const hash = location.hash.slice(1)
      const params = new URLSearchParams(hash)
      const key = params.get('key')
      const type = params.get('type') || 'text'
      
      if (!key) {
        setStatus('error')
        setError('Invalid link: Missing encryption key')
        return
      }
      
      setSecretType(type)
      
      // Check if secret exists and has password
      try {
        const result = await checkSecretExists(id, type)
        if (!result.exists) {
          setStatus('error')
          setError('Secret not found or already accessed')
          return
        }
        setHasPassword(result.hasPassword || false)
        // Store password verification data for later use
        if (result.hasPassword) {
          setPasswordData({
            hash: result.passwordHash,
            salt: result.passwordSalt,
            iv: result.passwordIv
          })
        }
        setStatus('confirm')
      } catch (err) {
        setStatus('confirm')
      }
    }
    
    checkSecret()
  }, [location.hash, id])

  const handleReveal = async () => {
    // If password protected and not yet entered, show password prompt
    if (hasPassword && status === 'confirm') {
      setStatus('password')
      return
    }
    
    const { key, type } = parseHash()
    
    setPasswordError('')
    
    // Verify password BEFORE fetching/consuming the secret
    if (hasPassword && passwordData) {
      const isValid = await verifyPassword(password, passwordData.hash, passwordData.salt, passwordData.iv)
      if (!isValid) {
        setPasswordError('Incorrect password')
        return // Don't proceed - secret is still safe
      }
    }
    
    setStatus('decrypting')
    
    try {
      // Import the encryption key
      const standardBase64 = fromUrlSafeBase64(key)
      const cryptoKey = await importKey(standardBase64)
      
      if (type === 'text') {
        // Fetch and decrypt text (this consumes the secret)
        const data = await getEncryptedText(id)
        const plaintext = await decryptText(data.encryptedData, data.iv, cryptoKey)
        setDecryptedContent(plaintext)
      } else {
        // Fetch and decrypt file (this consumes the secret)
        const data = await getEncryptedFile(id)
        const decryptedBlob = await decryptFile(data.encryptedData, data.iv, cryptoKey, data.mimeType)
        
        setFileInfo({
          name: data.originalName,
          mimeType: data.mimeType,
          size: decryptedBlob.size,
          blob: decryptedBlob
        })
      }
      
      setStatus('success')
      
    } catch (err) {
      console.error('Decryption error:', err)
      setStatus('error')
      setError(err.message || 'Failed to decrypt secret')
    }
  }

  const handleDownload = () => {
    if (fileInfo?.blob) {
      downloadBlob(fileInfo.blob, fileInfo.name)
    }
  }

  const handleCopyText = async () => {
    if (decryptedContent) {
      try {
        await navigator.clipboard.writeText(decryptedContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Copy failed:', err)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center py-16">
            <LoadingSpinner text="Loading secret..." />
          </div>
        )}

        {/* Confirm State */}
        {status === 'confirm' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Encrypted Secret</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Someone shared an encrypted {secretType === 'file' ? 'file' : 'message'} with you. 
              Click below to decrypt and view it.
            </p>
            
            <div className="card max-w-md mx-auto mb-6">
              <div className="flex items-start gap-3 text-amber-400 text-sm mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-left">
                  <p className="font-medium">One-time access</p>
                  <p className="text-amber-400/70">This secret will be permanently destroyed after you view it.</p>
                </div>
              </div>
              
              <button
                onClick={handleReveal}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                {hasPassword ? 'Continue' : 'Decrypt & Reveal'}
              </button>
              
              {hasPassword && (
                <div className="mt-4 flex items-center gap-2 text-sm text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-lg p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>This secret is password protected</span>
                </div>
              )}
            </div>
            
            <p className="text-gray-600 text-sm">
              Make sure you're ready to save/copy the content before revealing.
            </p>
          </div>
        )}

        {/* Password State */}
        {status === 'password' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Enter Password</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              This secret is password protected. Enter the password to decrypt.
            </p>
            
            <div className="card max-w-md mx-auto mb-6">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setPasswordError('')
                    }}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 bg-dark-300 border border-dark-600 rounded-xl 
                               text-white placeholder-gray-500 pr-12
                               focus:ring-2 focus:ring-primary-500 focus:border-transparent 
                               transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-400 text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {passwordError}
                  </motion.div>
                )}
                
                <button
                  onClick={handleReveal}
                  disabled={!password.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Decrypt & Reveal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Decrypting State */}
        {status === 'decrypting' && (
          <div className="text-center py-16">
            <LoadingSpinner text="Decrypting..." />
          </div>
        )}

        {/* Success State - Text */}
        {status === 'success' && secretType === 'text' && (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Secret Revealed</h1>
              <p className="text-gray-400">This secret has been destroyed on the server</p>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Decrypted Message</span>
                <button
                  onClick={handleCopyText}
                  className={`text-sm flex items-center gap-1 transition-colors ${copied ? 'text-green-400' : 'text-primary-400 hover:text-primary-300'}`}
                >
                  {copied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              
              <div className="bg-dark-300 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                {decryptedContent}
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link to="/" className="btn-secondary inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Your Own Secret
              </Link>
            </div>
          </div>
        )}

        {/* Success State - File */}
        {status === 'success' && secretType === 'file' && fileInfo && (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">File Ready</h1>
              <p className="text-gray-400">This file has been destroyed on the server</p>
            </div>
            
            <div className="card">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center text-3xl">
                  {getFileIcon(fileInfo.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fileInfo.name}</p>
                  <p className="text-sm text-gray-400">
                    {formatFileSize(fileInfo.size)} • {fileInfo.mimeType}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleDownload}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download File
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <Link to="/" className="btn-secondary inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Share Your Own File
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Secret Not Available</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">{error}</p>
            
            <div className="card max-w-md mx-auto text-left">
              <h3 className="font-medium mb-3">This could mean:</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  The secret was already viewed and destroyed
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  The secret expired (secrets expire after 10 minutes)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  The link is invalid or corrupted
                </li>
              </ul>
            </div>
            
            <div className="mt-8">
              <Link to="/" className="btn-primary inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Home
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
