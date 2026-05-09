import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api from '../../api/client'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'

/* ── Config des tables de référence ──────────────────────────────────────── */
const REFS = [
  /* ── Rôles et utilisateurs ──────────────────────────────────────────────── */
  {
    key: 'roles-membres',
    label: 'Rôles membres',
    fields: [
      { name: 'libelle',     label: 'Libellé',     required: true,  type: 'text' },
      { name: 'description', label: 'Description', required: false, type: 'textarea' },
      { name: 'ordre',       label: 'Ordre',       required: false, type: 'number' },
    ],
  },
  {
    key: 'roles-utilisateurs',
    label: 'Rôles utilisateurs',
    fields: [
      { name: 'code',        label: 'Code',        required: true,  type: 'text' },
      { name: 'libelle',     label: 'Libellé',     required: true,  type: 'text' },
      { name: 'description', label: 'Description', required: false, type: 'textarea' },
    ],
  },

  /* ── Catégories & Types ───────────────────────────────────────────────── */
  {
    key: 'categories-depenses',
    label: 'Catégories dépenses',
    fields: [
      { name: 'libelle', label: 'Libellé', required: true,  type: 'text' },
      { name: 'icone',   label: 'Icône',   required: false, type: 'text' },
    ],
  },
  {
    key: 'types-evenement',
    label: "Types d'événement",
    fields: [
      { name: 'libelle', label: 'Libellé', required: true, type: 'text' },
    ],
  },
  {
    key: 'types-annonce',
    label: "Types d'annonce",
    fields: [
      { name: 'libelle', label: 'Libellé', required: true,  type: 'text' },
      { name: 'couleur', label: 'Couleur (hex)', required: false, type: 'color' },
      { name: 'icone',   label: 'Icône',   required: false, type: 'text' },
    ],
  },

  /* ── Statuts & Énumérations ────────────────────────────────────────────── */
  {
    key: 'statuts-membres',
    label: 'Statuts membres',
    fields: [
      { name: 'libelle',     label: 'Libellé',     required: true, type: 'text' },
      { name: 'icone',       label: 'Icône',       required: false, type: 'text' },
      { name: 'couleur',     label: 'Couleur',     required: false, type: 'color' },
      { name: 'description', label: 'Description', required: false, type: 'textarea' },
    ],
  },
  {
    key: 'statuts-contributions',
    label: 'Statuts cotisations',
    fields: [
      { name: 'libelle',     label: 'Libellé',     required: true, type: 'text' },
      { name: 'icone',       label: 'Icône',       required: false, type: 'text' },
      { name: 'couleur',     label: 'Couleur',     required: false, type: 'color' },
      { name: 'description', label: 'Description', required: false, type: 'textarea' },
    ],
  },
  {
    key: 'statuts-cotisations-exceptionnelles',
    label: 'Statuts CEX',
    fields: [
      { name: 'libelle',     label: 'Libellé',     required: true, type: 'text' },
      { name: 'icone',       label: 'Icône',       required: false, type: 'text' },
      { name: 'couleur',     label: 'Couleur',     required: false, type: 'color' },
      { name: 'description', label: 'Description', required: false, type: 'textarea' },
    ],
  },
  {
    key: 'statuts-loans',
    label: 'Statuts prêts',
    fields: [
      { name: 'libelle',     label: 'Libellé',     required: true, type: 'text' },
      { name: 'icone',       label: 'Icône',       required: false, type: 'text' },
      { name: 'couleur',     label: 'Couleur',     required: false, type: 'color' },
      { name: 'description', label: 'Description', required: false, type: 'textarea' },
    ],
  },
  {
    key: 'statuts-events',
    label: 'Statuts événements',
    fields: [
      { name: 'libelle',     label: 'Libellé',     required: true, type: 'text' },
      { name: 'icone',       label: 'Icône',       required: false, type: 'text' },
      { name: 'couleur',     label: 'Couleur',     required: false, type: 'color' },
      { name: 'description', label: 'Description', required: false, type: 'textarea' },
    ],
  },
  {
    key: 'statuts-participants',
    label: 'Statuts participants',
    fields: [
      { name: 'libelle',     label: 'Libellé',     required: true, type: 'text' },
      { name: 'icone',       label: 'Icône',       required: false, type: 'text' },
      { name: 'couleur',     label: 'Couleur',     required: false, type: 'color' },
      { name: 'description', label: 'Description', required: false, type: 'textarea' },
    ],
  },
  {
    key: 'canaux-diffusion',
    label: 'Canaux diffusion',
    fields: [
      { name: 'libelle',       label: 'Libellé',       required: true, type: 'text' },
      { name: 'icone',         label: 'Icône',         required: false, type: 'text' },
      { name: 'couleur',       label: 'Couleur',       required: false, type: 'color' },
      { name: 'api_provider',  label: 'API Provider',  required: false, type: 'text' },
      { name: 'description',   label: 'Description',   required: false, type: 'textarea' },
    ],
  },
  {
    key: 'statuts-diffusions',
    label: 'Statuts diffusions',
    fields: [
      { name: 'libelle',     label: 'Libellé',     required: true, type: 'text' },
      { name: 'icone',       label: 'Icône',       required: false, type: 'text' },
      { name: 'couleur',     label: 'Couleur',     required: false, type: 'color' },
      { name: 'description', label: 'Description', required: false, type: 'textarea' },
    ],
  },
]

