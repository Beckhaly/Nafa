import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DEMO_ACCOUNTS = [
  { label: 'Admin',      email: 'admin@nafa.sn',      role: 'Administrateur' },
  { label: 'Trésorier',  email: 'tresorier@nafa.sn',  role: 'Finances' },
  { label: 'Secrétaire', email: 'secretaire@nafa.sn', role: 'Membres & Événements' },
  { label: 'Membre',     email: 'membre@nafa.sn',     role: 'Portail membre' },
]

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]       = useState({ login: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const u = await login(form.login, form.password)
      navigate(u.role === 'membre' ? '/portail' : '/')
    } catch {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email) =>
    setForm({ login: email, password: 'password' })

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche : branding ── */}
      <div className="hidden lg:flex flex-col justify-center items-center w-[52%] bg-gradient-to-br from-[#0f1f3d] via-[#152a52] to-[#1a3566] px-14 py-12 text-white relative overflow-hidden">

        {/* Cercles décoratifs de fond */}
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-white/[0.03]" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/[0.04]" />
        <div className="absolute top-1/3 right-12 w-48 h-48 rounded-full bg-blue-500/10" />
        <div className="absolute top-16 left-20 w-24 h-24 rounded-full bg-blue-400/10" />

        {/* Contenu centré */}
        <div className="relative z-10 text-center max-w-md">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/images/nafa-logo.png"
              alt="Nafa"
              className="w-72 h-72 object-contain drop-shadow-xl"
            />
          </div>

          {/* Accroche */}
          <h2 className="text-4xl font-bold leading-tight mb-5 text-white">
            La plateforme de gestion<br />
            <span className="text-blue-300">associative par excellence&nbsp;!</span>
          </h2>
          <p className="text-blue-200/80 text-sm leading-relaxed">
            Membres, cotisations, prêts, événements et diffusion SMS/WhatsApp —
            tout en un seul endroit.
          </p>

          {/* Stats rapides */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '100%', label: 'Sécurisé' },
              { value: 'SMS', label: 'Diffusion' },
              { value: '24/7', label: 'Disponible' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/5 rounded-xl py-3 px-2">
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-blue-300 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Version en bas */}
        <p className="absolute bottom-6 text-blue-400/60 text-xs z-10">
          Nafa — v1.0 · Avril 2026
        </p>
      </div>

      {/* ── Panneau droit : formulaire ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#f2ede5] px-6 py-12">

        {/* Logo mobile uniquement */}
        <div className="lg:hidden text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-12 h-12 rounded-xl bg-[#0f1f3d] flex items-center justify-center">
              <span className="text-xl font-black text-white">N</span>
            </div>
            <span className="text-2xl font-bold text-[#0f1f3d]">NAFA</span>
          </div>
          <p className="text-gray-400 text-sm">Plateforme de gestion associative</p>
        </div>

        <div className="w-full max-w-sm">

          {/* Label espace */}
          <p className="text-center text-xs font-bold tracking-[0.25em] uppercase text-blue-700 mb-3">
            Espace de gestion
          </p>

          {/* Titre */}
          <h1 className="text-3xl font-bold text-[#0f1f3d] text-center mb-6">
            Connexion
          </h1>

          {/* Carte formulaire */}
          <div className="bg-[#e8e2d8] rounded-2xl px-6 py-7 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Identifiant */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-[#1a2a4a]">
                    Identifiant de connexion
                  </label>
                  <div className="w-5 h-5 rounded-full bg-[#1a2a4a] flex items-center justify-center cursor-help"
                       title="Email ou numéro de téléphone">
                    <span className="text-white text-[10px] font-bold">?</span>
                  </div>
                </div>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-transparent bg-white text-sm
                             text-gray-900 placeholder-gray-400 shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             transition"
                  placeholder="Identifiant de votre espace"
                  value={form.login ?? ''}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-semibold text-[#1a2a4a] mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-transparent bg-white text-sm
                               text-gray-900 placeholder-gray-400 shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500
                               transition"
                    placeholder="Votre mot de passe"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center
                               bg-blue-700 hover:bg-blue-800 rounded-r-xl text-white transition"
                    tabIndex={-1}
                  >
                    {showPwd ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Bouton SE CONNECTER */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800
                           disabled:opacity-60 text-white font-bold rounded-xl px-4 py-3.5 text-sm
                           tracking-widest uppercase shadow-md transition-colors mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Connexion…
                  </>
                ) : 'Se connecter'}
              </button>
            </form>

            {/* Mot de passe oublié */}
            <div className="mt-4 text-center">
              <button type="button" className="text-sm text-blue-700 hover:text-blue-900 hover:underline font-medium transition">
                Mot de passe oublié ?
              </button>
            </div>
          </div>

          {/* Séparateur */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-[#cec8be]" />
            <span className="text-xs text-gray-400 font-medium">Comptes de démonstration</span>
            <div className="flex-1 border-t border-[#cec8be]" />
          </div>

          {/* Toggle démo */}
          <div className="text-center mb-3">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a2a4a]
                         border-2 border-[#1a2a4a] rounded-xl px-5 py-2.5 hover:bg-[#1a2a4a]
                         hover:text-white transition-colors tracking-wide uppercase"
            >
              {showDemo ? 'Masquer' : 'Accès rapide'}
              <svg className={`w-3.5 h-3.5 transition-transform ${showDemo ? 'rotate-180' : ''}`}
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showDemo && (
            <div className="space-y-2 mt-2">
              {DEMO_ACCOUNTS.map(({ label, email, role }) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => fillDemo(email)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl
                             border-2 border-[#cec8be] bg-white hover:border-blue-400 hover:bg-blue-50
                             text-left transition group shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1a2a4a] group-hover:text-blue-700">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{email}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100
                                   group-hover:bg-blue-100 group-hover:text-blue-700
                                   px-2.5 py-1 rounded-full transition">
                    {role}
                  </span>
                </button>
              ))}
              <p className="text-xs text-gray-400 text-center pt-1">
                Mot de passe : <code className="bg-[#e0d9ce] px-1.5 py-0.5 rounded font-mono">password</code>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
