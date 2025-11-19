import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import InspectPage from './pages/InspectPage'
import HistoryPage from './pages/HistoryPage'
import CanvasTestPage from './pages/CanvasTestPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/inspect/:taskId" element={<InspectPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/canvas-test" element={<CanvasTestPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
