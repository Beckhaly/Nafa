import { useState, useEffect } from 'react'
import api from '../../api/client'
import Spinner from '../../components/Spinner'
import { useSettings } from '../../context/SettingsContext'

const STATUT_COLOR = {
  actif:    { bg: 'bg-green-500',  label: 'ACTIF'    },
  inactif:  { bg: 'bg-gray-400',   label: 'INACTIF'  },
  suspendu: { bg: 'bg-red-500',    label: 'SUSPENDU' },
}

export default function MonProfil() {
  const { settings }          = useSettings()
  const [membre, setMembre]   = useState(null)
  const [showCard, setShowCard] = useState(false)
  const [prets, setPrets]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' })
  const [pwdError, setPwdError] = useState(null)
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/portail/profil'), api.get('/portail/prets')])
      .then(([m, p]) => { setMembre(m.data); setPrets(p.data) })
      .finally(() => setLoading(false))
  }, [])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwdError(null)
    setPwdSuccess(false)
    setPwdLoading(true)

    try {
      await api.post('/auth/change-password', pwdForm)
      setPwdSuccess(true)
      setPwdForm({ current_password: '', new_password: '', new_password_confirmation: '' })
      setTimeout(() => setShowPasswordForm(false), 2000)
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Erreur lors du changement de mot de passe.')
    } finally {
      setPwdLoading(false)
    }
  }

  if (loading) return <Spinner />
  if (!membre) return <p className="text-center text-gray-400 py-10">Profil indisponible.</p>

  const nomComplet  = [membre.nom, membre.prenom, membre.alias ? `(${membre.alias})` : ''].filter(Boolean).join(' ')
  const initials    = `${membre.prenom?.[0] ?? ''}${membre.nom?.[0] ?? ''}`
  const statut      = STATUT_COLOR[membre.statut] ?? STATUT_COLOR.inactif
  const nomAssoc    = settings?.nom_association ?? 'NAFA'
  const slogan      = settings?.slogan ?? ''

  const infoRows = [
    ['Matricule',        membre.matricule],
    ['Rôle',             membre.role_libelle],
    ['Téléphone',        membre.telephone],
    ['Email',            membre.email],
    ['Date d\'adhésion', membre.date_adhesion ? new Date(membre.date_adhesion).toLocaleDateString('fr-FR') : '—'],
    ['Statut',           membre.statut],
  ]

  return (
    <div className="space-y-5">
      <h2 className="page-title">Mon profil</h2>

      {/* Profile card */}
      <div className="card flex items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 uppercase">
            {membre.prenom?.[0]}{membre.nom?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{nomComplet}</h2>
            <p className="text-sm text-gray-500">{membre.role_libelle} · {membre.statut}</p>
            <span className={`mt-1 inline-block badge ${membre.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {membre.statut}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowCard((s) => !s)}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
          </svg>
          {showCard ? 'Masquer la carte' : 'Ma carte'}
        </button>
      </div>

      {/* Carte de membre */}
      {showCard && (
        <div className="flex flex-col items-center gap-3">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #member-card-portail, #member-card-portail * { visibility: visible !important; }
              #member-card-portail {
                position: fixed !important;
                top: 50% !important; left: 50% !important;
                transform: translate(-50%, -50%) !important;
                box-shadow: none !important;
                border-radius: 12px !important;
              }
            }
          `}</style>

          <div
            id="member-card-portail"
            className="w-[420px] rounded-2xl overflow-hidden shadow-xl border border-blue-100"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-5 py-4 flex items-center gap-3">
              <div>
                <p className="text-white font-black text-base tracking-widest uppercase leading-tight">{nomAssoc}</p>
                {slogan && <p className="text-blue-200 text-[10px] italic leading-tight mt-0.5">{slogan}</p>}
              </div>
              <div className="ml-auto text-right">
                <p className="text-blue-200 text-[9px] uppercase tracking-widest leading-tight">Carte de</p>
                <p className="text-white text-xs font-bold uppercase tracking-wide">membre</p>
              </div>
            </div>
            {/* Corps */}
            <div className="bg-white px-5 py-5 flex items-start gap-5">
              <div className="w-20 h-24 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center border-2 border-blue-200 flex-shrink-0">
                <span className="text-2xl font-black text-white">{initials}</span>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Nom complet</p>
                  <p className="text-gray-900 font-bold text-base leading-tight">{nomComplet}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Matricule</p>
                    <p className="text-blue-700 font-bold text-xs font-mono">{membre.matricule}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Rôle</p>
                    <p className="text-gray-700 font-semibold text-xs">{membre.role_libelle}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Adhésion</p>
                    <p className="text-gray-700 font-semibold text-xs">
                      {membre.date_adhesion ? new Date(membre.date_adhesion).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Statut</p>
                    <span className={`inline-flex items-center text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${statut.bg}`}>
                      {statut.label}
                    </span>
                  </div>
                </div>
                {membre.telephone && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Téléphone</p>
                    <p className="text-gray-700 font-semibold text-xs">{membre.telephone}</p>
                  </div>
                )}
              </div>
            </div>
            {/* Pied */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-5 py-2 flex items-center justify-between">
              <div className="flex gap-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`h-1 rounded-full ${i < 3 ? 'w-6 bg-white/60' : 'w-2 bg-white/20'}`} />
                ))}
              </div>
              <p className="text-blue-300 text-[9px] font-mono tracking-widest">{membre.matricule}</p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimer
          </button>
        </div>
      )}

      {/* Info table */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Informations</h3>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showPasswordForm ? 'Annuler' : 'Modifier mot de passe'}
          </button>
        </div>
        <dl className="divide-y divide-gray-100">
          {infoRows.map(([label, value]) => value && (
            <div key={label} className="py-2.5 flex gap-4">
              <dt className="text-sm text-gray-400 w-36 flex-shrink-0">{label}</dt>
              <dd className={`text-sm text-gray-800 font-medium ${label === 'Statut' ? 'capitalize' : ''}`}>{value}</dd>
            </div>
          ))}
        </dl>

        {/* Password change form */}
        {showPasswordForm && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <form onSubmit={handlePasswordChange} className="space-y-3">
              {pwdError && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3.5 py-2.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Mot de passe modifié avec succès
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe actuel</label>
                <input
                  type="password"
                  value={pwdForm.current_password}
                  onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={pwdForm.new_password}
                  onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={pwdForm.new_password_confirmation}
                  onChange={(e) => setPwdForm({ ...pwdForm, new_password_confirmation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 text-sm shadow-sm transition-colors"
              >
                {pwdLoading ? 'Modification en cours…' : 'Modifier le mot de passe'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Loans */}
      {prets.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">Mes prêts</h3>
          <div className="space-y-3">
            {prets.map((p) => {
              const progress = p.montant_principal > 0
                ? Math.round(((p.montant_principal - (p.capital_restant_du ?? p.montant_principal)) / p.montant_principal) * 100)
                : 0
              return (
                <div key={p.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Prêt du {new Date(p.date_debut).toLocaleDateString('fr-FR')}
                    </span>
                    <span className={`badge ${
                      p.statut === 'solde' ? 'bg-green-100 text-green-700'
                      : p.statut === 'en_retard' ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                      {p.statut === 'solde' ? 'Soldé' : p.statut === 'en_retard' ? 'En retard' : 'Actif'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Capital</p>
                      <p className="font-semibold">{Number(p.montant_principal).toLocaleString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Durée</p>
                      <p className="font-semibold">{p.duree_mois} mois</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Taux</p>
                      <p className="font-semibold">{p.taux_interet} %</p>
                    </div>
                  </div>
                  {p.statut !== 'solde' && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Remboursement</span>
                        <span>{progress} %</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${p.statut === 'en_retard' ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
