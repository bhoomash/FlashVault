import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import CreateText from './pages/CreateText'
import CreateFile from './pages/CreateFile'
import ViewSecret from './pages/ViewSecret'
import Layout from './components/Layout'

function App() {
  return (
    <Router>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/text" element={<CreateText />} />
            <Route path="/file" element={<CreateFile />} />
            <Route path="/secret/:id" element={<ViewSecret />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </Router>
  )
}

export default App
