import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import api from '../api/client'
import Spinner from '../components/Spinner'

const STATUT_COLOR = {
  actif:    { bg: 'bg-green-500',  label: 'ACTIF'    },
  inactif:  { bg: 'bg-gray-400',   label: 'INACTIF'  },
  suspendu: { bg: 'bg-red-500',    label: 'SUSPENDU' },
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default function MemberCardPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { settings } = useSettings()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    api.get(`/members/${id}/card`)
      .then(r => setMember(r.data))
      .catch(() => setError('Membre introuvable.'))
      .finally(() => setLoading(false))
  }, [id])

  const nomAssociation = settings?.nom_association ?? 'NAFA'
  const slogan         = settings?.slogan          ?? 'Bénéfice Commun, Gestion Solidaire'
  const statut         = STATUT_COLOR[member?.statut] ?? STATUT_COLOR.inactif
  const initials       = member ? `${member.nom[0]}${member.prenom[0]}` : ''

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (error)   return <div className="text-center py-20 text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #member-card, #member-card * { visibility: visible !important; }
          #member-card {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            box-shadow: none !important;
            border-radius: 12px !important;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/membres')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux membres
        </button>
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

      {/* Carte — format ID card paysage */}
      <div className="flex justify-center print:block">
        <div
          id="member-card"
          className="w-[420px] rounded-2xl overflow-hidden shadow-2xl border border-blue-100 print:shadow-none print:border print:rounded-none"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >

          {/* En-tête bleu */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-5 py-4 flex items-center gap-3">
            <div>
              <p className="text-white font-black text-base tracking-widest uppercase leading-tight">
                {nomAssociation}
              </p>
              <p className="text-blue-200 text-[10px] italic leading-tight mt-0.5">{slogan}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-blue-200 text-[9px] uppercase tracking-widest leading-tight">Carte de</p>
              <p className="text-white text-xs font-bold uppercase tracking-wide">membre</p>
            </div>
          </div>

          {/* Corps */}
          <div className="bg-white px-5 py-5 flex items-start gap-5">

            {/* Photo / Avatar */}
            <div className="flex-shrink-0">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.nom_complet}
                  className="w-20 h-24 object-cover rounded-xl border-2 border-blue-200"
                />
              ) : (
                <div className="w-20 h-24 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800
                                flex items-center justify-center border-2 border-blue-200 shadow-inner">
                  <span className="text-2xl font-black text-white">{initials}</span>
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Nom complet</p>
                <p className="text-gray-900 font-bold text-base leading-tight">{member.nom_complet}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Matricule</p>
                  <p className="text-blue-700 font-bold text-xs font-mono">{member.matricule}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Rôle</p>
                  <p className="text-gray-700 font-semibold text-xs">{member.role}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Adhésion</p>
                  <p className="text-gray-700 font-semibold text-xs">{formatDate(member.date_adhesion)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Statut</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${statut.bg}`}>
                    {statut.label}
                  </span>
                </div>
              </div>

              {member.telephone && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Téléphone</p>
                  <p className="text-gray-700 font-semibold text-xs">{member.telephone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pied bleu foncé avec bande décorative */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-5 py-2 flex items-center justify-between">
            <div className="flex gap-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`h-1 rounded-full ${i < 3 ? 'w-6 bg-white/60' : 'w-2 bg-white/20'}`} />
              ))}
            </div>
            <p className="text-blue-300 text-[9px] font-mono tracking-widest">{member.matricule}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
