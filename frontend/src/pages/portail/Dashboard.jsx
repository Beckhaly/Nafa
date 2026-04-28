import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import Spinner from '../../components/Spinner'
import { useSettings } from '../../context/SettingsContext'

const MOIS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const MOIS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function MemberDashboard() {
  const { settings }       = useSettings()
  const [data, setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/portail/dashboard')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!data)   return <p className="text-center text-gray-400 py-10">Données indisponibles.</p>

  const {
    membre,
    annee,
    solde_caisse    = 0,
    total_verse     = 0,
    cotisations_retard  = [],
    cex_pending     = 0,
    dernieres_depenses  = [],
    prochains_events    = [],
  } = data ?? {}

  const devise = settings?.devise ?? 'FCFA'
  const fmt    = (n) => Number(n ?? 0).toLocaleString('fr-FR') + ' ' + devise
  const nomComplet = [membre.nom, membre.prenom, membre.alias ? `(${membre.alias})` : ''].filter(Boolean).join(' ')

  return (
    <div className="space-y-5">

      {/* Bannière */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl px-6 py-5 text-white">
        <p className="text-blue-200 text-sm">Bienvenue,</p>
        <h1 className="text-2xl font-bold mt-0.5">{nomComplet}</h1>
        <p className="text-blue-200 text-sm mt-1">{membre.role_libelle} · {membre.matricule}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label="Solde de caisse"
          value={fmt(solde_caisse)}
          sub={`Exercice ${annee}`}
          color="blue"
          icon="💰"
        />
        <KpiCard
          label="Mes cotisations versées"
          value={fmt(total_verse)}
          sub={`${annee}`}
          color="green"
          icon="✅"
        />
        <KpiCard
          label="Mois en retard"
          value={cotisations_retard.length}
          sub={cotisations_retard.length > 0 ? 'à régulariser' : 'Tout est à jour'}
          color={cotisations_retard.length > 0 ? 'red' : 'green'}
          icon={cotisations_retard.length > 0 ? '⚠️' : '✓'}
        />
        <KpiCard
          label="CEX en attente"
          value={cex_pending}
          sub={cex_pending > 0 ? 'cotisation(s) exceptionnelle(s)' : 'Rien en attente'}
          color={cex_pending > 0 ? 'orange' : 'green'}
          icon="📋"
        />
      </div>

      {/* Cotisations en retard */}
      {cotisations_retard.length > 0 && (
        <div className="card border-l-4 border-red-400">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-red-500">⚠</span> Cotisations en retard
            </h2>
            <Link to="/portail/cotisations" className="text-xs text-blue-600 hover:underline">
              Voir détail →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {cotisations_retard.map((c) => (
              <span
                key={c.mois}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  c.statut === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {MOIS_FULL[c.mois - 1]}
                {c.statut === 'partial' && (
                  <span className="opacity-70">· partiel</span>
                )}
              </span>
            ))}
          </div>
          {cotisations_retard.some((c) => c.montant_du > 0) && (
            <p className="text-xs text-gray-500 mt-2">
              Montant restant à verser :{' '}
              <strong className="text-red-600">
                {fmt(cotisations_retard.reduce((a, c) => a + (Number(c.montant_du) - Number(c.montant_paye)), 0))}
              </strong>
            </p>
          )}
        </div>
      )}

      {/* Dernières dépenses */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Dernières dépenses de l'association</h2>
        </div>
        {dernieres_depenses.length === 0
          ? <p className="text-gray-400 text-sm text-center py-3">Aucune dépense enregistrée</p>
          : (
            <ul className="divide-y divide-gray-50">
              {dernieres_depenses.map((d) => (
                <li key={d.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg flex-shrink-0">{d.icone || '📌'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{d.libelle}</p>
                      <p className="text-xs text-gray-400">
                        {d.categorie} · {new Date(d.date_depense).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-red-600 flex-shrink-0">
                    -{fmt(d.montant)}
                  </span>
                </li>
              ))}
            </ul>
          )
        }
      </div>

      {/* Prochains événements */}
      {prochains_events.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Prochains événements</h2>
            <Link to="/portail/evenements" className="text-xs text-blue-600 hover:underline">Tous →</Link>
          </div>
          <ul className="space-y-3">
            {prochains_events.map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex flex-col items-center justify-center flex-shrink-0 font-bold text-xs leading-tight">
                  <span className="text-base">{new Date(e.date_debut).getDate()}</span>
                  <span className="text-[9px] uppercase">{MOIS_SHORT[new Date(e.date_debut).getMonth()]}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{e.titre}</p>
                  <p className="text-xs text-gray-400">{e.type}{e.lieu ? ` · ${e.lieu}` : ''}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub, color, icon }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    green:  'bg-green-50 text-green-700 border-green-100',
    red:    'bg-red-50 text-red-700 border-red-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    gray:   'bg-gray-50 text-gray-600 border-gray-100',
  }
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${colors[color] ?? colors.gray}`}>
      <div className="flex items-start justify-between">
        <p className="text-xl font-bold leading-tight">{value}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-xs font-medium mt-1">{label}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}
