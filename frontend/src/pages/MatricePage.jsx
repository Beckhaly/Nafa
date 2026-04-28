import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api from '../api/client'
import Spinner from '../components/Spinner'
import PaymentModal from '../components/PaymentModal'

const MONTHS     = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const MONTH_KEYS = ['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec_']

const CELL_STYLE = {
  paid:    'bg-green-500 text-white',
  partial: 'bg-yellow-400 text-gray-900',
  unpaid:  'bg-red-500 text-white cursor-pointer hover:bg-red-600',
  future:  'bg-gray-100 text-gray-400',
}
const CELL_LABEL = { paid: '✓', partial: '½', unpaid: '✗', future: '·' }

export default function MatricePage() {
  const [annee,   setAnnee]   = useState(new Date().getFullYear())
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)   // { member, mois, montantDu }
  const [montantDu, setMontantDu] = useState(5000)  // montant par défaut configurable

  useEffect(() => {
    setLoading(true)
    api.get(`/rapports/pivot/${annee}`)
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false))
  }, [annee])

  const handleCellClick = (member, moisIdx, statut) => {
    if (statut !== 'unpaid' && statut !== 'partial') return
    setModal({ member, mois: moisIdx + 1 })
  }

  const handlePaymentSuccess = (result) => {
    toast.success('Paiement enregistré avec succès')
    setRows((prev) =>
      prev.map((r) =>
        r.member_id === modal.member.member_id
          ? { ...r, [MONTH_KEYS[modal.mois - 1]]: result.statut }
          : r
      )
    )
    setModal(null)
  }

  const exportCSV = async () => {
    const res = await api.get(`/rapports/pivot/${annee}`)
    const headers = ['Matricule','Nom complet','Rôle', ...MONTHS].join(',')
    const body = res.data.map((r) =>
      [
        r.matricule,
        `"${r.nom_complet}"`,
        `"${r.role}"`,
        ...MONTH_KEYS.map((k) => r[k] ?? ''),
      ].join(',')
    )
    const blob = new Blob([[headers, ...body].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `cotisations_${annee}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <h2 className="page-title">Matrice de cotisations</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">Cotis. (FCFA)</label>
            <input
              type="number"
              className="input w-28"
              value={montantDu}
              min="1"
              onChange={(e) => setMontantDu(Number(e.target.value))}
            />
          </div>
          <select
            className="input w-24"
            value={annee}
            onChange={(e) => setAnnee(Number(e.target.value))}
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="btn-secondary" onClick={exportCSV}>⬇ CSV</button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
        {[['paid','bg-green-500','Payé'],['partial','bg-yellow-400','Partiel'],
          ['unpaid','bg-red-500','Impayé'],['future','bg-gray-200','À venir']].map(([k,c,l]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`inline-block w-3.5 h-3.5 rounded ${c}`} />
            {l}
          </span>
        ))}
        <span className="text-gray-400 hidden sm:inline">· Clic sur rouge/jaune pour enregistrer un paiement</span>
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">Membre</th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-2 py-3 text-center font-medium text-gray-600 w-12">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-gray-400">
                    Aucun membre actif pour {annee}
                  </td>
                </tr>
              ) : rows.map((member) => (
                <tr key={member.member_id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white px-4 py-2.5">
                    <p className="font-medium text-gray-900">{member.nom_complet}</p>
                    <p className="text-xs text-gray-400">{member.matricule}</p>
                  </td>
                  {MONTH_KEYS.map((key, i) => {
                    const statut = member[key] ?? 'future'
                    return (
                      <td key={key} className="px-1 py-2 text-center">
                        <button
                          onClick={() => handleCellClick(member, i, statut)}
                          title={statut}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition-opacity
                            ${CELL_STYLE[statut] ?? CELL_STYLE.future}
                            ${statut === 'unpaid' || statut === 'partial' ? '' : 'cursor-default'}`}
                        >
                          {CELL_LABEL[statut] ?? '·'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PaymentModal */}
      {modal && (
        <PaymentModal
          member={modal.member}
          annee={annee}
          mois={modal.mois}
          montantDu={montantDu}
          onSuccess={handlePaymentSuccess}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
