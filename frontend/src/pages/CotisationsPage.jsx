import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import api from '../api/client'
import { useSettings } from '../context/SettingsContext'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PaymentModal from '../components/PaymentModal'
import SearchSelect from '../components/SearchSelect'
import RecapTab from './RecapCotisationsPage'

dayjs.locale('fr')

/* ── shared constants ──────────────────────────────────────────────────── */
const MONTHS     = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const MONTH_KEYS = ['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec_']

const STATUT_BADGE = {
  paid:    'badge bg-green-100 text-green-700',
  partial: 'badge bg-yellow-100 text-yellow-700',
  unpaid:  'badge bg-red-100 text-red-600',
}
const STATUT_LABEL = { paid: 'Payé', partial: 'Partiel', unpaid: 'Impayé' }

function fmt(n) {
  return n == null ? '—' : Number(n).toLocaleString('fr-FR')
}

/* ── page root ─────────────────────────────────────────────────────────── */
export default function CotisationsPage() {
  const [tab, setTab] = useState('mensuel')

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h2 className="page-title">Cotisations</h2>
        <div className="flex border-b border-gray-200 self-end">
          {[['mensuel','Mensuel'],['exceptionnel','Exceptionnel'],['recap','Récap']].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === k
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {tab === 'mensuel'      && <MensuelTab />}
      {tab === 'exceptionnel' && <ExceptionnelTab />}
      {tab === 'recap'        && <RecapTab />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 1 — Mensuel : matrice de pointage
═══════════════════════════════════════════════════════════════════════ */
const CELL_STYLE = {
  paid:    'bg-green-500 text-white',
  partial: 'bg-yellow-400 text-gray-900',
  unpaid:  'bg-red-500 text-white hover:bg-red-600',
  future:  'bg-gray-100 text-gray-400',
}
const CELL_LABEL = { paid: '✓', partial: '½', unpaid: '✗', future: '·' }

function MensuelTab() {
  const { settings } = useSettings()
  const [annee,     setAnnee]     = useState(new Date().getFullYear())
  const [rows,      setRows]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [search,    setSearch]    = useState('')

  const montantRef = Number(settings?.montant_cotisation_mensuelle ?? 5000)
  const devise = settings?.devise ?? 'FCFA'

  const filteredRows = rows.filter((r) =>
    r.nom_complet?.toLowerCase().includes(search.toLowerCase()) ||
    r.matricule?.toLowerCase().includes(search.toLowerCase())
  )

  // Sync default year from settings once loaded
  useEffect(() => {
    if (settings?.exercice_courant) setAnnee(Number(settings.exercice_courant))
  }, [settings?.exercice_courant])

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
    toast.success(`Paiement enregistré — ${result.reference_recu}`)
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
    const headers = ['Matricule', 'Nom complet', 'Rôle', ...MONTHS].join(',')
    const body = res.data.map((r) =>
      [r.matricule, `"${r.nom_complet}"`, `"${r.role}"`,
       ...MONTH_KEYS.map((k) => r[k] ?? '')].join(',')
    )
    const blob = new Blob([[headers, ...body].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `cotisations_${annee}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const computeStats = () => {
    let totalTheorique = 0, totalPaye = 0, nbMembers = 0, totalPayments = 0
    rows.forEach((member) => {
      nbMembers++
      MONTH_KEYS.forEach((key) => {
        const statut = member[key]
        if (statut && statut !== 'future') {
          totalTheorique += montantRef
          if (statut === 'paid' || statut === 'partial') totalPaye += montantRef
          if (statut === 'paid') totalPayments++
        }
      })
    })
    const tauxRecouv = totalTheorique > 0 ? Math.round((totalPaye / totalTheorique) * 100) : 0
    return { totalTheorique, totalPaye, nbMembers, tauxRecouv, totalPayments }
  }

  const stats = computeStats()

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Cotisation mensuelle :</span>
            <span className="text-sm font-semibold text-gray-800 tabular-nums">
              {montantRef.toLocaleString('fr-FR')} {devise}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select className="input w-24" value={annee} onChange={(e) => setAnnee(Number(e.target.value))}>
              {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn-secondary" onClick={exportCSV}>⬇ CSV</button>
          </div>
        </div>
        <input
          type="text"
          placeholder="Chercher un membre (nom ou matricule)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full"
        />
      </div>

      {/* Year recap statistics */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-600 mb-1">Membres actifs</p>
            <p className="text-lg font-bold text-blue-900">{stats.nbMembers}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-green-600 mb-1">Recouvrement</p>
            <p className="text-lg font-bold text-green-900">{stats.tauxRecouv}%</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-purple-600 mb-1">Total théorique</p>
            <p className="text-sm font-bold text-purple-900 tabular-nums">{Number(stats.totalTheorique).toLocaleString('fr-FR')}</p>
            <p className="text-xs text-purple-500">{devise}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-600 mb-1">Total payé</p>
            <p className="text-sm font-bold text-amber-900 tabular-nums">{Number(stats.totalPaye).toLocaleString('fr-FR')}</p>
            <p className="text-xs text-amber-500">{devise}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Reste dû</p>
            <p className="text-sm font-bold text-gray-900 tabular-nums">{Number(stats.totalTheorique - stats.totalPaye).toLocaleString('fr-FR')}</p>
            <p className="text-xs text-gray-500">{devise}</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
        {[['paid','bg-green-500','Payé'],['partial','bg-yellow-400','Partiel'],
          ['unpaid','bg-red-500','Impayé'],['future','bg-gray-200','À venir']].map(([k,c,l]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`inline-block w-3.5 h-3.5 rounded ${c}`} />
            {l}
          </span>
        ))}
        <span className="text-gray-400 hidden sm:inline">· Clic rouge/jaune pour enregistrer un paiement</span>
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Membre
                </th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">
                    {m}
                  </th>
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
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-gray-400">
                    Aucun membre ne correspond à votre recherche
                  </td>
                </tr>
              ) : filteredRows.map((member) => (
                <tr key={member.member_id} className="hover:bg-gray-50 group">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-4 py-2.5 transition-colors">
                    <p className="font-medium text-gray-900 whitespace-nowrap">{member.nom_complet}</p>
                    <p className="text-xs text-gray-400 font-mono">{member.matricule}</p>
                  </td>
                  {MONTH_KEYS.map((key, i) => {
                    const statut = member[key] ?? 'future'
                    const clickable = statut === 'unpaid' || statut === 'partial'
                    return (
                      <td key={key} className="px-1 py-2 text-center">
                        <button
                          onClick={() => handleCellClick(member, i, statut)}
                          title={STATUT_LABEL[statut] ?? statut}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition-opacity
                            ${CELL_STYLE[statut] ?? CELL_STYLE.future}
                            ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
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

      {modal && (
        <PaymentModal
          member={modal.member}
          annee={annee}
          mois={modal.mois}
          montantDu={montantRef}
          onSuccess={handlePaymentSuccess}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 2 — Exceptionnel : appels de fonds groupés par événements
═══════════════════════════════════════════════════════════════════════ */
function ExceptionnelTab() {
  const [items,      setItems]      = useState([])
  const [members,    setMembers]    = useState([])
  const [events,     setEvents]     = useState([])
  const [annonces,   setAnnonces]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [statut,     setStatut]     = useState('')
  const [search,     setSearch]     = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [modal,      setModal]      = useState(null) // null | 'create' | { mode:'detail', eventId, sourceType:'event'|'annonce' } | { mode:'pay', item }
  const [detail,     setDetail]     = useState(null) // { eventId/annonceId, cotisations, sourceType }

  const reload = () => setRefreshKey((k) => k + 1)

  /* load ref data once */
  useEffect(() => {
    Promise.all([
      api.get('/members', { params: { statut: 'actif' } }),
      api.get('/events'),
      api.get('/annonces'),
    ]).then(([m, e, a]) => { setMembers(m.data); setEvents(e.data); setAnnonces(a.data) })
  }, [])

  /* load items when statut filter or refreshKey changes */
  useEffect(() => {
    setLoading(true)
    const params = statut ? { statut } : {}
    api.get('/cotisations-exceptionnelles', { params })
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false))
  }, [statut, refreshKey])

  /* group by event or annonce */
  const groupedBySources = items.reduce((acc, item) => {
    const key = item.event_id ? `event_${item.event_id}` : item.annonce_id ? `annonce_${item.annonce_id}` : 'other'
    if (!acc[key]) acc[key] = { key, cotisations: [], source: null }
    acc[key].cotisations.push(item)
    if (item.event_id && !acc[key].source) {
      acc[key].source = { type: 'event', id: item.event_id, titre: events.find((e) => e.id === item.event_id)?.titre }
    }
    if (item.annonce_id && !acc[key].source) {
      acc[key].source = { type: 'annonce', id: item.annonce_id, titre: annonces.find((a) => a.id === item.annonce_id)?.titre }
    }
    return acc
  }, {})

  const filteredSources = Object.entries(groupedBySources)
    .map(([_, group]) => group)
    .filter((group) =>
      group.cotisations.some((c) =>
        c.libelle?.toLowerCase().includes(search.toLowerCase()) ||
        (c.nom_complet?.toLowerCase().includes(search.toLowerCase()))
      )
    )
    .sort((a, b) => (b.cotisations[0]?.date_echeance || '') > (a.cotisations[0]?.date_echeance || '') ? -1 : 1)

  /* stats */
  const stats = items.reduce(
    (acc, x) => ({
      total: acc.total + 1,
      du:    acc.du    + Number(x.montant_du),
      paye:  acc.paye  + Number(x.montant_paye),
    }),
    { total: 0, du: 0, paye: 0 }
  )
  const taux = stats.du > 0 ? Math.round((stats.paye / stats.du) * 100) : 0

  const openSourceDetail = (source) => {
    if (!source) {
      // Sans source - récupère les cotisations sans event_id et sans annonce_id
      const cotisations = items.filter((c) => !c.event_id && !c.annonce_id)
      setDetail({ cotisations, source: null })
    } else if (source.type === 'event') {
      const cotisations = items.filter((c) => c.event_id === source.id)
      setDetail({ eventId: source.id, cotisations, sourceType: 'event' })
    } else if (source.type === 'annonce') {
      const cotisations = items.filter((c) => c.annonce_id === source.id)
      setDetail({ annonceId: source.id, cotisations, sourceType: 'annonce' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-600 mb-1">Appels de fonds</p>
            <p className="text-lg font-bold text-blue-900">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-green-600 mb-1">Recouvrement</p>
            <p className="text-lg font-bold text-green-900">{taux}%</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-purple-600 mb-1">Total dû</p>
            <p className="text-sm font-bold text-purple-900 tabular-nums">{fmt(stats.du)}</p>
            <p className="text-xs text-purple-500">FCFA</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-600 mb-1">Total payé</p>
            <p className="text-sm font-bold text-amber-900 tabular-nums">{fmt(stats.paye)}</p>
            <p className="text-xs text-amber-500">FCFA</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
            <p className="text-xs text-red-600 mb-1">Reste dû</p>
            <p className="text-sm font-bold text-red-900 tabular-nums">{fmt(stats.du - stats.paye)}</p>
            <p className="text-xs text-red-500">FCFA</p>
          </div>
        </div>
      )}

      {/* Filter + search + action */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <select className="input w-44" value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="paid">Payé</option>
            <option value="partial">Partiel</option>
            <option value="unpaid">Impayé</option>
          </select>
          <button className="btn-primary" onClick={() => setModal('create')}>
            + Nouvelle cotisation exceptionnelle
          </button>
        </div>
        <input
          type="text"
          placeholder="Chercher par membre ou libellé…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full"
        />
      </div>

      {loading ? <Spinner /> : (
        items.length === 0
          ? <div className="card text-center py-12 text-gray-400">Aucun appel de fonds</div>
          : filteredSources.length === 0
          ? <div className="card text-center py-12 text-gray-400">Aucun appel de fonds ne correspond à votre recherche</div>
          : <div className="space-y-3">
              {filteredSources.map((group) => {
                const cotisations = group.cotisations
                const pct = cotisations.length > 0
                  ? Math.round((cotisations.filter((c) => c.statut === 'paid').length / cotisations.length) * 100)
                  : 0
                const totalDu = cotisations.reduce((s, c) => s + Number(c.montant_du), 0)
                const totalPaye = cotisations.reduce((s, c) => s + Number(c.montant_paye), 0)
                const title = !group.source
                  ? 'Sans événement ni annonce'
                  : group.source.titre

                return (
                  <div
                    key={group.key}
                    className="card hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openSourceDetail(group.source)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{title}</p>
                        {group.source && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {group.source.type === 'event' ? '📅 Événement' : '📣 Annonce'}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {cotisations.length} cotisation(s) · {cotisations.filter((c) => c.statut === 'paid').length} payée(s)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Total dû</p>
                        <p className="font-semibold tabular-nums">{fmt(totalDu)} <span className="text-xs font-normal text-gray-400">FCFA</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Payé</p>
                        <p className={`font-semibold tabular-nums ${totalPaye > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {fmt(totalPaye)} <span className="text-xs font-normal text-gray-400">FCFA</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Reste</p>
                        <p className={`font-semibold tabular-nums ${totalDu - totalPaye > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {fmt(totalDu - totalPaye)} <span className="text-xs font-normal text-gray-400">FCFA</span>
                        </p>
                      </div>
                    </div>

                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">{pct}% complété</p>
                  </div>
                )
              })}
            </div>
      )}

      {/* Create modal */}
      {modal === 'create' && (
        <Modal title="Nouvelle cotisation exceptionnelle" onClose={() => setModal(null)}>
          <CreateCexForm
            members={members}
            events={events}
            annonces={annonces}
            onSave={async (form) => {
              const { data } = await api.post('/cotisations-exceptionnelles', form)
              toast.success(`${data.nb_crees} cotisation(s) exceptionnelle(s) créée(s)`)
              reload()
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Pay modal */}
      {modal?.mode === 'pay' && (
        <Modal title="Enregistrer un paiement" onClose={() => setModal(null)} size="sm">
          <PayCexForm
            item={modal.item}
            onSave={async (montant) => {
              const { data } = await api.post(
                `/cotisations-exceptionnelles/${modal.item.id}/pay`,
                { montant }
              )
              toast.success(`Paiement enregistré — ${data.reference_recu}`)
              reload()
              setModal(null)
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Event detail modal */}
      {detail && (
        <Modal title={detail.cotisations[0]?.libelle || 'Détail appel de fonds'} onClose={() => setDetail(null)} size="lg">
          <EventCexDetail cotisations={detail.cotisations} onPay={(item) => { setDetail(null); setModal({ mode: 'pay', item }) }} onClose={() => setDetail(null)} reload={reload} />
        </Modal>
      )}
    </div>
  )
}

/* ── Exceptional cotisation card ────────────────────────────────────────── */
function CexCard({ item, onPay }) {
  const pct = item.montant_du > 0
    ? Math.round((item.montant_paye / item.montant_du) * 100)
    : 0

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{item.libelle}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {item.nom_complet}
            {item.evenement && (
              <span className="ml-2 text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">
                {item.evenement}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-400">
            {item.date_echeance && (
              <span>Échéance : {dayjs(item.date_echeance).format('D MMM YYYY')}</span>
            )}
            {item.date_paiement && (
              <span className="text-green-600">Payé le {dayjs(item.date_paiement).format('D MMM YYYY')}</span>
            )}
            {item.reference_recu && (
              <span className="font-mono">{item.reference_recu}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={STATUT_BADGE[item.statut] ?? 'badge bg-gray-100 text-gray-500'}>
            {STATUT_LABEL[item.statut] ?? item.statut}
          </span>
          {item.statut !== 'paid' && (
            <button className="btn-primary text-xs py-1 px-3" onClick={onPay}>
              Payer
            </button>
          )}
        </div>
      </div>

      {/* Amounts */}
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">Montant dû</p>
          <p className="font-semibold tabular-nums">
            {fmt(item.montant_du)} <span className="text-xs font-normal text-gray-400">FCFA</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Payé</p>
          <p className={`font-semibold tabular-nums ${item.statut === 'paid' ? 'text-green-600' : 'text-gray-900'}`}>
            {fmt(item.montant_paye)} <span className="text-xs font-normal text-gray-400">FCFA</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Reste</p>
          <p className={`font-semibold tabular-nums ${Number(item.solde_restant) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {fmt(item.solde_restant)} <span className="text-xs font-normal text-gray-400">FCFA</span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {item.statut !== 'paid' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{pct}% payé</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                item.statut === 'partial' ? 'bg-yellow-400' : 'bg-gray-200'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Create exceptional cotisation form ─────────────────────────────────── */
function CreateCexForm({ members, events, annonces, onSave, onClose }) {
  const { settings } = useSettings()
  const montantRef = Number(settings?.montant_cotisation_mensuelle ?? 5000)
  const devise     = settings?.devise ?? 'FCFA'

  const [form, setForm] = useState({
    libelle: '', date_echeance: '',
    source_type: 'event', event_id: '', annonce_id: '', destinataire: 'all', member_id: '',
  })
  const [montant, setMontant] = useState(montantRef)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => {
    const value = e.target.value
    setForm((f) => {
      const updated = { ...f, [k]: value }
      return updated
    })

    // Auto-fill montant from event budget if event is selected
    if (k === 'event_id' && value) {
      const selectedEvent = events.find((ev) => ev.id === Number(value))
      if (selectedEvent?.budget_cex) {
        setMontant(Number(selectedEvent.budget_cex))
      } else {
        setMontant(montantRef)
      }
    }

    // Auto-fill montant from annonce budget if annonce is selected
    if (k === 'annonce_id' && value) {
      const selectedAnnonce = annonces.find((a) => a.id === Number(value))
      if (selectedAnnonce?.budget_cex) {
        setMontant(Number(selectedAnnonce.budget_cex))
      } else {
        setMontant(montantRef)
      }
    }
  }

  const handleSourceTypeChange = (newType) => {
    setForm((f) => ({
      ...f,
      source_type: newType,
      event_id: '',
      annonce_id: '',
    }))
    setMontant(montantRef)
  }

  const handleMontantChange = (e) => setMontant(Number(e.target.value) || montantRef)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        libelle:       form.libelle,
        montant_du:    montant,
        date_echeance: form.date_echeance || null,
        event_id:      form.source_type === 'event' ? (form.event_id || null) : null,
        annonce_id:    form.source_type === 'annonce' ? (form.annonce_id || null) : null,
        member_id:     form.destinataire === 'select' ? (form.member_id || null) : null,
      })
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
        <label className="label">Libellé *</label>
        <input
          className="input" value={form.libelle} onChange={set('libelle')} required
          placeholder="ex : Cotisation fête de fin d'année 2026"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Montant dû (FCFA)</label>
          <input
            type="number"
            className="input"
            value={montant}
            onChange={handleMontantChange}
            min="0"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            {form.event_id && events.find((ev) => ev.id === Number(form.event_id))?.budget_cex
              ? `Budget de l'événement appliqué`
              : `Défaut: ${montantRef.toLocaleString('fr-FR')} ${devise}`
            }
          </p>
        </div>
        <div>
          <label className="label">Date d'échéance</label>
          <input type="date" className="input" value={form.date_echeance} onChange={set('date_echeance')} />
        </div>
      </div>

      <div>
        <label className="label">Source *</label>
        <div className="flex gap-4 mt-1">
          {[['event','Événement'],['annonce','Annonce']].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio" value={v} checked={form.source_type === v}
                onChange={() => handleSourceTypeChange(v)}
                className="accent-blue-600"
              />
              {l}
            </label>
          ))}
        </div>
      </div>

      {form.source_type === 'event' && (
        <div>
          <label className="label">Événement lié *</label>
          <SearchSelect
            options={events}
            value={form.event_id}
            onChange={set('event_id')}
            placeholder="Chercher un événement…"
            displayKey="titre"
            valueKey="id"
            required
          />
        </div>
      )}

      {form.source_type === 'annonce' && (
        <div>
          <label className="label">Annonce liée *</label>
          <SearchSelect
            options={annonces}
            value={form.annonce_id}
            onChange={set('annonce_id')}
            placeholder="Chercher une annonce…"
            displayKey="titre"
            valueKey="id"
            required
          />
        </div>
      )}

      <div>
        <label className="label">Destinataires *</label>
        <div className="flex gap-4 mt-1">
          {[['all','Tous les membres actifs'],['select','Membre spécifique']].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio" value={v} checked={form.destinataire === v}
                onChange={() => setForm((f) => ({ ...f, destinataire: v, member_id: '' }))}
                className="accent-blue-600"
              />
              {l}
            </label>
          ))}
        </div>
      </div>

      {form.destinataire === 'select' && (
        <div>
          <label className="label">Membre *</label>
          <SearchSelect
            options={members}
            value={form.member_id}
            onChange={set('member_id')}
            placeholder="Chercher un membre…"
            displayKey="nom_complet"
            valueKey="id"
            required={form.destinataire === 'select'}
          />
        </div>
      )}

      {form.destinataire === 'all' && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
          Un appel de fonds sera créé pour chaque membre actif.
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Création…' : 'Créer'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
      </div>
    </form>
  )
}

/* ── Pay exceptional cotisation form ────────────────────────────────────── */
function PayCexForm({ item, onSave, onClose }) {
  const solde = Number(item.solde_restant)
  const [montant, setMontant] = useState(solde)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSave(parseFloat(montant))
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erreur lors du paiement.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm">
        <p className="font-semibold text-blue-800">{item.nom_complet}</p>
        <p className="text-blue-600 mt-0.5">{item.libelle}</p>
        <div className="flex flex-wrap gap-4 mt-2 text-xs">
          <span>Dû : <strong className="tabular-nums">{fmt(item.montant_du)} FCFA</strong></span>
          <span>Payé : <strong className="tabular-nums">{fmt(item.montant_paye)} FCFA</strong></span>
          <span className="text-red-600">Reste : <strong className="tabular-nums">{fmt(item.solde_restant)} FCFA</strong></span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Montant versé (FCFA)</label>
          <input
            type="number" className="input"
            min="1" step="1"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            required autoFocus
          />
          <p className="text-xs text-gray-400 mt-1">
            Le membre peut verser un montant libre — supérieur ou inférieur au solde restant.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Valider'}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
        </div>
      </form>
    </div>
  )
}

/* ── Event exceptional cotisation detail ───────────────────────────────── */
function EventCexDetail({ cotisations, onPay, onClose, reload }) {
  const [payingMember, setPayingMember] = useState(null)
  const [search, setSearch] = useState('')

  const paid = cotisations.filter((c) => c.statut === 'paid')
  const unpaid = cotisations.filter((c) => c.statut !== 'paid')
  const filteredUnpaid = unpaid.filter((c) =>
    c.nom_complet?.toLowerCase().includes(search.toLowerCase())
  )
  const totalDu = cotisations.reduce((s, c) => s + Number(c.montant_du), 0)
  const totalPaye = cotisations.reduce((s, c) => s + Number(c.montant_paye), 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 rounded-lg p-3">
        <div>
          <p className="text-xs text-gray-400">Total dû</p>
          <p className="font-semibold tabular-nums">{fmt(totalDu)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Collecté</p>
          <p className={`font-semibold tabular-nums ${totalPaye > 0 ? 'text-green-600' : ''}`}>{fmt(totalPaye)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Restant</p>
          <p className={`font-semibold tabular-nums ${totalDu - totalPaye > 0 ? 'text-red-600' : ''}`}>{fmt(totalDu - totalPaye)}</p>
        </div>
      </div>

      {/* Paid members */}
      {paid.length > 0 && (
        <div>
          <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Payés ({paid.length})
          </h4>
          <div className="space-y-2">
            {paid.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 p-2.5 bg-green-50 rounded-lg text-sm">
                <span className="font-medium text-gray-800">{item.nom_complet}</span>
                <span className="text-xs text-green-600">
                  {fmt(item.montant_paye)} <span className="text-gray-400">le {dayjs(item.date_paiement).format('D MMM')}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unpaid members */}
      {unpaid.length > 0 && (
        <div>
          <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            En attente ({unpaid.length})
          </h4>
          <input
            type="text"
            placeholder="Chercher un membre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full mb-3"
          />
          {filteredUnpaid.length === 0 && search ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun membre ne correspond</p>
          ) : (
            <div className="space-y-2">
              {filteredUnpaid.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 p-2.5 bg-red-50 rounded-lg text-sm group hover:bg-red-100 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{item.nom_complet}</p>
                  <p className="text-xs text-gray-500">
                    {item.statut === 'partial'
                      ? `Partiel : ${fmt(item.montant_paye)} / ${fmt(item.montant_du)}`
                      : `À payer : ${fmt(item.montant_du)}`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setPayingMember(item)}
                  className="btn-primary text-xs py-1 px-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Payer
                </button>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {/* Payment modal for member */}
      {payingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full max-w-sm rounded-t-xl shadow-lg">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Enregistrer un paiement</h3>
              <button onClick={() => setPayingMember(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4">
              <PayCexForm
                item={payingMember}
                onSave={async (montant) => {
                  await api.post(`/cotisations-exceptionnelles/${payingMember.id}/pay`, { montant })
                  toast.success('Paiement enregistré')
                  setPayingMember(null)
                  reload()
                }}
                onClose={() => setPayingMember(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
