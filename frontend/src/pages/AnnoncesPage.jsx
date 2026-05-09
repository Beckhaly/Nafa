import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import api from '../api/client'
import { useSettings } from '../context/SettingsContext'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'

dayjs.locale('fr')

function shareAnnonceOnWhatsApp(annonce, whatsappGroupUrl) {
  const lines = [
    `════════════════════════════════`,
    `📢 *${annonce.titre}*`,
    `════════════════════════════════`,
    ``,
    `🏷️ *Type :* ${annonce.type}`,
    ``,
  ]

  if (annonce.membre_concerne) {
    lines.push(`👤 *Concernant :* ${annonce.membre_concerne}`)
    lines.push(``)
  }

  lines.push(`📝 *Message :*`)
  lines.push(`${annonce.contenu}`)

  if (annonce.date_evenement) {
    lines.push(``)
    lines.push(`📅 *Date :* ${dayjs(annonce.date_evenement).format('dddd D MMMM YYYY')}`)
  }

  if (annonce.budget_cex) {
    lines.push(``)
    lines.push(`💰 *Budget Cotisation :*`)
    lines.push(`   ${Number(annonce.budget_cex).toLocaleString('fr-FR')} FCFA par membre`)
  }

  lines.push(``)
  lines.push(`════════════════════════════════`)

  const message = lines.join('\n')
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`

  // Copier dans le presse-papiers
  navigator.clipboard.writeText(message)
    .then(() => {
      if (whatsappGroupUrl) {
        // Ouvrir le groupe WhatsApp
        window.open(whatsappGroupUrl, '_blank')
        toast.success('Groupe ouvert. Message copié - collez avec Ctrl+V')
      } else {
        // Ouvrir wa.me avec le message pré-rempli
        window.open(whatsappUrl, '_blank')
        toast.success('WhatsApp ouvert - le message est prêt à envoyer')
      }
    })
    .catch(() => {
      // Fallback: ouvrir juste wa.me
      window.open(whatsappUrl, '_blank')
      toast.info('Message affiché dans WhatsApp - copiez et collez si nécessaire')
    })
}

const STATUT_ANNONCE_DATA = {
  brouillon: { libelle: 'Brouillon', icone: '✏️', couleur: '#9CA3AF' },
  publie:    { libelle: 'Publié', icone: '✅', couleur: '#4CAF50' },
  archive:   { libelle: 'Archivé', icone: '📦', couleur: '#EF4444' },
}

export default function AnnoncesPage() {
  const { settings } = useSettings()
  const [annonces,  setAnnonces]  = useState([])
  const [types,     setTypes]     = useState([])
  const [members,   setMembers]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [diffModal, setDiffModal] = useState(null)
  const [search,    setSearch]    = useState('')
  const whatsappGroupUrl = settings?.whatsapp_groupe || null

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {annonces.length === 0 ? (
            <div className="card col-span-3 text-center py-12 text-gray-400">Aucune annonce</div>
          ) : filteredAnnonces.length === 0 ? (
            <div className="card col-span-3 text-center py-12 text-gray-400">Aucune annonce ne correspond à votre recherche</div>
          ) : filteredAnnonces.map((a) => (
            <div
              key={a.id}
              className="card hover:shadow-md transition-shadow cursor-pointer flex flex-col"
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                    {a.titre}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: a.type_couleur ?? '#999' }}
                    />
                    <p className="text-xs text-gray-400 truncate">{a.type}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge statut={a.statut} statusData={STATUT_ANNONCE_DATA[a.statut]} size="sm" />
                </div>
              </div>

              {a.date_evenement && (
                <p className="text-xs text-gray-500 mb-2">📅 {dayjs(a.date_evenement).format('D MMM YYYY')}</p>
              )}

              {a.membre_concerne && (
                <p className="text-xs text-blue-600 mb-2">👤 {a.membre_concerne}</p>
              )}

              <p className="text-sm text-gray-600 line-clamp-3 flex-grow mb-3">
                {a.contenu}
              </p>

              {a.stats && a.statut !== 'brouillon' && (
                <div className="space-y-1.5 text-xs text-gray-500 mb-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">📱 {a.stats.via_sms ?? 0}</span>
                    <span className="flex items-center gap-1">💬 {a.stats.via_whatsapp ?? 0}</span>
                  </div>
                  {(a.stats.envoyes ?? 0) > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓ {a.stats.envoyes}</span>
                      {(a.stats.echecs ?? 0) > 0 && (
                        <span className="text-red-500">✗ {a.stats.echecs}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {a.statut !== 'archive' && (
                  <button
                    className="btn-primary w-full text-xs py-1"
                    onClick={() => setDiffModal(a)}
                  >
                    {a.statut === 'brouillon' ? 'Publier' : 'Rediffuser'}
                  </button>
                )}
                {!!settings?.enable_whatsapp_share ? (
                  <button
                    className="btn-secondary w-full text-xs py-1"
                    onClick={() => shareAnnonceOnWhatsApp(a, whatsappGroupUrl)}
                    title="Partager sur WhatsApp"
                  >
                    💬 {whatsappGroupUrl ? 'Partager au groupe' : 'Partager'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn-secondary w-full text-xs py-1 opacity-50 cursor-not-allowed"
                    title="Partage désactivé"
                  >
                    💬 Partage désactivé
                  </button>
                )}
              </div>
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
  const { settings } = useSettings()
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

  const canalOptions = [
    {v: 'sms', l: '📱 SMS', enabled: !!settings?.enable_sms},
    {v: 'whatsapp', l: '💬 WhatsApp', enabled: !!settings?.enable_whatsapp},
    {v: 'both', l: '📱💬 Les deux', enabled: (!!settings?.enable_sms && !!settings?.enable_whatsapp)},
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Canal *</label>
        <div className="flex gap-4">
          {canalOptions.map(({v, l, enabled}) => (
            <label key={v} className={`flex items-center gap-2 text-sm ${enabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
              <input
                type="radio"
                value={v}
                checked={canal === v}
                onChange={() => setCanal(v)}
                disabled={!enabled}
                className="accent-blue-600"
              />
              {l} {!enabled && <span className="text-xs text-gray-400">(désactivé)</span>}
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
