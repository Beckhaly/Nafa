import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'

/* ── SVG icons ─────────────────────────────────────────────── */
const icons = {
  dashboard:   'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  membres:     'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  cotisations: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  prets:       'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  evenements:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  annonces:    'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  finances:    'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  settings:    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  admin:       'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  menu:        'M4 6h16M4 12h16M4 18h16',
  close:       'M6 18L18 6M6 6l12 12',
  chevron:     'M19 9l-7 7-7-7',
  logout:      'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  location:    'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  phone:       'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  mail:        'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  user:        'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
}

function Ico({ name, className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[name]} />
    </svg>
  )
}

const NAV = [
  { to: '/',            label: 'Tableau de bord', icon: 'dashboard'   },
  { to: '/membres',     label: 'Membres',         icon: 'membres'     },
  { to: '/cotisations', label: 'Cotisations',     icon: 'cotisations' },
  { to: '/prets',       label: 'Prêts',           icon: 'prets'       },
  { to: '/evenements',  label: 'Événements',      icon: 'evenements'  },
  { to: '/annonces',    label: 'Annonces',        icon: 'annonces'    },
  { to: '/finances',    label: 'Finances',    icon: 'finances'  },
  { to: '/parametres', label: 'Paramètres', icon: 'settings'  },
]

const ADMIN_NAV = [
  { to: '/admin/utilisateurs', label: 'Utilisateurs' },
  { to: '/admin/reference',    label: 'Données de référence' },
]

const ROLE_LABELS = {
  admin:      { label: 'Administrateur', color: 'bg-purple-100 text-purple-700' },
  tresorier:  { label: 'Trésorier',      color: 'bg-green-100 text-green-700'  },
  secretaire: { label: 'Secrétaire',     color: 'bg-blue-100 text-blue-700'    },
  lecteur:    { label: 'Lecteur',        color: 'bg-gray-100 text-gray-600'    },
  membre:     { label: 'Membre',         color: 'bg-orange-100 text-orange-700'},
}

/* ── Sidebar ──────────────────────────────────────────────── */
function SidebarContent({ onClose }) {
  const { settings } = useSettings()
  const location = useLocation()
  const nomAssociation = settings?.nom_association ?? 'Nafa'
  const slogan = settings?.slogan ?? 'Gestion Associative'

  const isAdminActive = location.pathname.startsWith('/admin')
  const [adminOpen, setAdminOpen] = useState(isAdminActive)

  useEffect(() => {
    if (isAdminActive) setAdminOpen(true)
  }, [isAdminActive])

  return (
    <>
      {/* Logo + nom association */}
      <div className="px-4 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-center">
            <img
              src="/images/nafa-logo.png"
              alt="Logo"
              className="w-24 h-24 object-contain drop-shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement.innerHTML = '<span class="text-white font-black text-3xl">N</span>'
              }}
            />
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-blue-300 hover:text-white p-1 rounded-lg flex-shrink-0">
              <Ico name="close" className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white text-blue-700 shadow-md shadow-blue-900/30'
                  : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`}>
                  <Ico name={icon} className="w-[18px] h-[18px]" />
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Administration collapsible */}
        <div className="pt-1">
          <button
            onClick={() => setAdminOpen((o) => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isAdminActive ? 'bg-white/10 text-white' : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Ico name="admin" className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="flex-1 text-left">Administration</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${adminOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={icons.chevron} />
            </svg>
          </button>

          {adminOpen && (
            <div className="mt-1 ml-6 space-y-0.5 border-l border-blue-500/50 pl-3">
              {ADMIN_NAV.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-blue-200/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Bas sidebar : version */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-3" />
        <p className="text-blue-400/60 text-[10px] text-center tracking-wide">
          Nafa Platform · v1.0
        </p>
      </div>
    </>
  )
}

/* ── User dropdown ────────────────────────────────────────── */
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const roleInfo = ROLE_LABELS[user?.role] ?? { label: user?.role ?? '', color: 'bg-gray-100 text-gray-600' }
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors group"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center
                        justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
          <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none mt-0.5 ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icons.chevron} />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header du dropdown */}
          <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center
                              justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none mt-1 ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="p-2">
            <button
              onClick={() => { setOpen(false); onLogout() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600
                         hover:bg-red-50 transition-colors font-medium"
            >
              <Ico name="logout" className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Company info block ───────────────────────────────────── */
function CompanyInfo({ settings }) {
  if (!settings) return null
  return (
    <div className="hidden lg:flex items-center gap-3 pr-4 border-r border-gray-200 mr-2">
      {settings.logo_url && (
        <img
          src={settings.logo_url}
          alt="Logo"
          className="w-10 h-10 object-contain rounded-lg"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}
      <div className="flex flex-col items-end">
        <p className="text-sm font-bold text-gray-800 leading-tight">{settings.nom_association}</p>
        {settings.slogan && (
          <p className="text-xs text-gray-400 leading-tight mt-0.5 italic">{settings.slogan}</p>
        )}
      </div>
    </div>
  )
}

/* ── Layout principal ─────────────────────────────────────── */
export default function Layout() {
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-xl">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile (overlay) */}
      <aside className={`
        lg:hidden fixed inset-y-0 left-0 z-30 flex flex-col w-64
        bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-xl
        transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent onClose={() => setOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar (desktop + mobile) */}
        <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">

          {/* Gauche : burger (mobile) ou espace */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <Ico name="menu" className="w-5 h-5" />
            </button>
            {/* Titre mobile */}
            <span className="lg:hidden font-bold text-blue-700 text-base truncate">
              {settings?.nom_association ?? 'Nafa'}
            </span>
          </div>

          {/* Droite : infos société + user */}
          <div className="flex items-center gap-2 ml-auto">
            <CompanyInfo settings={settings} />
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </header>

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
