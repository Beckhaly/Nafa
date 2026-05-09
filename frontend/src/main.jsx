import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'

import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import Layout          from './components/Layout'
import Login           from './pages/Login'
import Dashboard       from './pages/Dashboard'
import MembersPage     from './pages/MembersPage'
import CotisationsPage from './pages/CotisationsPage'
import LoanList        from './pages/LoanList'
import LoanDetail      from './pages/LoanDetail'
import EventsPage      from './pages/EventsPage'
import AnnoncesPage    from './pages/AnnoncesPage'
import SettingsPage        from './pages/SettingsPage'
import FinancePage         from './pages/FinancePage'
import ReferenceDataPage    from './pages/admin/ReferenceDataPage'
import UsersPage            from './pages/admin/UsersPage'
import MemberCardPage          from './pages/MemberCardPage'
import MemberLayout         from './components/MemberLayout'
import MemberDashboard      from './pages/portail/Dashboard'
import MesCotisations       from './pages/portail/MesCotisations'
import EvenementsPortail    from './pages/portail/Evenements'
import AnnoncesPortail      from './pages/portail/Annonces'
import MonProfil            from './pages/portail/MonProfil'

function PrivateRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'membre') return <Navigate to="/portail" replace />
  return children
}

function MemberRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index                    element={<Dashboard />} />
            <Route path="membres"           element={<MembersPage />} />
            <Route path="membres/:id/carte" element={<MemberCardPage />} />
            <Route path="cotisations"       element={<CotisationsPage />} />
            <Route path="prets"             element={<LoanList />} />
            <Route path="prets/:id"         element={<LoanDetail />} />
            <Route path="evenements"        element={<EventsPage />} />
            <Route path="annonces"          element={<AnnoncesPage />} />
            <Route path="finances"          element={<FinancePage />} />
            <Route path="parametres"        element={<SettingsPage />} />
            <Route path="admin/reference"    element={<ReferenceDataPage />} />
            <Route path="admin/utilisateurs" element={<UsersPage />} />
          </Route>
          <Route path="/portail" element={<MemberRoute><MemberLayout /></MemberRoute>}>
            <Route index                       element={<MemberDashboard />} />
            <Route path="cotisations"          element={<MesCotisations />} />
            <Route path="evenements"           element={<EvenementsPortail />} />
            <Route path="annonces"             element={<AnnoncesPortail />} />
            <Route path="profil"               element={<MonProfil />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
