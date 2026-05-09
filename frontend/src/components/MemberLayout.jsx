import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'

const NAV = [
  { to: '/portail',           label: 'Accueil',       end: true },
  { to: '/portail/cotisations',  label: 'Cotisations'         },
  { to: '/portail/evenements',   label: 'Événements'          },
  { to: '/portail/annonces',     label: 'Annonces'            },
  { to: '/portail/profil',       label: 'Mon profil'          },
]

export default function MemberLayout() {
  const { user, logout }   = useAuth()
  const { settings }       = useSettings()
  const navigate            = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const location            = useLocation()

  const nomAssociation = settings?.nom_association ?? 'Nafa'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ── */}
      <header className="bg-blue-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 mr-2 flex-shrink-0">
            <img
              src="/images/nafa-logo.png"
              alt="Logo"
              className="w-9 h-9 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="font-bold text-lg tracking-wide">{nomAssociation}</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-600'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User + actions */}
          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold uppercase">
                {user?.name?.[0]}
              </div>
              <span className="text-sm text-blue-100 hidden lg:block">{user?.name}</span>
            </div>
            {user?.role !== 'membre' && (
              <button
                onClick={() => navigate('/')}
                className="text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-2.5 py-1 rounded-lg transition-colors"
              >
                Portail Admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-2.5 py-1 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden p-1 rounded-lg text-blue-200 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-blue-600 px-4 py-2 space-y-1 bg-blue-700">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-600'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
