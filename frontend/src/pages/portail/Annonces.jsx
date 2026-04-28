import { useState, useEffect } from 'react'
import api from '../../api/client'
import Spinner from '../../components/Spinner'

export default function AnnoncesPortail() {
  const [annonces, setAnnonces] = useState([])
  const [types, setTypes]       = useState([])
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/portail/annonces', { params: { type_id: typeFilter || undefined } }),
      api.get('/types-annonce'),
    ])
      .then(([a, t]) => { setAnnonces(a.data); setTypes(t.data) })
      .finally(() => setLoading(false))
  }, [typeFilter])

  return (
    <div className="space-y-5">
      <h2 className="page-title">Annonces</h2>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !typeFilter ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Toutes
        </button>
        {types.map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              typeFilter === t.id ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.libelle}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : annonces.length === 0
        ? <p className="text-center text-gray-400 py-10">Aucune annonce publiée</p>
        : (
          <div className="space-y-3">
            {annonces.map((a) => (
              <AnnonceCard key={a.id} annonce={a} />
            ))}
          </div>
        )
      }
    </div>
  )
}

function AnnonceCard({ annonce: a }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <span
          className="mt-1 w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: a.couleur ?? '#3b82f6' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-gray-800">{a.titre}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {a.type}
                {a.membre_nom && ` · ${a.membre_nom}`}
                {a.date_evenement && ` · ${new Date(a.date_evenement).toLocaleDateString('fr-FR')}`}
              </p>
            </div>
            {a.published_at && (
              <span className="text-xs text-gray-400 flex-shrink-0">
                Publié le {new Date(a.published_at).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>

          {a.contenu && (
            <div className="mt-2">
              <p className={`text-sm text-gray-600 ${open ? '' : 'line-clamp-2'}`}>{a.contenu}</p>
              {a.contenu.length > 120 && (
                <button
                  onClick={() => setOpen((o) => !o)}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  {open ? 'Réduire' : 'Lire la suite'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
