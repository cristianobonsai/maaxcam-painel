import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Painel from './pages/Painel.jsx'
import Cameras from './pages/Cameras.jsx'
import Admin from './pages/Admin.jsx'
import Grupos from './pages/Grupos.jsx'
import { AuthProvider, ProtectedRoute } from './auth/AuthContext.jsx'
import CameraSeguranca from './pages/CameraSeguranca.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/painel"
            element={
              <ProtectedRoute>
                <Painel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel/cameras"
            element={
              <ProtectedRoute>
                <Cameras />
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel/cameras/:id/seguranca"
            element={
              <ProtectedRoute>
                <CameraSeguranca />
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel/grupos"
            element={
              <ProtectedRoute>
                <Grupos />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
