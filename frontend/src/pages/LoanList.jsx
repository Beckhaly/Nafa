import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../api/client'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'

const STATUS_BADGE = {
  actif:     'badge bg-green-100 text-green-700',
  en_retard: 'badge bg-red-100 text-red-600',
  solde:     'badge bg-gray-100 text-gray-500',
}

function LoanForm({ members, onSave, onClose }) {
  const [form, setForm] = useState({
    member_id: '', montant: '', taux_interet: 10, duree_mois: 12, date_debut: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const mensualite = (() => {
    const P = parseFloat(form.montant), r = parseFloat(form.taux_interet) / 12 / 100
    const n = parseInt(form.duree_mois)
    if (!P || !n) return null
    if (!r) return (P / n).toFixed(2)
    const f = Math.pow(1 + r, n)
    return (P * r * f / (f - 1)).toFixed(2)
  })()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la création du prêt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Membre *</label>
        <select className="input" value={form.member_id} onChange={set('member_id')} required>
          <option value="">Sélectionner…</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.nom_complet}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Montant (FCFA) *</label>
          <input type="number" className="input" value={form.montant} onChange={set('montant')} required min="1" />
        </div>
        <div>
          <label className="label">Taux annuel (%)</label>
          <input type="number" className="input" value={form.taux_interet} onChange={set('taux_interet')} min="0" max="100" step="0.1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Durée (mois) *</label>
          <input type="number" className="input" value={form.duree_mois} onChange={set('duree_mois')} required min="1" max="120" />
        </div>
        <div>
          <label className="label">Date de début</label>
          <input type="date" className="input" value={form.date_debut} onChange={set('date_debut')} />
        </div>
      </div>

      {mensualite && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm">
          Mensualité estimée : <strong className="text-blue-700">{Number(mensualite).toLocaleString('fr-FR')} FCFA</strong>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Création…' : 'Créer le prêt'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
      </div>
    </form>
  )
}

export default function LoanList() {
  const [loans,   setLoans]   = useState([])
  const [members, setMembers] = useState([])
  const [statut,  setStatut]  = useState('')
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const navigate = useNavigate()

  const filteredLoans = loans.filter((loan) =>
    loan.nom_complet?.toLowerCase().includes(search.toLowerCase()) ||
    loan.matricule?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    setLoading(true)
    const params = statut ? { statut } : {}
    Promise.all([
      api.get('/loans', { params }),
      api.get('/members', { params: { statut: 'actif' } }),
    ]).then(([l, m]) => { setLoans(l.data); setMembers(m.data) })
      .finally(() => setLoading(false))
  }, [statut])

  const handleSave = async (form) => {
    await api.post('/loans', form)
    toast.success('Prêt créé et tableau d\'amortissement généré')
    const r = await api.get('/loans', { params: statut ? { statut } : {} })
    setLoans(r.data)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Prêts</h2>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouveau prêt</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select className="input flex-shrink-0 sm:w-44" value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="en_retard">En retard</option>
          <option value="solde">Soldé</option>
        </select>
        <input
          type="text"
          placeholder="Chercher un membre (nom ou matricule)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1"
        />
      </div>

      {loading ? <Spinner /> : (
        <div className="grid gap-3 sm:gap-4">
          {loans.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">Aucun prêt</div>
          ) : filteredLoans.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">Aucun prêt ne correspond à votre recherche</div>
          ) : filteredLoans.map((loan) => {
            const pct = loan.total_echeances
              ? Math.round((loan.echeances_payees / loan.total_echeances) * 100) : 0
            return (
              <div
                key={loan.loan_id}
                className="card hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/prets/${loan.loan_id}`)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {loan.nom_complet}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{loan.matricule}</p>
                  </div>
                  <span className={STATUS_BADGE[loan.statut] ?? STATUS_BADGE.actif}>
                    {loan.statut.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Montant initial</p>
                    <p className="font-semibold">{Number(loan.montant_initial).toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">FCFA</span></p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Mensualité</p>
                    <p className="font-semibold">{Number(loan.mensualite).toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">FCFA</span></p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Restant dû</p>
                    <p className={`font-semibold ${loan.statut === 'en_retard' ? 'text-red-600' : 'text-gray-900'}`}>
                      {Number(loan.capital_restant_du).toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">FCFA</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>{loan.echeances_payees}/{loan.total_echeances} échéances payées</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${loan.statut === 'en_retard' ? 'bg-red-400' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal title="Nouveau prêt" onClose={() => setModal(false)}>
          <LoanForm members={members} onSave={handleSave} onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  )
}
