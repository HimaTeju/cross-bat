import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './admin/admin.css'
import './landing/landing.css'
import './career/career.css'
import Landing from './landing/Landing.jsx'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'
import AwardsReview from './admin/AwardsReview.jsx'
import CareerPath from './career/CareerPath.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/ipl-grid" element={<App />} />
        <Route path="/ipl-grid/admin" element={<AdminApp />} />
        <Route path="/ipl-grid/admin/awards" element={<AwardsReview />} />
        <Route path="/career-path" element={<CareerPath />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