/* ═══════════════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════════════ */
export default function ReferenceDataPage() {
  const [tab, setTab] = useState(REFS[0].key)

  const current = REFS.find((r) => r.key === tab)

  return (
    <div className="space-y-5">
      <h2 className="page-title">Données de référence</h2>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 gap-x-1">
        {REFS.map((r) => (
          <button
            key={r.key}
            onClick={() => setTab(r.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === r.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <RefTable config={current} />
    </div>
  )
}

/* ── Table CRUD ─────────────────────────────────────────────────────────── */
function RefTable({ config }) {
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null) // null | 'create' | { mode:'edit', row }
  const [deleting,   setDeleting]   = useState(null)
  const [search,     setSearch]     = useState('')
  const [sortCol,    setSortCol]    = useState(null)
  const [sortDir,    setSortDir]    = useState('asc')
  const [stats,      setStats]      = useState({})

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get(`/admin/reference/${config.key}`),
      api.get(`/admin/reference/${config.key}/stats`)
    ])
      .then(([rowRes, statsRes]) => {
        setRows(rowRes.data)
        setStats(statsRes.data || {})
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [config.key])

  // Filter rows by libelle
  const filteredRows = rows.filter((row) =>
    !search || row.libelle?.toLowerCase().includes(search.toLowerCase())
  )

  // Sort rows
  const sortedRows = sortCol
    ? [...filteredRows].sort((a, b) => {
        const aVal = a[sortCol] ?? ''
        const bVal = b[sortCol] ?? ''
        const cmp = String(aVal).localeCompare(String(bVal))
        return sortDir === 'asc' ? cmp : -cmp
      })
    : filteredRows

  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Supprimer "${row.libelle}" ?`)) return
    setDeleting(row.id)
    try {
      await api.delete(`/admin/reference/${config.key}/${row.id}`)
      toast.success('Supprimé')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la suppression.')
    } finally {
      setDeleting(null)
    }
  }

  /* visible columns = fields of this ref table */
  const cols = config.fields

  return (
    <div className="space-y-4">
      <div className="flex gap-3 justify-between">
        <input
          type="text"
          placeholder="Rechercher par libellé…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 max-w-sm"
        />
        <button className="btn-primary" onClick={() => setModal('create')}>
          + Ajouter
        </button>
      </div>

      {loading ? <Spinner /> : (
        rows.length === 0
          ? <div className="card text-center py-10 text-gray-400">Aucune entrée</div>
          : <>
              <div className="card overflow-hidden p-0">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">#</th>
                      {cols.map((c) => (
                        <th
                          key={c.name}
                          onClick={() => toggleSort(c.name)}
                          className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors ${
                            sortCol === c.name ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {c.label}
                            {sortCol === c.name && (
                              <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisation</th>
                      <th className="px-4 py-3 w-24" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sortedRows.map((row) => {
                      const count = stats[row.id] || 0
                      return (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400 text-xs font-mono">{row.id}</td>
                          {cols.map((c) => (
                            <td key={c.name} className="px-4 py-3 text-gray-700">
                              {c.type === 'color' && row[c.name]
                                ? <span className="flex items-center gap-2">
                                    <span
                                      className="inline-block w-4 h-4 rounded border border-gray-200 flex-shrink-0"
                                      style={{ backgroundColor: row[c.name] }}
                                      title={row[c.name]}
                                    />
                                    <code className="text-xs">{row[c.name]}</code>
                                  </span>
                                : c.name === 'icone' && row[c.name]
                                ? <span className="text-lg">{row[c.name]}</span>
                                : (row[c.name] ?? <span className="text-gray-300">—</span>)
                              }
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            {count > 0
                              ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  {count === 1 ? 'Utilisé 1 fois' : `Utilisé ${count} fois`}
                                </span>
                              : <span className="text-xs text-gray-400">Non utilisé</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => setModal({ mode: 'edit', row })}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDelete(row)}
                                disabled={deleting === row.id || count > 0}
                                title={count > 0 ? 'Impossible de supprimer une valeur utilisée' : ''}
                                className="text-xs text-red-500 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {deleting === row.id ? '…' : 'Supprimer'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500">
                {filteredRows.length === rows.length
                  ? `${rows.length} ${rows.length === 1 ? 'entrée' : 'entrées'}`
                  : `${filteredRows.length} sur ${rows.length} ${rows.length === 1 ? 'entrée' : 'entrées'}`
                }
              </p>
            </>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <Modal
          title={modal === 'create' ? `Ajouter — ${config.label}` : `Modifier — ${config.label}`}
          onClose={() => setModal(null)}
          size="sm"
        >
          <RefForm
            config={config}
            initial={modal?.row ?? {}}
            onSave={async (data) => {
              if (modal === 'create') {
                await api.post(`/admin/reference/${config.key}`, data)
                toast.success('Entrée créée')
              } else {
                await api.put(`/admin/reference/${config.key}/${modal.row.id}`, data)
                toast.success('Entrée mise à jour')
              }
              load()
              setModal(null)
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}

/* ── Generic ref form ───────────────────────────────────────────────────── */
function RefForm({ config, initial, onSave, onClose }) {
  const [form, setForm] = useState(
    Object.fromEntries(config.fields.map((f) => [f.name, initial[f.name] ?? '']))
  )
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
      )
      await onSave(payload)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {config.fields.map((f) => (
        <div key={f.name}>
          <label className="label">{f.label} {f.required && '*'}</label>
          {f.type === 'color' ? (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form[f.name] || '#3b82f6'}
                onChange={set(f.name)}
                className="w-10 h-9 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                className="input flex-1"
                value={form[f.name] ?? ''}
                onChange={set(f.name)}
                placeholder="#3b82f6"
                maxLength={7}
              />
            </div>
          ) : f.type === 'textarea' ? (
            <textarea
              className="input"
              value={form[f.name] ?? ''}
              onChange={set(f.name)}
              required={f.required}
              rows={3}
              placeholder={`Entrez ${f.label.toLowerCase()}`}
            />
          ) : (
            <input
              type={f.type}
              className="input"
              value={form[f.name] ?? ''}
              onChange={set(f.name)}
              required={f.required}
            />
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
      </div>
    </form>
  )
}
