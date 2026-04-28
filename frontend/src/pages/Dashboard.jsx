import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import api from '../api/client'
import KpiCard from '../components/KpiCard'
import Spinner from '../components/Spinner'

const MONTHS    = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444']
const POLL_MS   = 30_000

const PIE_LABELS = {
  cotisation_mensuelle:     'Cotisations',
  cotisation_exceptionnelle:'Cotis. except.',
  don:                      'Dons',
  remboursement_pret:       'Remb. prêts',
  autre:                    'Autre',
}

function fmt(n) {
  return n == null ? '—' : Number(n).toLocaleString('fr-FR')
}

function PieLegend({ data }) {
  return (
    <div className="mt-3 space-y-1.5">
      {data.map((entry, i) => (
        <div key={entry.name} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-gray-600 truncate">{PIE_LABELS[entry.name] ?? entry.name}</span>
          </div>
          <span className="font-medium text-gray-700 ml-2 tabular-nums">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [kpi,      setKpi]      = useState(null)
  const [chart,    setChart]    = useState([])
  const [pie,      setPie]      = useState([])
  const [depenses, setDepenses] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    try {
      const year = new Date().getFullYear()
      const [kpiRes, chartRes, mouvRes, depCatRes] = await Promise.all([
        api.get('/dashboard/kpi'),
        api.get('/rapports/recettes-depenses'),
        api.get(`/caisse/${year}/mouvements`, { params: { type: 'credit' } }),
        api.get(`/rapports/depenses-categorie/${year}`),
      ])

      setKpi(kpiRes.data)

      setChart(chartRes.data.map((r) => ({
        mois:     MONTHS[r.mois - 1],
        Recettes: Number(r.recettes),
        Dépenses: Number(r.depenses),
      })))

      const byType = {}
      mouvRes.data.forEach((m) => {
        const k = m.type_recette ?? 'autre'
        byType[k] = (byType[k] ?? 0) + Number(m.montant)
      })
      setPie(Object.entries(byType).map(([name, value]) => ({ name, value })))

      // Dépenses par catégorie
      setDepenses((depCatRes.data || []).map(d => ({
        categorie: d.categorie,
        montant: Number(d.montant)
      })))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de bord</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Solde de caisse"
          value={`${fmt(kpi?.solde_caisse)} FCFA`}
          icon="💰" color="blue"
        />
        <KpiCard
          label="Recouvrement"
          value={`${kpi?.taux_recouvrement_mois ?? 0} %`}
          sub="Mois en cours"
          icon="📈" color="green"
        />
        <KpiCard
          label="Membres"
          value={fmt(kpi?.membres_actifs)}
          sub={`${fmt(kpi?.total_membres)} total`}
          icon="👥" color="purple"
        />
        <KpiCard
          label="Créances"
          value={`${fmt(kpi?.creances_en_souffrance)} FCFA`}
          sub="3 mois glissants"
          icon="⚠️" color="red"
        />
      </div>

      {/* Dépenses par catégorie */}
      <div className="card">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">Répartition dépenses</h3>
        {!depenses || depenses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Aucune dépense</p>
        ) : (
          <div className="space-y-2">
            {depenses.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-gray-600 truncate">{d.categorie}</span>
                </div>
                <span className="font-medium text-gray-700 ml-2 tabular-nums">{fmt(d.montant)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Bar chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">Recettes vs Dépenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                formatter={(v) => [`${v.toLocaleString('fr-FR')} FCFA`]}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Recettes" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="Dépenses" fill="#f87171" radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Répartition recettes</h3>
          {pie.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">Aucune donnée</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pie}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    dataKey="value" nameKey="name"
                    strokeWidth={2}
                  >
                    {pie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${v.toLocaleString('fr-FR')} FCFA`]}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <PieLegend data={pie} />
            </>
          )}
        </div>

      </div>
    </div>
  )
}
