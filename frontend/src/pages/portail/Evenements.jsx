import { useState, useEffect } from 'react'
import api from '../../api/client'
import Spinner from '../../components/Spinner'

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function EvenementsPortail() {
  const [events, setEvents]   = useState([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/portail/evenements', { params: { search: search || undefined } })
      .then((r) => setEvents(r.data))
      .finally(() => setLoading(false))
  }, [search])

  const upcoming  = events.filter((e) => new Date(e.date_debut) >= new Date())
  const past      = events.filter((e) => new Date(e.date_debut) <  new Date())

  return (
    <div className="space-y-5">
      <h2 className="page-title">Événements</h2>

      <input
        className="input w-full max-w-sm"
        placeholder="Rechercher…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? <Spinner /> : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <Section title="À venir" events={upcoming} />
          )}
          {past.length > 0 && (
            <Section title="Passés" events={past} muted />
          )}
          {events.length === 0 && (
            <p className="text-center text-gray-400 py-10">Aucun événement</p>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, events, muted }) {
  return (
    <div>
      <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${muted ? 'text-gray-400' : 'text-gray-600'}`}>
        {title}
      </h3>
      <div className="space-y-3">
        {events.map((e) => {
          const d = new Date(e.date_debut)
          return (
            <div key={e.id} className={`card flex items-start gap-4 ${muted ? 'opacity-70' : ''}`}>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center flex-shrink-0 font-bold">
                <span className="text-lg leading-none">{d.getDate()}</span>
                <span className="text-[10px] uppercase">{MOIS[d.getMonth()]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800">{e.titre}</p>
                  <span className="badge bg-blue-50 text-blue-700 flex-shrink-0">{e.type}</span>
                </div>
                {e.lieu && <p className="text-sm text-gray-500 mt-0.5">📍 {e.lieu}</p>}
                {e.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{e.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
