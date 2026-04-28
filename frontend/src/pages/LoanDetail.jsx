import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import api from '../api/client'
import Spinner from '../components/Spinner'

dayjs.locale('fr')

const STATUS_CELL = {
  paid:    'badge bg-green-100 text-green-700',
  pending: 'badge bg-gray-100 text-gray-500',
  late:    'badge bg-red-100 text-red-600',
}

const STATUS_LABEL = { paid: 'Payée', pending: 'En attente', late: 'En retard' }

function fmt(n) {
  return Number(n).toLocaleString('fr-FR')
}

export default function LoanDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [loan,     setLoan]     = useState(null)
  const [schedule, setSchedule] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/loans/${id}`),
      api.get(`/loans/${id}/schedule`),
    ]).then(([l, s]) => { setLoan(l.data); setSchedule(s.data) })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner />
  if (!loan)   return <p className="text-red-500">Prêt introuvable.</p>

  const pct = loan.total_echeances
    ? Math.round((loan.echeances_payees / loan.total_echeances) * 100) : 0

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/prets')}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
      >
        ← Retour aux prêts
      </button>

      {/* Summary */}
      <div className="card">
        <div className="flex flex-wrap justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{loan.nom_complet}</h2>
            <p className="text-sm text-gray-400 font-mono">{loan.matricule}</p>
          </div>
          <span className={`badge text-sm px-3 py-1 ${
            loan.statut === 'actif'     ? 'bg-green-100 text-green-700' :
            loan.statut === 'en_retard' ? 'bg-red-100 text-red-600'    :
            'bg-gray-100 text-gray-500'
          }`}>
            {loan.statut.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            ['Montant initial',  `${fmt(loan.montant_initial)} FCFA`],
            ['Taux annuel',      `${loan.taux_interet} %`],
            ['Mensualité',       `${fmt(loan.mensualite)} FCFA`],
            ['Capital restant',  `${fmt(loan.capital_restant_du)} FCFA`],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>{loan.echeances_payees}/{loan.total_echeances} échéances payées</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${loan.statut === 'en_retard' ? 'bg-red-400' : 'bg-blue-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Amortization table */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Tableau d'amortissement</h3>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['N°','Échéance','Mensualité','Capital','Intérêts','Restant','Statut'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedule.map((row) => (
                <tr key={row.id} className={row.statut === 'late' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-3 py-2.5 font-medium text-gray-700">{row.numero_echeance}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                    {dayjs(row.date_echeance).format('D MMM YYYY')}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{fmt(row.montant_echeance)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{fmt(row.capital)}</td>
                  <td className="px-3 py-2.5 tabular-nums text-gray-500">{fmt(row.interets)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{fmt(row.capital_restant)}</td>
                  <td className="px-3 py-2.5">
                    <span className={STATUS_CELL[row.statut]}>
                      {STATUS_LABEL[row.statut] ?? row.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
