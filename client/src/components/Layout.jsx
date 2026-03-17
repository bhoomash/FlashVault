import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function Layout({ children }) {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <motion.img 
                src="/logo.png"
                alt="FlashVault"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl"
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ type: "spring", stiffness: 400 }}
              />
              <span className="text-lg sm:text-xl font-bold text-black">
                Flash<span className="text-gray-600">Vault</span>
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-6">
              <Link 
                to="/text" 
                className="text-gray-600 hover:text-black transition-colors text-sm font-medium"
              >
                Share Text
              </Link>
              <Link 
                to="/file" 
                className="text-gray-600 hover:text-black transition-colors text-sm font-medium"
              >
                Share File
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="sm:hidden p-2 -mr-2 text-gray-600 hover:text-black"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="sm:hidden overflow-hidden"
              >
                <div className="pt-4 pb-2 space-y-2">
                  <Link 
                    to="/text" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 px-3 rounded-lg text-gray-600 hover:text-black hover:bg-gray-50 transition-colors font-medium"
                  >
                    Share Text
                  </Link>
                  <Link 
                    to="/file" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 px-3 rounded-lg text-gray-600 hover:text-black hover:bg-gray-50 transition-colors font-medium"
                  >
                    Share File
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 bg-white">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm text-center md:text-left">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>End-to-end encrypted • Zero knowledge</span>
            </div>
            
            <div className="text-gray-400 text-xs sm:text-sm">
                © {new Date().getFullYear()} FlashVault
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
