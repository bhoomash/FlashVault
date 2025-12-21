import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5">
        <nav className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div 
                className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </motion.div>
              <span className="text-xl font-bold">
                Lock<span className="text-primary-400">Bin</span>
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link 
                to="/text" 
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Share Text
              </Link>
              <Link 
                to="/file" 
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Share File
              </Link>
            </div>
          </div>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>End-to-end encrypted • No database • Zero knowledge</span>
            </div>
            
            <div className="text-gray-600 text-sm">
              © {new Date().getFullYear()} LockBin • Privacy First
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
