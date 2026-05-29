import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './admin/AuthContext'
import './index.css'

const AdminLogin = lazy(() => import('./admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const AuthGuard = lazy(() => import('./admin/AuthGuard'))
const DigitalPage = lazy(() => import('./pages/DigitalPage'))
const TechDocsViewer = lazy(() => import('./pages/TechDocsViewer'))

const AdminLoader = () => (
  <div className="admin-loading"><div className="admin-spinner"></div></div>
)

if (import.meta.env.DEV && typeof window !== 'undefined' && window.localStorage.getItem('authDebug') === '1') {
  const lifecycleLog = (eventName, extra = {}) => {
    console.info('[AUTH_DEBUG][LIFECYCLE]', eventName, {
      href: window.location.href,
      visibility: document.visibilityState,
      wasDiscarded: !!document.wasDiscarded,
      ts: Date.now(),
      ...extra,
    })
  }

  window.addEventListener('focus', () => lifecycleLog('window-focus'))
  window.addEventListener('blur', () => lifecycleLog('window-blur'))
  window.addEventListener('online', () => lifecycleLog('online'))
  window.addEventListener('offline', () => lifecycleLog('offline'))
  window.addEventListener('pageshow', (e) => lifecycleLog('pageshow', { persisted: !!e.persisted }))
  window.addEventListener('pagehide', (e) => lifecycleLog('pagehide', { persisted: !!e.persisted }))
  document.addEventListener('visibilitychange', () => lifecycleLog('visibilitychange'))

  lifecycleLog('boot')
}

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container #root no encontrado')
}

// Evita createRoot duplicado en escenarios de HMR/reconexion del cliente.
const root = window.__DAIG_REACT_ROOT__ || ReactDOM.createRoot(container)
window.__DAIG_REACT_ROOT__ = root

root.render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/digital" element={
          <Suspense fallback={<AdminLoader />}>
            <DigitalPage />
          </Suspense>
        } />
        <Route path="/admin" element={
          <Suspense fallback={<AdminLoader />}>
            <AdminLogin />
          </Suspense>
        } />
        <Route
          path="/admin/dashboard"
          element={
            <Suspense fallback={<AdminLoader />}>
              <AuthGuard allowedRoles={['admin']}>
                <AdminDashboard />
              </AuthGuard>
            </Suspense>
          }
        />
        <Route
          path="/tecnico"
          element={
            <Suspense fallback={<AdminLoader />}>
              <AuthGuard allowedRoles={['admin', 'tecnico']}>
                <TechDocsViewer />
              </AuthGuard>
            </Suspense>
          }
        />
      </Routes>
    </AuthProvider>
  </BrowserRouter>,
)
