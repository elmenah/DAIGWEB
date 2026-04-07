import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './admin/AuthContext'
import './index.css'

const AdminLogin = lazy(() => import('./admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const AuthGuard = lazy(() => import('./admin/AuthGuard'))

const AdminLoader = () => (
  <div className="admin-loading"><div className="admin-spinner"></div></div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={
            <Suspense fallback={<AdminLoader />}>
              <AdminLogin />
            </Suspense>
          } />
          <Route
            path="/admin/dashboard"
            element={
              <Suspense fallback={<AdminLoader />}>
                <AuthGuard>
                  <AdminDashboard />
                </AuthGuard>
              </Suspense>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
