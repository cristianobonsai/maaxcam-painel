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
import Notificacoes from './pages/Notificacoes.jsx'
import { AuthProvider, ProtectedRoute } from './auth/AuthContext.jsx'
import CameraSeguranca from './pages/CameraSeguranca.jsx'
import Layout from './Layout.jsx'
import Mapa from './pages/Mapa.jsx'
import Logs from './pages/Logs.jsx'
import Faturamento from './pages/Faturamento.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/painel" element={<Painel />} />
            <Route path="/painel/cameras" element={<Cameras />} />
            <Route path="/painel/mapa" element={<Mapa />} />
            <Route path="/painel/cameras/:id/seguranca" element={<CameraSeguranca />} />
            <Route path="/painel/admin" element={<Admin />} />
            <Route path="/painel/grupos" element={<Grupos />} />
            <Route path="/painel/notificacoes" element={<Notificacoes />} />
            <Route path="/painel/logs" element={<Logs />} />
            <Route path="/painel/faturamento" element={<Faturamento />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
