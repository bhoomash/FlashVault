import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatFileSize, getFileIcon, validateFileSize } from '../utils/cryptoFile'

export default function FileUploader({ onFileSelect, disabled = false, maxSizeMB = 20 }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }
  
  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }
  
  const handleFile = (file) => {
    setError('')
    
    const validation = validateFileSize(file, maxSizeMB)
    if (!validation.valid) {
      setError(validation.message)
      return
    }
    
    setSelectedFile(file)
    onFileSelect(file)
  }
  
  const removeFile = () => {
    setSelectedFile(null)
    setError('')
    onFileSelect(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }
  
  const openFileDialog = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }
  
  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${dragActive 
                ? 'border-black bg-gray-100' 
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div 
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  ${dragActive ? 'bg-primary-500/20' : 'bg-gray-100'}
                `}
                animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`w-8 h-8 ${dragActive ? 'text-primary-400' : 'text-gray-400'}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </motion.div>
              
              <div>
                <p className="text-black font-medium mb-1">
                  {dragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                </p>
                <p className="text-gray-500 text-sm">
                  or click to browse • Max {maxSizeMB} MB
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded">PDF</span>
                <span className="px-2 py-1 bg-gray-100 rounded">Images</span>
                <span className="px-2 py-1 bg-gray-100 rounded">ZIP</span>
                <span className="px-2 py-1 bg-gray-100 rounded">Documents</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="selected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-primary-500/30 bg-primary-500/5 rounded-xl p-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center text-2xl">
                {getFileIcon(selectedFile.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-black font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-gray-400 text-sm">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                </p>
              </div>
              
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile()
                  }}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-red-400 text-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
