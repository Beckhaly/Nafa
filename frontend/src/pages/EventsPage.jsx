import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import api from '../api/client'
import { useSettings } from '../context/SettingsContext'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useStatusLabels } from '../hooks/useStatusLabels'

dayjs.locale('fr')

const STATUT_PARTICIPANT = {
  present: 'badge bg-green-100 text-green-700',
  absent:  'badge bg-red-100 text-red-600',
  inscrit: 'badge bg-gray-100 text-gray-500',
}

function shareEventOnWhatsApp(event, whatsappGroupUrl) {
  const lines = [
    `════════════════════════════════`,
    `📅 *${event.titre}*`,
    `════════════════════════════════`,
    ``,
    `🏷️ *Type :* ${event.type}`,
    ``,
  ]

  lines.push(`📍 *Dates :*`)
  lines.push(`   🔹 Début : ${dayjs(event.date_debut).format('dddd D MMMM YYYY')}`)

  if (event.date_fin && event.date_fin !== event.date_debut) {
    lines.push(`   🔹 Fin : ${dayjs(event.date_fin).format('dddd D MMMM YYYY')}`)
  }

  if (event.lieu) {
    lines.push(``)
    lines.push(`📌 *Lieu :*`)
    lines.push(`   ${event.lieu}`)
  }

  if (event.description) {
    lines.push(``)
    lines.push(`📝 *Description :*`)
    lines.push(`   ${event.description}`)
  }

  if (event.budget_cex) {
    lines.push(``)
    lines.push(`💰 *Budget Cotisation :*`)
    lines.push(`   ${Number(event.budget_cex).toLocaleString('fr-FR')} FCFA par membre`)
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

export default function EventsPage() {
  const { settings } = useSettings()
  const [events,  setEvents]  = useState([])
  const [types,   setTypes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [detail,  setDetail]  = useState(null)
  const [search,  setSearch]  = useState('')
  const statusLabels = useStatusLabels()
  const eventStatusMap = statusLabels['statuts-events'] || {}
  const getStatusData = (key) => eventStatusMap[key?.toLowerCase()] || null
  const whatsappGroupUrl = settings?.whatsapp_groupe || null

  const filteredEvents = events.filter((ev) =>
    ev.titre?.toLowerCase().includes(search.toLowerCase()) ||
    ev.type?.toLowerCase().includes(search.toLowerCase()) ||
    ev.lieu?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    Promise.all([api.get('/events'), api.get('/types-evenement')])
      .then(([e, t]) => { setEvents(e.data); setTypes(t.data) })
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (form) => {
    await api.post('/events', form)
    toast.success('Événement créé')
    const r = await api.get('/events')
    setEvents(r.data)
  }

  const openDetail = async (id) => {
    const r = await api.get(`/events/${id}`)
    setDetail(r.data)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Événements</h2>
        <button className="btn-primary" onClick={() => setModal({ mode: 'create' })}>+ Nouvel événement</button>
      </div>

      <input
        type="text"
        placeholder="Chercher par titre, type ou lieu…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input w-full"
      />

      {loading ? <Spinner /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {events.length === 0 ? (
            <div className="card col-span-3 text-center py-12 text-gray-400">Aucun événement</div>
          ) : filteredEvents.length === 0 ? (
            <div className="card col-span-3 text-center py-12 text-gray-400">Aucun événement ne correspond à votre recherche</div>
          ) : filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="card hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => openDetail(ev.id)}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                    {ev.titre}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">{ev.type}</p>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge statut={ev.statut} statusData={getStatusData(ev.statut)} size="sm" />
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500 space-y-1">
                <p className="flex items-center gap-1.5">
                  <span>📅</span>
                  <span>{dayjs(ev.date_debut).format('D MMM YYYY')}{ev.date_fin ? ` → ${dayjs(ev.date_fin).format('D MMM YYYY')}` : ''}</span>
                </p>
                {ev.lieu && (
                  <p className="flex items-center gap-1.5">
                    <span>📍</span>
                    <span className="truncate">{ev.lieu}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {modal?.mode === 'create' && (
        <Modal title="Nouvel événement" onClose={() => setModal(null)}>
          <EventForm types={types} onSave={handleCreate} onClose={() => setModal(null)} />
        </Modal>
      )}

      {/* Detail modal */}
      {detail && (
        <Modal title={detail.titre} onClose={() => setDetail(null)} size="lg">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Type</p>
                <p className="font-medium">{detail.type}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Statut</p>
                <StatusBadge statut={detail.statut} statusData={eventStatusMap[detail.statut]} size="sm" />
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Début</p>
                <p className="font-medium">{dayjs(detail.date_debut).format('D MMM YYYY')}</p>
              </div>
              {detail.date_fin && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Fin</p>
                  <p className="font-medium">{dayjs(detail.date_fin).format('D MMM YYYY')}</p>
                </div>
              )}
              {detail.lieu && (
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Lieu</p>
                  <p className="font-medium">{detail.lieu}</p>
                </div>
              )}
              {detail.budget_cex && (
                <div className="bg-blue-50 rounded-lg p-3 col-span-2 border border-blue-100">
                  <p className="text-xs text-blue-600 mb-0.5">Budget cotisation exceptionnelle</p>
                  <p className="font-semibold text-blue-900">{Number(detail.budget_cex).toLocaleString('fr-FR')} FCFA par membre</p>
                </div>
              )}
            </div>

            {detail.description && (
              <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{detail.description}</p>
            )}

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                Participants
                <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {detail.participants?.length ?? 0}
                </span>
              </h4>
              {detail.participants?.length > 0 ? (
                <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                  {detail.participants.map((p) => (
                    <li key={p.member_id} className="py-2.5 px-3 flex justify-between items-center hover:bg-gray-50">
                      <span className="text-sm font-medium text-gray-800">{p.nom_complet}</span>
                      <span className={STATUT_PARTICIPANT[p.statut] ?? 'badge bg-gray-100 text-gray-500'}>
                        {p.statut}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">Aucun participant enregistré</p>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {!!settings?.enable_whatsapp_share ? (
                <button
                  onClick={() => shareEventOnWhatsApp(detail, whatsappGroupUrl)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  {whatsappGroupUrl ? '💬 Partager au groupe' : '💬 Partager sur WhatsApp'}
                </button>
              ) : (
                <button
                  disabled
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm opacity-50 cursor-not-allowed"
                >
                  💬 Partage désactivé
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function EventForm({ types, onSave, onClose }) {
  const [form, setForm] = useState({
    type_id: types[0]?.id ?? '', titre: '', description: '',
    date_debut: '', date_fin: '', lieu: '', statut: 'planifie', budget_cex: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        ...form,
        date_fin: form.date_fin || null,
        budget_cex: form.budget_cex ? Number(form.budget_cex) : null,
      })
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Type *</label>
        <select className="input" value={form.type_id} onChange={set('type_id')} required>
          {types.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Titre *</label>
        <input className="input" value={form.titre} onChange={set('titre')} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date début *</label>
          <input type="datetime-local" className="input" value={form.date_debut} onChange={set('date_debut')} required />
        </div>
        <div>
          <label className="label">Date fin</label>
          <input type="datetime-local" className="input" value={form.date_fin} onChange={set('date_fin')} />
        </div>
      </div>
      <div>
        <label className="label">Lieu</label>
        <input className="input" value={form.lieu} onChange={set('lieu')} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={3} value={form.description} onChange={set('description')} />
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
        <p className="text-xs text-gray-400 mt-1">Montant par défaut pour les cotisations exceptionnelles liées à cet événement</p>
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
