import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import api from '../api/client'
import Spinner from '../components/Spinner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const fmt    = (n) => Number(n ?? 0).toLocaleString('fr-FR')
const fmtPdf = (n) => Math.round(Number(n ?? 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const pct = (n) => Number(n ?? 0).toFixed(1) + '%'

const statutInfo = (row) => {
  if (row.solde_restant <= 0)   return { label: 'À jour',  cls: 'bg-green-100 text-green-700'  }
  if (row.total_paye > 0)       return { label: 'Partiel', cls: 'bg-yellow-100 text-yellow-700' }
  return                               { label: 'Impayé',  cls: 'bg-red-100 text-red-600'       }
}

export default function RecapCotisationsPage() {
  const [annees,   setAnnees]   = useState([])
  const [annee,    setAnnee]    = useState('')
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [sending,  setSending]  = useState(false)
  const [filtre,   setFiltre]   = useState('tous')

  useEffect(() => {
    api.get('/rapports/recap-cotisations/annees').then(r => {
      setAnnees(r.data)
      if (r.data.length) setAnnee(String(r.data[0]))
    })
  }, [])

  const load = useCallback(() => {
    if (!annee) return
    setLoading(true)
    setSelected(new Set())
    api.get(`/rapports/recap-cotisations/${annee}`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false))
  }, [annee])

  useEffect(() => { load() }, [load])

  const rows = (data?.rows ?? []).filter(r => {
    if (filtre === 'jour')    return r.solde_restant <= 0
    if (filtre === 'partiel') return r.total_paye > 0 && r.solde_restant > 0
    if (filtre === 'impaye')  return r.total_paye <= 0
    return true
  })

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set())
    else setSelected(new Set(rows.map(r => r.member_id)))
  }
  const toggle = (id) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const exportPDF = () => {
    if (!data) return
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // En-tête
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Récapitulatif des cotisations — ${annee}`, 14, 14)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 20)

    // Totaux résumé
    const { totaux } = data
    doc.setTextColor(0)
    doc.setFontSize(9)
    const resume = [
      `Membres : ${totaux.nb_membres}`,
      `À jour : ${totaux.nb_a_jour}`,
      `Taux global : ${Number(totaux.taux_recouvrement).toFixed(1)}%`,
      `Total attendu : ${fmtPdf(totaux.total_du)} FCFA`,
      `Total reçu : ${fmtPdf(totaux.total_paye)} FCFA`,
      `Reste dû : ${fmtPdf(totaux.solde_restant)} FCFA`,
    ]
    doc.text(resume.join('   |   '), 14, 27)

    // Tableau
    autoTable(doc, {
      startY: 33,
      head: [
        [
          { content: 'Membre',                   rowSpan: 2, styles: { valign: 'middle', halign: 'left' } },
          { content: 'Cotisations mensuelles',    colSpan: 3, styles: { halign: 'center', fillColor: [219, 234, 254], textColor: [29, 78, 216] } },
          { content: 'Cotisations exceptionnelles', colSpan: 3, styles: { halign: 'center', fillColor: [237, 233, 254], textColor: [109, 40, 217] } },
          { content: 'Taux global',               rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Statut',                    rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        ],
        [
          { content: 'Attendu',  styles: { halign: 'right', fillColor: [219, 234, 254] } },
          { content: 'Reçu',     styles: { halign: 'right', fillColor: [219, 234, 254] } },
          { content: 'Solde',    styles: { halign: 'right', fillColor: [219, 234, 254] } },
          { content: 'Attendu',  styles: { halign: 'right', fillColor: [237, 233, 254] } },
          { content: 'Reçu',     styles: { halign: 'right', fillColor: [237, 233, 254] } },
          { content: 'Solde',    styles: { halign: 'right', fillColor: [237, 233, 254] } },
        ],
      ],
      body: rows.map(r => {
        const st = statutInfo(r)
        return [
          `${r.nom_complet}\n${r.matricule}`,
          { content: fmtPdf(r.mens_du),   styles: { halign: 'right', fillColor: [239, 246, 255] } },
          { content: fmtPdf(r.mens_paye), styles: { halign: 'right', fillColor: [239, 246, 255] } },
          { content: fmtPdf(r.mens_solde), styles: { halign: 'right', fillColor: [239, 246, 255], textColor: Number(r.mens_solde) > 0 ? [220, 38, 38] : [107, 114, 128] } },
          { content: fmtPdf(r.cex_du),    styles: { halign: 'right', fillColor: [245, 243, 255] } },
          { content: fmtPdf(r.cex_paye),  styles: { halign: 'right', fillColor: [245, 243, 255] } },
          { content: fmtPdf(r.cex_solde), styles: { halign: 'right', fillColor: [245, 243, 255], textColor: Number(r.cex_solde) > 0 ? [220, 38, 38] : [107, 114, 128] } },
          { content: `${Number(r.taux_global).toFixed(1)}%`, styles: { halign: 'center' } },
          { content: st.label, styles: { halign: 'center',
              textColor: r.solde_restant <= 0 ? [21, 128, 61] : r.total_paye > 0 ? [161, 98, 7] : [185, 28, 28] } },
        ]
      }),
      foot: [[
        { content: `Total (${rows.length} membres)`, styles: { fontStyle: 'bold' } },
        { content: fmtPdf(rows.reduce((s,r)=>s+Number(r.mens_du),0)),   styles: { halign: 'right', fontStyle: 'bold', fillColor: [219, 234, 254] } },
        { content: fmtPdf(rows.reduce((s,r)=>s+Number(r.mens_paye),0)), styles: { halign: 'right', fontStyle: 'bold', fillColor: [219, 234, 254] } },
        { content: fmtPdf(rows.reduce((s,r)=>s+Number(r.mens_solde),0)),styles: { halign: 'right', fontStyle: 'bold', fillColor: [219, 234, 254], textColor: [185, 28, 28] } },
        { content: fmtPdf(rows.reduce((s,r)=>s+Number(r.cex_du),0)),    styles: { halign: 'right', fontStyle: 'bold', fillColor: [237, 233, 254] } },
        { content: fmtPdf(rows.reduce((s,r)=>s+Number(r.cex_paye),0)),  styles: { halign: 'right', fontStyle: 'bold', fillColor: [237, 233, 254] } },
        { content: fmtPdf(rows.reduce((s,r)=>s+Number(r.cex_solde),0)), styles: { halign: 'right', fontStyle: 'bold', fillColor: [237, 233, 254], textColor: [185, 28, 28] } },
        '', '',
      ]],
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fontStyle: 'bold', fontSize: 8 },
      footStyles: { fontStyle: 'bold', fontSize: 8 },
      columnStyles: { 0: { cellWidth: 45 } },
      showFoot: 'lastPage',
    })

    doc.save(`recap-cotisations-${annee}.pdf`)
  }

  const diffuser = async (canal) => {
    const member_ids = selected.size ? [...selected] : []
    const cible = selected.size ? `${selected.size} membre(s)` : 'tous les membres'
    if (!window.confirm(`Envoyer le récap ${annee} par ${canal.toUpperCase()} à ${cible} ?`)) return
    setSending(true)
    try {
      const r = await api.post(`/rapports/recap-cotisations/${annee}/diffuser`, { canal, member_ids })
      toast.success(`${r.data.envoyes}/${r.data.total} messages envoyés`)
    } catch {
      toast.error('Erreur lors de la diffusion')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sélecteur d'année */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Année</label>
        <select className="input w-28" value={annee} onChange={e => setAnnee(e.target.value)}>
          {annees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading && <div className="flex justify-center py-16"><Spinner /></div>}

      {!loading && data && (
        <>
          {/* KPI globaux */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Membres"          value={data.totaux.nb_membres}                                color="blue" />
            <KpiCard label="À jour"           value={data.totaux.nb_a_jour}                                 color="green" />
            <KpiCard label="Taux global"      value={pct(data.totaux.taux_recouvrement)}                    color="indigo" />
            <KpiCard label="Total attendu"    value={fmt(data.totaux.total_du) + ' FCFA'}                   color="purple" small />
            <KpiCard label="Total reçu"       value={fmt(data.totaux.total_paye) + ' FCFA'}                 color="amber" small />
            <KpiCard label="Reste dû"         value={fmt(data.totaux.solde_restant) + ' FCFA'}              color="red" small />
          </div>

          {/* Résumé mensuel vs CEX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SectionCard
              title="Cotisations mensuelles"
              color="blue"
              attendu={data.totaux.mens_du}
              recu={data.totaux.mens_paye}
              solde={data.totaux.mens_du - data.totaux.mens_paye}
            />
            <SectionCard
              title="Cotisations exceptionnelles"
              color="violet"
              attendu={data.totaux.cex_du}
              recu={data.totaux.cex_paye}
              solde={data.totaux.cex_du - data.totaux.cex_paye}
            />
          </div>

          {/* Filtres + actions diffusion */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[['tous','Tous'],['jour','À jour'],['partiel','Partiel'],['impaye','Impayé']].map(([v,l]) => (
                <button key={v} onClick={() => setFiltre(v)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filtre === v ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>{l}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {selected.size > 0 && <span className="text-xs text-gray-500">{selected.size} sélectionné(s)</span>}
              <button onClick={exportPDF}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
              <button onClick={() => diffuser('sms')} disabled={sending}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {sending ? 'Envoi…' : 'SMS'}
              </button>
              <button onClick={() => diffuser('whatsapp')} disabled={sending}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {sending ? 'Envoi…' : 'WhatsApp'}
              </button>
            </div>
          </div>

          {/* Tableau */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {/* Groupe headers */}
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th rowSpan={2} className="px-3 py-2 border-r border-gray-200">
                      <input type="checkbox" className="rounded"
                        checked={selected.size === rows.length && rows.length > 0}
                        onChange={toggleAll} />
                    </th>
                    <th rowSpan={2} className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wide border-r border-gray-200">
                      Membre
                    </th>
                    {/* Mensuel */}
                    <th colSpan={3} className="px-4 py-2 text-center text-xs font-bold text-blue-700 uppercase tracking-wide border-r border-gray-200 bg-blue-50">
                      Cotisations mensuelles
                    </th>
                    {/* CEX */}
                    <th colSpan={3} className="px-4 py-2 text-center text-xs font-bold text-violet-700 uppercase tracking-wide border-r border-gray-200 bg-violet-50">
                      Cotisations exceptionnelles
                    </th>
                    {/* Global */}
                    <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Global
                    </th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
                    <th className="px-3 py-2 text-right bg-blue-50">Attendu</th>
                    <th className="px-3 py-2 text-right bg-blue-50">Reçu</th>
                    <th className="px-3 py-2 text-right bg-blue-50 border-r border-gray-200">Solde</th>
                    <th className="px-3 py-2 text-right bg-violet-50">Attendu</th>
                    <th className="px-3 py-2 text-right bg-violet-50">Reçu</th>
                    <th className="px-3 py-2 text-right bg-violet-50 border-r border-gray-200">Solde</th>
                    <th className="px-3 py-2 text-right">Taux</th>
                    <th className="px-3 py-2 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-12 text-gray-400">Aucun membre trouvé</td></tr>
                  )}
                  {rows.map(r => {
                    const st = statutInfo(r)
                    return (
                      <tr key={r.member_id}
                        className={`hover:bg-gray-50 transition-colors ${selected.has(r.member_id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-3 py-3 border-r border-gray-100">
                          <input type="checkbox" className="rounded"
                            checked={selected.has(r.member_id)}
                            onChange={() => toggle(r.member_id)} />
                        </td>
                        <td className="px-4 py-3 border-r border-gray-100">
                          <p className="font-semibold text-gray-900 whitespace-nowrap">{r.nom_complet}</p>
                          <p className="text-xs font-mono text-blue-600">{r.matricule}</p>
                          <p className="text-xs text-gray-400">{r.role}</p>
                        </td>
                        {/* Mensuel */}
                        <td className="px-3 py-3 text-right text-gray-700 bg-blue-50/40 font-medium whitespace-nowrap">{fmt(r.mens_du)}</td>
                        <td className="px-3 py-3 text-right text-green-700 bg-blue-50/40 font-medium whitespace-nowrap">{fmt(r.mens_paye)}</td>
                        <td className="px-3 py-3 text-right bg-blue-50/40 border-r border-gray-100 font-medium whitespace-nowrap">
                          <span className={Number(r.mens_solde) > 0 ? 'text-red-500' : 'text-gray-400'}>{fmt(r.mens_solde)}</span>
                        </td>
                        {/* CEX */}
                        <td className="px-3 py-3 text-right text-gray-700 bg-violet-50/40 font-medium whitespace-nowrap">{fmt(r.cex_du)}</td>
                        <td className="px-3 py-3 text-right text-green-700 bg-violet-50/40 font-medium whitespace-nowrap">{fmt(r.cex_paye)}</td>
                        <td className="px-3 py-3 text-right bg-violet-50/40 border-r border-gray-100 font-medium whitespace-nowrap">
                          <span className={Number(r.cex_solde) > 0 ? 'text-red-500' : 'text-gray-400'}>{fmt(r.cex_solde)}</span>
                        </td>
                        {/* Global */}
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 bg-gray-200 rounded-full h-1.5">
                              <div className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(r.taux_global, 100)}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-10 text-right">{pct(r.taux_global)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {rows.length > 0 && (
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300 text-sm font-bold">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-gray-700 border-r border-gray-200">
                        Total ({rows.length} membres)
                      </td>
                      <td className="px-3 py-3 text-right text-gray-800 bg-blue-50">{fmt(rows.reduce((s,r)=>s+Number(r.mens_du),0))}</td>
                      <td className="px-3 py-3 text-right text-green-700 bg-blue-50">{fmt(rows.reduce((s,r)=>s+Number(r.mens_paye),0))}</td>
                      <td className="px-3 py-3 text-right text-red-600 bg-blue-50 border-r border-gray-200">{fmt(rows.reduce((s,r)=>s+Number(r.mens_solde),0))}</td>
                      <td className="px-3 py-3 text-right text-gray-800 bg-violet-50">{fmt(rows.reduce((s,r)=>s+Number(r.cex_du),0))}</td>
                      <td className="px-3 py-3 text-right text-green-700 bg-violet-50">{fmt(rows.reduce((s,r)=>s+Number(r.cex_paye),0))}</td>
                      <td className="px-3 py-3 text-right text-red-600 bg-violet-50 border-r border-gray-200">{fmt(rows.reduce((s,r)=>s+Number(r.cex_solde),0))}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value, color, small }) {
  const colors = {
    blue:   'from-blue-500 to-blue-600',
    green:  'from-green-500 to-green-600',
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    amber:  'from-amber-500 to-amber-600',
    red:    'from-red-500 to-red-600',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 text-white`}>
      <p className="text-xs font-medium opacity-80 mb-1">{label}</p>
      <p className={`font-bold leading-tight ${small ? 'text-sm' : 'text-2xl'}`}>{value}</p>
    </div>
  )
}

function SectionCard({ title, color, attendu, recu, solde }) {
  const taux = attendu > 0 ? Math.min((recu / attendu) * 100, 100) : 100
  const colors = {
    blue:   { bar: 'bg-blue-500', border: 'border-blue-200', bg: 'bg-blue-50', title: 'text-blue-800', label: 'text-blue-600' },
    violet: { bar: 'bg-violet-500', border: 'border-violet-200', bg: 'bg-violet-50', title: 'text-violet-800', label: 'text-violet-600' },
  }
  const c = colors[color]
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-4`}>
      <p className={`text-sm font-bold ${c.title} mb-3`}>{title}</p>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className={`text-xs ${c.label} font-medium`}>Attendu</p>
          <p className="text-sm font-bold text-gray-800">{fmt(attendu)}</p>
        </div>
        <div>
          <p className={`text-xs ${c.label} font-medium`}>Reçu</p>
          <p className="text-sm font-bold text-green-700">{fmt(recu)}</p>
        </div>
        <div>
          <p className={`text-xs ${c.label} font-medium`}>Reste dû</p>
          <p className={`text-sm font-bold ${solde > 0 ? 'text-red-600' : 'text-gray-400'}`}>{fmt(solde)}</p>
        </div>
      </div>
      <div className="w-full bg-white/60 rounded-full h-2">
        <div className={`${c.bar} h-2 rounded-full transition-all`} style={{ width: `${taux}%` }} />
      </div>
      <p className="text-right text-xs text-gray-500 mt-1">{taux.toFixed(1)}% recouvré</p>
    </div>
  )
}
