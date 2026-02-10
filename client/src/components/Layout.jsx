import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Layout({ children }) {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.img 
                src="/logo.png"
                alt="FlashVault"
                className="w-10 h-10 rounded-xl"
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ type: "spring", stiffness: 400 }}
              />
              <span className="text-xl font-bold text-black">
                Flash<span className="text-gray-600">Vault</span>
              </span>
            </Link>
            
            <div className="flex items-center gap-6">
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
          </div>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 bg-white">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>End-to-end encrypted • No database • Zero knowledge</span>
            </div>
            
            <div className="text-gray-400 text-sm">
                © {new Date().getFullYear()} FlashVault • Privacy First
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
