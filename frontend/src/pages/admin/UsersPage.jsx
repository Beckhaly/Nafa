import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api from '../../api/client'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'

export default function UsersPage() {
  const [users,   setUsers]   = useState([])
  const [roles,   setRoles]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)  // null | 'create' | { mode:'edit', user }
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/admin/users'), api.get('/admin/roles-utilisateurs')])
      .then(([u, r]) => { setUsers(u.data); setRoles(r.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (user) => {
    if (!window.confirm(`Supprimer l'utilisateur "${user.name}" ?`)) return
    setDeleting(user.id)
    try {
      await api.delete(`/admin/users/${user.id}`)
      toast.success('Utilisateur supprimé')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la suppression.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="page-title">Utilisateurs</h2>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setModal('create')}>
          + Nouvel utilisateur
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nom','Email','Rôle','Statut','Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-blue-50 text-blue-700">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active
                      ? <span className="badge bg-green-100 text-green-700">Actif</span>
                      : <span className="badge bg-gray-100 text-gray-500">Inactif</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setModal({ mode: 'edit', user: u })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Modifier
                      </button>
                      {u.id !== 1 && (
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deleting === u.id}
                          className="text-xs text-red-500 hover:underline disabled:opacity-40"
                        >
                          {deleting === u.id ? '…' : 'Supprimer'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nom complet *</label>
        <input className="input" value={form.name} onChange={set('name')} required />
      </div>
      <div>
        <label className="label">Email *</label>
        <input type="email" className="input" value={form.email} onChange={set('email')} required />
      </div>
      <div>
        <label className="label">Rôle *</label>
        <select className="input" value={form.role_id} onChange={set('role_id')} required>
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
      <div>
        <label className="label">
          {isEdit ? 'Nouveau mot de passe (laisser vide = inchangé)' : 'Mot de passe *'}
        </label>
        <input
          type="password" className="input"
          value={form.password} onChange={set('password')}
          required={!isEdit} minLength={8}
          placeholder={isEdit ? '••••••••' : ''}
        />
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
