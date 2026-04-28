import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import api from '../api/client'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'

dayjs.locale('fr')

const STATUT_BADGE = {
  brouillon: 'badge bg-gray-100 text-gray-600',
  publie:    'badge bg-green-100 text-green-700',
  archive:   'badge bg-red-100 text-red-500',
}

export default function AnnoncesPage() {
  const [annonces,  setAnnonces]  = useState([])
  const [types,     setTypes]     = useState([])
  const [members,   setMembers]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [diffModal, setDiffModal] = useState(null)
  const [search,    setSearch]    = useState('')

  const filteredAnnonces = annonces.filter((a) =>
    a.titre?.toLowerCase().includes(search.toLowerCase()) ||
    a.type?.toLowerCase().includes(search.toLowerCase()) ||
    a.contenu?.toLowerCase().includes(search.toLowerCase()) ||
    a.membre_concerne?.toLowerCase().includes(search.toLowerCase())
  )

  const load = () => {
    setLoading(true)
    api.get('/annonces').then((r) => setAnnonces(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    Promise.all([api.get('/types-annonce'), api.get('/members', { params: { statut: 'actif' } })])
      .then(([t, m]) => { setTypes(t.data); setMembers(m.data) })
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Annonces</h2>
        <button className="btn-primary" onClick={() => setModal('create')}>+ Nouvelle annonce</button>
      </div>

      <input
        type="text"
        placeholder="Chercher par titre, type ou contenu…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input w-full"
      />

      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {annonces.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">Aucune annonce</div>
          ) : filteredAnnonces.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">Aucune annonce ne correspond à votre recherche</div>
          ) : filteredAnnonces.map((a) => (
            <div key={a.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: a.type_couleur ?? '#999' }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{a.titre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.type}
                      {a.date_evenement && (
                        <> · <span className="text-gray-500">{dayjs(a.date_evenement).format('D MMM YYYY')}</span></>
                      )}
                    </p>
                    {a.membre_concerne && (
                      <p className="text-xs text-blue-600 mt-0.5">Concernant : {a.membre_concerne}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={STATUT_BADGE[a.statut]}>{a.statut}</span>
                  {a.statut !== 'archive' && (
                    <button
                      className="btn-primary text-xs py-1 px-3"
                      onClick={() => setDiffModal(a)}
                    >
                      {a.statut === 'brouillon' ? 'Publier' : 'Rediffuser'}
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 font-mono leading-relaxed">
                {a.contenu}
              </p>

              {a.stats && a.statut !== 'brouillon' && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">📱 SMS : {a.stats.via_sms ?? 0}</span>
                  <span className="flex items-center gap-1">💬 WhatsApp : {a.stats.via_whatsapp ?? 0}</span>
                  <span className="flex items-center gap-1 text-green-600">✓ {a.stats.envoyes ?? 0} envoyés</span>
                  {(a.stats.echecs ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-red-500">✗ {a.stats.echecs} échecs</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal === 'create' && (
        <Modal title="Nouvelle annonce" onClose={() => setModal(null)}>
          <AnnonceForm
            types={types}
            members={members}
            onSave={async (form) => {
              await api.post('/annonces', form)
              toast.success('Annonce créée')
              load()
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {diffModal && (
        <Modal title={`Diffuser : ${diffModal.titre}`} onClose={() => setDiffModal(null)} size="sm">
          <PublishForm
            annonceId={diffModal.id}
            members={members}
            onSuccess={() => {
              toast.success('Diffusion lancée avec succès')
              load()
              setDiffModal(null)
            }}
            onClose={() => setDiffModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}

function AnnonceForm({ types, members, onSave, onClose }) {
  const [form, setForm] = useState({
    type_id: types[0]?.id ?? '', titre: '', contenu: '',
    member_id: '', date_evenement: '', budget_cex: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const charCount = form.contenu.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({ ...form, member_id: form.member_id || null, date_evenement: form.date_evenement || null, budget_cex: form.budget_cex || null })
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la création.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Type d'annonce *</label>
        <select className="input" value={form.type_id} onChange={set('type_id')} required>
          {types.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Membre concerné</label>
        <select className="input" value={form.member_id} onChange={set('member_id')}>
          <option value="">— Aucun (externe) —</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.nom_complet}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Titre *</label>
        <input className="input" value={form.titre} onChange={set('titre')} required />
      </div>
      <div>
        <label className="label flex items-center justify-between">
          <span>Message SMS / WhatsApp *</span>
          <span className={`text-xs font-normal tabular-nums ${charCount > 160 ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
            {charCount}/160
          </span>
        </label>
        <textarea
          className="input"
          rows={4}
          value={form.contenu}
          onChange={set('contenu')}
          required
          maxLength={1600}
          placeholder="Texte envoyé tel quel aux membres…"
        />
        {charCount > 160 && (
          <p className="text-xs text-orange-500 mt-1">
            Au-delà de 160 caractères, le SMS sera découpé en {Math.ceil(charCount / 153)} messages.
          </p>
        )}
      </div>
      <div>
        <label className="label">Date de l'événement</label>
        <input type="date" className="input" value={form.date_evenement} onChange={set('date_evenement')} />
      </div>
      <div>
        <label className="label">Budget cotisation exceptionnelle (optionnel)</label>
        <input
          type="number"
          className="input"
          value={form.budget_cex}
          onChange={set('budget_cex')}
          placeholder="Montant dû par membre (FCFA)"
          min="0"
        />
        <p className="text-xs text-gray-400 mt-1">Montant par défaut pour les cotisations exceptionnelles liées à cette annonce</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Création…' : 'Créer'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
      </div>
    </form>
  )
}

function PublishForm({ annonceId, members, onSuccess, onClose }) {
  const [canal,    setCanal]    = useState('both')
  const [cibles,   setCibles]   = useState('all')
  const [selected, setSelected] = useState([])
  const [loading,  setLoading]  = useState(false)

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/annonces/${annonceId}/publier`, {
        canal,
        member_ids: cibles === 'select' ? selected : undefined,
      })
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la diffusion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Canal *</label>
        <div className="flex gap-4">
          {[['sms','📱 SMS'],['whatsapp','💬 WhatsApp'],['both','📱💬 Les deux']].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" value={v} checked={canal === v} onChange={() => setCanal(v)} className="accent-blue-600" />
              {l}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Destinataires</label>
        <div className="flex gap-4">
          {[['all','Tous les membres actifs'],['select','Sélection manuelle']].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" value={v} checked={cibles === v} onChange={() => setCibles(v)} className="accent-blue-600" />
              {l}
            </label>
          ))}
        </div>
      </div>

      {cibles === 'select' && (
        <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg divide-y text-sm">
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
                onChange={() => toggle(m.id)}
                className="accent-blue-600"
              />
              <span>{m.nom_complet}</span>
            </label>
          ))}
        </div>
      )}

      {cibles === 'select' && selected.length > 0 && (
        <p className="text-xs text-blue-600">{selected.length} membre(s) sélectionné(s)</p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Diffusion…' : '📤 Envoyer'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
      </div>
    </form>
  )
}
