import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import api from '../../api/client'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'

export default function UsersPage() {
  const [users,      setUsers]      = useState([])
  const [roles,      setRoles]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null)  // null | 'create' | { mode:'edit', user } | { mode:'delete', user }
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deleting,   setDeleting]   = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([api.get('/admin/users'), api.get('/admin/roles-utilisateurs')])
      .then(([u, r]) => { setUsers(u.data); setRoles(r.data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                       u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role_id === parseInt(roleFilter)
    return matchSearch && matchRole
  })

  const handleDelete = async (user) => {
    setModal({ mode: 'delete', user })
  }

  const confirmDelete = async (user) => {
    setDeleting(user.id)
    try {
      await api.delete(`/admin/users/${user.id}`)
      toast.success('Utilisateur supprimé')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la suppression.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Utilisateurs</h2>
        <button className="btn-primary" onClick={() => setModal('create')}>
          + Nouvel utilisateur
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-44" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Tous les rôles</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Nom','Email','Rôle','Statut','Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Aucun utilisateur</td></tr>
                ) : filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-blue-50 text-blue-700 border border-blue-100">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active
                        ? <span className="badge bg-green-50 text-green-700 border border-green-100">Actif</span>
                        : <span className="badge bg-gray-100 text-gray-600 border border-gray-200">Inactif</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal({ mode: 'edit', user: u })}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Modifier
                        </button>
                        {u.id !== 1 && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="card text-center py-10 text-gray-400">Aucun utilisateur</div>
            ) : filteredUsers.map((u) => (
              <div key={u.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="badge bg-blue-50 text-blue-700 border border-blue-100 text-xs">{u.role}</span>
                      {u.is_active
                        ? <span className="badge bg-green-50 text-green-700 border border-green-100 text-xs">Actif</span>
                        : <span className="badge bg-gray-100 text-gray-600 border border-gray-200 text-xs">Inactif</span>
                      }
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => setModal({ mode: 'edit', user: u })}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      Modifier
                    </button>
                    {u.id !== 1 && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length > 0 && (
            <p className="text-xs text-gray-400 text-center">{filteredUsers.length} sur {users.length} utilisateur(s)</p>
          )}
        </>
      )}

      {modal && modal.mode === 'delete' && (
        <Modal title="Supprimer l'utilisateur" onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{modal.user.name}</strong> ?
            </p>
            <p className="text-xs text-gray-400">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => confirmDelete(modal.user)}
                disabled={deleting}
                className="btn-danger flex-1"
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="btn-secondary flex-1"
                disabled={deleting}
              >
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal && (modal === 'create' || modal.mode === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'}
          onClose={() => setModal(null)}
          size="sm"
        >
          <UserForm
            initial={modal?.user ?? {}}
            roles={roles}
            isEdit={modal?.mode === 'edit'}
            onSave={async (data) => {
              if (modal === 'create') {
                await api.post('/admin/users', data)
                toast.success('Utilisateur créé')
              } else {
                await api.put(`/admin/users/${modal.user.id}`, data)
                toast.success('Utilisateur mis à jour')
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

function UserForm({ initial, roles, isEdit, onSave, onClose }) {
  const [form, setForm] = useState({
    name:      initial.name      ?? '',
    email:     initial.email     ?? '',
    role_id:   initial.role_id   ?? roles[0]?.id ?? '',
    is_active: initial.is_active ?? 1,
    password:  '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        name:      form.name,
        email:     form.email,
        role_id:   parseInt(form.role_id),
        is_active: parseInt(form.is_active),
        ...(form.password ? { password: form.password } : {}),
      })
    } catch (err) {
      const errors = err.response?.data?.errors
      toast.error(errors
        ? Object.values(errors).flat().join(' · ')
        : err.response?.data?.message ?? 'Erreur.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">Nom complet *</label>
        <input
          className="input"
          value={form.name}
          onChange={set('name')}
          placeholder="ex: Jean Dupont"
          required
        />
      </div>

      <div>
        <label className="label">Email *</label>
        <input
          type="email"
          className="input"
          value={form.email}
          onChange={set('email')}
          placeholder="jean.dupont@example.com"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Rôle *</label>
          <select className="input" value={form.role_id} onChange={set('role_id')} required>
            <option value="">Sélectionner…</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Statut</label>
          <select className="input" value={form.is_active} onChange={set('is_active')}>
            <option value={1}>Actif</option>
            <option value={0}>Inactif</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">
          {isEdit ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}
        </label>
        <input
          type="password"
          className="input"
          value={form.password}
          onChange={set('password')}
          required={!isEdit}
          minLength={8}
          placeholder={isEdit ? 'Laisser vide pour ne pas changer' : 'Min. 8 caractères'}
        />
        {!isEdit && (
          <p className="text-xs text-gray-400 mt-1">Au moins 8 caractères</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>
          Annuler
        </button>
      </div>
    </form>
  )
}
