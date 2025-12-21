import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function MessageBox({ 
  value, 
  onChange, 
  placeholder = "Enter your secret message...",
  disabled = false,
  readOnly = false,
  maxLength = 100000 
}) {
  const [charCount, setCharCount] = useState(0)
  
  useEffect(() => {
    setCharCount(value?.length || 0)
  }, [value])
  
  const handleChange = (e) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      onChange(newValue)
    }
  }
  
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        rows={8}
        className={`
          textarea-field font-mono text-sm leading-relaxed
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${readOnly ? 'cursor-default' : ''}
        `}
      />
      
      {!readOnly && (
        <motion.div 
          className="absolute bottom-3 right-3 text-xs text-gray-500"
          animate={{ 
            color: charCount > maxLength * 0.9 ? '#ef4444' : '#6b7280'
          }}
        >
          {charCount.toLocaleString()} / {maxLength.toLocaleString()}
        </motion.div>
      )}
    </div>
  )
}
