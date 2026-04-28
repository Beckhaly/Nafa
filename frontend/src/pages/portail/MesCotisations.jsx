import { useState, useEffect } from 'react'
import api from '../../api/client'
import Spinner from '../../components/Spinner'
import { useSettings } from '../../context/SettingsContext'

const MOIS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const MOIS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function cellClass(statut, mois, annee) {
  const now = new Date()
  const isFuture = annee > now.getFullYear() || (annee === now.getFullYear() && mois > now.getMonth() + 1)
  if (!statut && isFuture) return 'bg-gray-100 text-gray-400 border-gray-200'
  if (statut === 'paid')   return 'bg-green-100 text-green-800 border-green-200'
  if (statut === 'partial') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

function StatutBadge({ statut }) {
  const map = {
    paid:    'badge bg-green-100 text-green-700',
    partial: 'badge bg-yellow-100 text-yellow-700',
    unpaid:  'badge bg-red-100 text-red-700',
  }
  const labels = { paid: 'Payé', partial: 'Partiel', unpaid: 'Impayé' }
  return <span className={map[statut] ?? 'badge bg-gray-100 text-gray-500'}>{labels[statut] ?? '—'}</span>
}

export default function MesCotisations() {
  const { settings }    = useSettings()
  const currentYear     = new Date().getFullYear()
  const [tab, setTab]   = useState('mensuel')
  const [annee, setAnnee] = useState(currentYear)
  const [cotisations, setCotisations] = useState([])
  const [cex, setCex]   = useState([])
  const [loading, setLoading] = useState(true)

  const devise = settings?.devise ?? 'FCFA'
  const fmt    = (n) => Number(n ?? 0).toLocaleString('fr-FR') + ' ' + devise

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/portail/cotisations/${annee}`),
      api.get('/portail/cotisations-exceptionnelles'),
    ])
      .then(([m, x]) => { setCotisations(m.data); setCex(x.data) })
      .finally(() => setLoading(false))
  }, [annee])

  const cotMap  = Object.fromEntries(cotisations.map((c) => [c.mois, c]))
  const moisPayes = cotisations.filter((c) => c.statut === 'paid').length
  const totalDu = cotisations.reduce((a, c) => a + Number(c.montant_du ?? 0), 0)
  const totalPaye = cotisations.reduce((a, c) => a + Number(c.montant_paye ?? 0), 0)

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-5">
      <h2 className="page-title">Mes cotisations</h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-x-1">
        {[['mensuel', 'Mensuelles'], ['exceptionnel', 'Exceptionnelles']].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === k ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : tab === 'mensuel' ? (
        <div className="space-y-4">
          {/* Year selector + summary + export */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
              className="input w-32"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <a
              href={`/api/export/cotisations/${annee}/csv`}
              download
              className="text-xs text-blue-600 hover:underline"
            >
              ⬇️ Télécharger CSV
            </a>
            <div className="flex gap-4 text-sm text-gray-600">
              <span className="font-medium">{moisPayes}/12 mois payés</span>
              <span>·</span>
              <span>Versé : <strong className="text-gray-800">{fmt(totalPaye)}</strong></span>
              <span>·</span>
              <span>Restant : <strong className={totalDu - totalPaye > 0 ? 'text-red-600' : 'text-green-600'}>{fmt(totalDu - totalPaye)}</strong></span>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MOIS_FULL.map((nom, i) => {
              const mois = i + 1
              const c    = cotMap[mois]
              return (
                <div key={mois} className={`rounded-xl border p-3 ${cellClass(c?.statut, mois, annee)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide">{MOIS_SHORT[i]}</span>
                    {c ? <StatutBadge statut={c.statut} /> : (
                      <span className="badge bg-gray-100 text-gray-400">—</span>
                    )}
                  </div>
                  {c ? (
                    <>
                      <p className="text-sm font-bold">{fmt(c.montant_paye)}</p>
                      <p className="text-xs opacity-70">/ {fmt(c.montant_du)}</p>
                      {c.date_paiement && (
                        <p className="text-xs mt-1 opacity-60">{new Date(c.date_paiement).toLocaleDateString('fr-FR')}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs opacity-50 mt-1">Non saisi</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : cex.length === 0
        ? (
          <div className="card text-center py-10 text-gray-400">Aucune cotisation exceptionnelle</div>
        )
        : (
          <div className="space-y-4">
            <a href="/api/export/cotisations-exceptionnelles/csv" download className="text-xs text-blue-600 hover:underline inline-block">
              ⬇️ Télécharger CSV
            </a>
            <div className="space-y-3">
              {cex.map((c) => (
                <div key={c.id} className="card">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-medium text-gray-800">{c.libelle}</p>
                      {c.evenement && <p className="text-xs text-gray-400 mt-0.5">Événement : {c.evenement}</p>}
                      {c.date_echeance && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Échéance : {new Date(c.date_echeance).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <StatutBadge statut={c.statut} />
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Montant dû</p>
                      <p className="font-semibold">{fmt(c.montant_du)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Versé</p>
                      <p className="font-semibold text-green-700">{fmt(c.montant_paye)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Restant</p>
                      <p className={`font-semibold ${Number(c.solde_restant) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {fmt(c.solde_restant)}
                      </p>
                    </div>
                  </div>
                  {c.reference_recu && (
                    <p className="text-xs text-gray-400 mt-2">Réf. reçu : {c.reference_recu}</p>
                  )}
                </div>
              ))}
            </div>
            </div>
        )
      }
    </div>
  )
}
