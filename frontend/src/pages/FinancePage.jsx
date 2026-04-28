import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import api from '../api/client'
import { useSettings } from '../context/SettingsContext'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'

dayjs.locale('fr')

function fmt(n) {
  return n == null ? '—' : Number(n).toLocaleString('fr-FR')
}

const TYPE_RECETTE_LABEL = {
  cotisation_mensuelle:      'Cotisation mensuelle',
  cotisation_exceptionnelle: 'Cotisation exceptionnelle',
  don:                       'Don',
  remboursement_pret:        'Remboursement prêt',
  adhesion:                  'Droit d\'adhésion',
  autre:                     'Autre',
}

/* ═══════════════════════════════════════════════════════════════════════
   Page principale
═══════════════════════════════════════════════════════════════════════ */
export default function FinancePage() {
  const { settings } = useSettings()
  const [annee,      setAnnee]      = useState(new Date().getFullYear())
  const [filtre,     setFiltre]     = useState('')       // '' | 'credit' | 'debit'
  const [solde,      setSolde]      = useState(null)
  const [mouvements, setMouvements] = useState([])
  const [categories, setCategories] = useState([])
  const [members,    setMembers]    = useState([])
  const [events,     setEvents]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null)    // null | 'don' | 'depense'
  const [refreshKey, setRefreshKey] = useState(0)

  const devise = settings?.devise ?? 'FCFA'
  const reload = () => setRefreshKey((k) => k + 1)

  /* load caisse + mouvements */
  useEffect(() => {
    setLoading(true)
    const params = filtre ? { type: filtre } : {}
    Promise.all([
      api.get(`/caisse/${annee}`),
      api.get(`/caisse/${annee}/mouvements`, { params }),
    ])
      .then(([s, m]) => { setSolde(s.data); setMouvements(m.data) })
      .finally(() => setLoading(false))
  }, [annee, filtre, refreshKey])

  /* load ref data once */
  useEffect(() => {
    Promise.all([
      api.get('/categories-depenses'),
      api.get('/members', { params: { statut: 'actif' } }),
      api.get('/events'),
    ]).then(([c, m, e]) => {
      setCategories(c.data)
      setMembers(m.data)
      setEvents(e.data)
    })
  }, [])

  /* stats */
  const totalCredits = mouvements
    .filter((m) => m.type === 'credit')
    .reduce((s, m) => s + Number(m.montant), 0)
  const totalDebits = mouvements
    .filter((m) => m.type === 'debit')
    .reduce((s, m) => s + Number(m.montant), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="page-title">Finances</h2>
        <div className="flex items-center gap-2">
          <select className="input w-24" value={annee} onChange={(e) => setAnnee(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 text-lg">💰</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Solde de caisse</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums">
              {solde ? fmt(solde.solde) : '—'} <span className="text-xs font-normal text-gray-400">{devise}</span>
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
            <span className="text-green-600 text-lg">↑</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Recettes {annee}</p>
            <p className="text-xl font-bold text-green-700 tabular-nums">
              {fmt(totalCredits)} <span className="text-xs font-normal text-gray-400">{devise}</span>
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
            <span className="text-red-500 text-lg">↓</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Dépenses {annee}</p>
            <p className="text-xl font-bold text-red-600 tabular-nums">
              {fmt(totalDebits)} <span className="text-xs font-normal text-gray-400">{devise}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Actions + filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[['','Tous'],['credit','Recettes'],['debit','Dépenses']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFiltre(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filtre === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={() => setModal('don')}>
            + Don
          </button>
          <button className="btn-primary text-sm" onClick={() => setModal('depense')}>
            + Dépense
          </button>
        </div>
      </div>

      {/* Grand livre */}
      {loading ? <Spinner /> : (
        mouvements.length === 0
          ? <div className="card text-center py-12 text-gray-400">Aucun mouvement pour {annee}</div>
          : <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {[
                        { label: 'Date',                    right: false },
                        { label: 'Type',                    right: false },
                        { label: 'Libellé',                 right: false },
                        { label: `Montant (${devise})`,     right: true  },
                        { label: `Solde après (${devise})`, right: true  },
                      ].map(({ label, right }) => (
                        <th key={label} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {mouvements.map((m, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {dayjs(m.created_at).format('D MMM YYYY')}
                        </td>
                        <td className="px-4 py-3">
                          {m.type === 'credit' ? (
                            <span className="badge bg-green-100 text-green-700">
                              {TYPE_RECETTE_LABEL[m.type_recette] ?? m.type_recette ?? 'Recette'}
                            </span>
                          ) : (
                            <span className="badge bg-red-100 text-red-600">
                              {m.categorie_libelle ?? 'Dépense'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={m.libelle}>
                          {m.libelle}
                        </td>
                        <td className={`px-4 py-3 font-semibold tabular-nums whitespace-nowrap text-right ${
                          m.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {m.type === 'credit' ? '+' : '-'}{fmt(m.montant)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-gray-600 whitespace-nowrap text-right">
                          {fmt(m.solde_apres)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
      )}

      {/* Modals */}
      {modal === 'don' && (
        <Modal title="Enregistrer un don" onClose={() => setModal(null)}>
          <DonForm
            members={members} events={events} devise={devise}
            onSave={async (form) => {
              const { data } = await api.post('/dons', form)
              toast.success(`Don enregistré — ${data.reference_recu}`)
              reload()
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal === 'depense' && (
        <Modal title="Enregistrer une dépense" onClose={() => setModal(null)}>
          <DepenseForm
            categories={categories} events={events} devise={devise}
            onSave={async (form) => {
              await api.post('/depenses', form)
              toast.success('Dépense enregistrée')
              reload()
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}

/* ── Don form ───────────────────────────────────────────────────────────── */
function DonForm({ members, events, devise, onSave, onClose }) {
  const [form, setForm] = useState({
    source: 'membre',  // 'membre' | 'externe'
    member_id: '', donateur_nom: '',
    montant: '', date_don: dayjs().format('YYYY-MM-DD'),
    event_id: '', motif: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        member_id:    form.source === 'membre' ? (form.member_id || null) : null,
        donateur_nom: form.source === 'externe' ? (form.donateur_nom || null) : null,
        montant:      parseFloat(form.montant),
        date_don:     form.date_don || null,
        event_id:     form.event_id || null,
        motif:        form.motif    || null,
      })
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Source */}
      <div>
        <label className="label">Donateur</label>
        <div className="flex gap-4 mt-1">
          {[['membre','Membre'],['externe','Externe / anonyme']].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" value={v} checked={form.source === v}
                onChange={() => setForm((f) => ({ ...f, source: v, member_id: '', donateur_nom: '' }))}
                className="accent-blue-600" />
              {l}
            </label>
          ))}
        </div>
      </div>

      {form.source === 'membre' ? (
        <div>
          <label className="label">Membre *</label>
          <select className="input" value={form.member_id} onChange={set('member_id')} required>
            <option value="">Sélectionner un membre…</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.nom_complet}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className="label">Nom du donateur</label>
          <input className="input" value={form.donateur_nom} onChange={set('donateur_nom')}
            placeholder="Nom ou raison sociale" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Montant ({devise}) *</label>
          <input type="number" className="input" value={form.montant} onChange={set('montant')}
            required min="1" step="1" />
        </div>
        <div>
          <label className="label">Date du don</label>
          <input type="date" className="input" value={form.date_don} onChange={set('date_don')} />
        </div>
      </div>

      <div>
        <label className="label">Événement lié (optionnel)</label>
        <select className="input" value={form.event_id} onChange={set('event_id')}>
          <option value="">— Aucun —</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.titre}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Motif / Observation</label>
        <input className="input" value={form.motif} onChange={set('motif')}
          placeholder="ex : Don de bienvenue, collecte anniversaire…" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
      </div>
    </form>
  )
}

/* ── Dépense form ───────────────────────────────────────────────────────── */
function DepenseForm({ categories, events, devise, onSave, onClose }) {
  const [form, setForm] = useState({
    categorie_id: categories[0]?.id ?? '',
    libelle: '', montant: '',
    date_depense: dayjs().format('YYYY-MM-DD'),
    event_id: '', beneficiaire: '', reference_piece: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        categorie_id:    parseInt(form.categorie_id),
        libelle:         form.libelle,
        montant:         parseFloat(form.montant),
        date_depense:    form.date_depense   || null,
        event_id:        form.event_id       || null,
        beneficiaire:    form.beneficiaire   || null,
        reference_piece: form.reference_piece || null,
      })
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Catégorie *</label>
        <select className="input" value={form.categorie_id} onChange={set('categorie_id')} required>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Libellé *</label>
        <input className="input" value={form.libelle} onChange={set('libelle')}
          required placeholder="Description de la dépense" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Montant ({devise}) *</label>
          <input type="number" className="input" value={form.montant} onChange={set('montant')}
            required min="1" step="1" />
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date_depense} onChange={set('date_depense')} />
        </div>
      </div>

      <div>
        <label className="label">Événement lié (optionnel)</label>
        <select className="input" value={form.event_id} onChange={set('event_id')}>
          <option value="">— Aucun —</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.titre}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Bénéficiaire</label>
          <input className="input" value={form.beneficiaire} onChange={set('beneficiaire')}
            placeholder="Nom du bénéficiaire" />
        </div>
        <div>
          <label className="label">Réf. pièce justificative</label>
          <input className="input" value={form.reference_piece} onChange={set('reference_piece')}
            placeholder="N° facture, reçu…" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
      </div>
    </form>
  )
}
