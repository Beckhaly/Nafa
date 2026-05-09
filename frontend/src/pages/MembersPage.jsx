import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../api/client'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useStatusLabels } from '../hooks/useStatusLabels'

const MEMBER_ROLE_TO_USER_ROLES = {
  1: [1, 2, 3, 4, 5],     // Président → admin, tresorier, secretaire, lecteur, membre
  2: [1, 2, 3, 4, 5],     // Vice-Président → admin, tresorier, secretaire, lecteur, membre
  3: [2, 3, 4, 5],        // Trésorier → tresorier, secretaire, lecteur, membre
  4: [3, 4, 5],           // Secrétaire → secretaire, lecteur, membre
  5: [4, 5],              // Membre → lecteur, membre
  6: [4, 5],              // Auditeur → lecteur, membre
}

function MemberForm({ initial = {}, roles, onSave, onClose }) {
  const [form, setForm] = useState({
    nom: '', prenom: '', alias: '', telephone: '', telephone2: '', email: '',
    date_adhesion: '', role_id: roles[4]?.id ?? '', statut: 'actif',
    lieu_habitation: '', emploi: '', commentaires: '', ...initial,
  })
  const [createUser, setCreateUser] = useState(false)
  const [userPassword, setUserPassword] = useState('')
  const [userRole, setUserRole] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const availableUserRoles = useMemo(() => {
    const allowedIds = MEMBER_ROLE_TO_USER_ROLES[form.role_id] || []
    return [
      { id: 1, libelle: 'Administrateur' },
      { id: 2, libelle: 'Trésorier' },
      { id: 3, libelle: 'Secrétaire' },
      { id: 4, libelle: 'Lecteur' },
      { id: 5, libelle: 'Membre' },
    ].filter(r => allowedIds.includes(r.id))
  }, [form.role_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Validation pour création d'utilisateur
      if (createUser) {
        if (!userPassword || userPassword.length < 8) {
          toast.error('Le mot de passe doit contenir au moins 8 caractères')
          setLoading(false)
          return
        }
        if (!userRole) {
          toast.error('Sélectionner un rôle pour l\'utilisateur')
          setLoading(false)
          return
        }
      }

      // Appeler onSave qui gère la sauvegarde du membre
      await onSave({
        ...form,
        createUser: createUser ? {
          password: userPassword,
          role_id: parseInt(userRole),
        } : null,
      })
      onClose()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' · ')
        : err.response?.data?.message ?? 'Erreur.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Identité */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Nom *</label>
          <input className="input" value={form.nom} onChange={set('nom')} required />
        </div>
        <div>
          <label className="label">Prénom *</label>
          <input className="input" value={form.prenom} onChange={set('prenom')} required />
        </div>
        <div>
          <label className="label">Alias / Surnom</label>
          <input className="input" placeholder="ex : Petit Jean" value={form.alias ?? ''} onChange={set('alias')} />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Téléphone *</label>
          <input className="input" value={form.telephone} onChange={set('telephone')} required />
        </div>
        <div>
          <label className="label">Téléphone 2 <span className="text-gray-400 font-normal text-xs">(opt.)</span></label>
          <input className="input" value={form.telephone2 ?? ''} onChange={set('telephone2')} />
        </div>
        <div>
          <label className="label">Email <span className="text-gray-400 font-normal text-xs">(opt.)</span></label>
          <input type="email" className="input" value={form.email ?? ''} onChange={set('email')} />
        </div>
      </div>

      {/* Profil */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Lieu d'habitation</label>
          <input className="input" value={form.lieu_habitation ?? ''} onChange={set('lieu_habitation')} />
        </div>
        <div>
          <label className="label">Emploi / Profession</label>
          <input className="input" value={form.emploi ?? ''} onChange={set('emploi')} />
        </div>
      </div>

      {/* Admin */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Date d'adhésion</label>
          <input type="date" className="input" value={form.date_adhesion ?? ''} onChange={set('date_adhesion')} />
        </div>
        <div>
          <label className="label">Rôle</label>
          <select className="input" value={form.role_id} onChange={set('role_id')}>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Statut</label>
          <select className="input" value={form.statut} onChange={set('statut')}>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
      </div>

      {/* Commentaires */}
      <div>
        <label className="label">Commentaires</label>
        <textarea className="input" rows={2} value={form.commentaires ?? ''} onChange={set('commentaires')} placeholder="Informations complémentaires…" />
      </div>

      {/* Créer un compte utilisateur */}
      <div className="border-t border-gray-200 pt-3 mt-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={createUser}
            onChange={(e) => setCreateUser(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">
            {initial.id ? 'Créer un compte utilisateur' : 'Créer un compte utilisateur pour accéder à l\'application'}
          </span>
        </label>
      </div>

      {createUser && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-3">
          <div>
            <label className="label">Mot de passe *</label>
            <input
              type="password"
              className="input"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Min. 8 caractères"
              minLength={8}
              required={createUser}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
          </div>

          <div>
            <label className="label">Rôle utilisateur *</label>
            <select
              className="input"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              required={createUser}
            >
              <option value="">Sélectionner un rôle…</option>
              {availableUserRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.libelle}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Rôles disponibles selon le poste du membre</p>
          </div>

          <p className="text-xs text-gray-500 bg-white p-2 rounded border border-gray-200">
            📱 Login pour connexion: <strong>{form.telephone}</strong>
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Sauvegarder'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
      </div>
    </form>
  )
}

/* ── Card view for mobile ───────────────────────────────────── */
function MemberCard({ m, onEdit, statusLabels }) {
  const navigate = useNavigate()
  const statutMap = statusLabels['statuts-membres'] || {}
  const getStatusData = (key) => statutMap[key?.toLowerCase()] || null
  return (
    <div className="card flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {m.nom[0]}{m.prenom[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{m.nom_complet}</p>
          <p className="text-xs font-mono text-blue-600">{m.matricule}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
            <span>{m.telephone}</span>
            {m.email && <span className="truncate">{m.email}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusBadge statut={m.statut} statusData={getStatusData(m.statut)} size="sm" />
            <span className="text-xs text-gray-400">{m.role}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(m)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
        >
          Modifier
        </button>
        <button
          onClick={() => navigate(`/membres/${m.id}/carte`)}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
        >
          Carte
        </button>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const navigate = useNavigate()
  const statusLabels = useStatusLabels()
  const [members, setMembers] = useState([])
  const [roles,   setRoles]   = useState([])
  const [search,  setSearch]  = useState('')
  const [statut,  setStatut]  = useState('')
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const statutMap = statusLabels['statuts-membres'] || {}
  const getStatusData = (key) => statutMap[key?.toLowerCase()] || null

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (statut) params.statut = statut
    api.get('/members', { params })
      .then((r) => setMembers(r.data))
      .finally(() => setLoading(false))
  }, [search, statut])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.get('/roles-membres').then((r) => setRoles(r.data)) }, [])

  const handleSave = async (formData) => {
    const { createUser, ...form } = formData

    if (modal.mode === 'create') {
      // Créer le membre
      const memberRes = await api.post('/members', form)
      const memberId = memberRes.data.id

      // Créer l'utilisateur si demandé
      if (createUser) {
        try {
          await api.post('/admin/users', {
            name: `${form.prenom} ${form.nom}`,
            email: form.telephone,
            password: createUser.password,
            role_id: createUser.role_id,
            is_active: 1,
          })
          toast.success('Membre et utilisateur créés avec succès')
        } catch (err) {
          // Le membre a été créé mais pas l'utilisateur
          toast.warning('Membre créé mais la création de l\'utilisateur a échoué')
          console.error('Erreur création utilisateur:', err)
        }
      } else {
        toast.success('Membre créé avec succès')
      }
    } else {
      await api.put(`/members/${modal.data.id}`, form)
      toast.success('Membre mis à jour')
    }
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Membres</h2>
        <button className="btn-primary" onClick={() => setModal({ mode: 'create' })}>
          + Nouveau membre
        </button>
      </div>

      {/* Filters */}
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
        <select className="input w-40" value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="suspendu">Suspendu</option>
        </select>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Matricule','Nom complet','Téléphone','Email','Rôle','Statut',''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {members.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">Aucun membre</td></tr>
                ) : members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">{m.matricule}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.nom_complet}</td>
                    <td className="px-4 py-3 text-gray-600">{m.telephone}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{m.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{m.role}</td>
                    <td className="px-4 py-3">
                      <StatusBadge statut={m.statut} statusData={getStatusData(m.statut)} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal({ mode: 'edit', data: m })}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => navigate(`/membres/${m.id}/carte`)}
                          className="text-gray-400 hover:text-gray-700 text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                          title="Voir la carte"
                        >
                          🪪
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {members.length === 0 ? (
              <div className="card text-center py-10 text-gray-400">Aucun membre</div>
            ) : members.map((m) => (
              <MemberCard key={m.id} m={m} onEdit={(data) => setModal({ mode: 'edit', data })} statusLabels={statusLabels} />
            ))}
          </div>
        </>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Nouveau membre' : 'Modifier le membre'}
          onClose={() => setModal(null)}
          size="lg"
        >
          <MemberForm
            initial={modal.data}
            roles={roles}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
