import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ClientTracking from './ClientTracking.jsx'
import ClientOrderForm from './ClientOrderForm.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/track" element={<ClientTracking />} />
        <Route path="/track/:orderId" element={<ClientTracking />} />
        <Route path="/new-order" element={<ClientOrderForm />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
