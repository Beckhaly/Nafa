import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import api from '../api/client'
import { useSettings } from '../context/SettingsContext'
import Spinner from '../components/Spinner'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - 2 + i)

/* ── helpers UI ────────────────────────────────────────────── */
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  )
}

/* ── page ───────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { reload: reloadSettings } = useSettings()
  const [form, setForm]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [tab, setTab]         = useState('identite')

  // logo
  const [logoPreview,     setLogoPreview]     = useState(null)
  const [uploadingLogo,   setUploadingLogo]   = useState(false)
  const logoRef = useRef()

  // règlement PDF
  const [reglementFile,       setReglementFile]       = useState(null)
  const [uploadingReglement,  setUploadingReglement]  = useState(false)
  const reglementRef = useRef()

  useEffect(() => {
    api.get('/parametres')
      .then((r) => {
        setForm(r.data)
        if (r.data.logo_url) setLogoPreview(r.data.logo_url)
      })
      .finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setVal = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  /* ── upload logo ─────────────────────────────────────── */
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoPreview(URL.createObjectURL(file))
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const r = await api.post('/parametres/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setVal('logo_url', r.data.logo_url)
      toast.success('Logo mis à jour')
      reloadSettings()
    } catch {
      toast.error('Erreur upload logo')
      setLogoPreview(form?.logo_url || null)
    } finally {
      setUploadingLogo(false)
    }
  }

  /* ── upload règlement PDF ────────────────────────────── */
  const handleReglementUpload = async () => {
    if (!reglementFile) return
    setUploadingReglement(true)
    try {
      const fd = new FormData()
      fd.append('reglement', reglementFile)
      const r = await api.post('/parametres/reglement', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setVal('reglement_url', r.data.reglement_url)
      setReglementFile(null)
      if (reglementRef.current) reglementRef.current.value = ''
      toast.success('Règlement PDF enregistré')
    } catch {
      toast.error('Erreur upload règlement')
    } finally {
      setUploadingReglement(false)
    }
  }

  /* ── save form ───────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/parametres', {
        nom_association:              form.nom_association,
        slogan:                       form.slogan                    || null,
        adresse:                      form.adresse                   || null,
        telephone:                    form.telephone                 || null,
        email_contact:                form.email_contact             || null,
        site_web:                     form.site_web                  || null,
        whatsapp_groupe:              form.whatsapp_groupe           || null,
        date_creation:                form.date_creation             || null,
        numero_enregistrement:        form.numero_enregistrement     || null,
        montant_cotisation_mensuelle: parseFloat(form.montant_cotisation_mensuelle) || 0,
        montant_adhesion:             form.montant_adhesion ? parseFloat(form.montant_adhesion) : null,
        devise:                       form.devise,
        plafond_pret:                 form.plafond_pret   ? parseFloat(form.plafond_pret)   : null,
        taux_interet_pret:            form.taux_interet_pret ? parseFloat(form.taux_interet_pret) : null,
        exercice_courant:             parseInt(form.exercice_courant),
        logo_url:                     form.logo_url                  || null,
        reglement_interieur:          form.reglement_interieur       || null,
        reglement_url:                form.reglement_url             || null,
      })
      toast.success('Paramètres enregistrés')
      reloadSettings()
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors
        ? Object.values(errors).flat().join(' · ')
        : err.response?.data?.message ?? 'Erreur lors de la sauvegarde.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  const TABS = [
    { k: 'identite',   label: 'Identité',           icon: '🏛️' },
    { k: 'finance',    label: 'Finance & Prêts',     icon: '💰' },
    { k: 'reglement',  label: 'Règlement intérieur', icon: '📋' },
    { k: 'systeme',    label: 'Système',             icon: '⚙️' },
  ]

  return (
    <div className="space-y-5">
      <h2 className="page-title">Paramètres</h2>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(({ k, label, icon }) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              tab === k
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ══════════ ONGLET IDENTITÉ ══════════════════════════════ */}
        {tab === 'identite' && (
          <div className="grid grid-cols-2 gap-5">
            {/* Colonne gauche */}
            <div className="space-y-5">
              {/* Logo */}
              <Section title="Logo de l'association" icon="🖼️">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50
                                  flex items-center justify-center overflow-hidden relative">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-4xl text-gray-300">🏛️</span>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    <button type="button" onClick={() => logoRef.current?.click()}
                      disabled={uploadingLogo} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                      {uploadingLogo ? 'Upload en cours…' : 'Choisir un logo'}
                    </button>
                    {form.logo_url && (
                      <button type="button"
                        onClick={() => { setVal('logo_url', null); setLogoPreview(null) }}
                        className="block text-xs text-red-500 hover:underline">
                        Supprimer le logo
                      </button>
                    )}
                    <p className="text-xs text-gray-400">PNG, JPG, SVG · max 2 Mo<br/>Recommandé : 256×256 px</p>
                  </div>
                </div>
              </Section>

              {/* Informations générales */}
              <Section title="Informations générales" icon="📝">
                <Field label="Nom de l'association *">
                  <input className="input" value={form.nom_association ?? ''}
                    onChange={set('nom_association')} required />
                </Field>
                <Field label="Slogan / Description courte">
                  <input className="input" value={form.slogan ?? ''}
                    onChange={set('slogan')} placeholder="ex : Ensemble pour un avenir meilleur" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date de création">
                    <input type="date" className="input" value={form.date_creation ?? ''}
                      onChange={set('date_creation')} />
                  </Field>
                  <Field label="N° d'enregistrement">
                    <input className="input" value={form.numero_enregistrement ?? ''}
                      onChange={set('numero_enregistrement')} placeholder="ex : RF/GUI/2019/001" />
                  </Field>
                </div>
              </Section>
            </div>

            {/* Colonne droite */}
            <div className="space-y-5">
              <Section title="Coordonnées" icon="📞">
                <Field label="Adresse du siège social">
                  <textarea className="input" rows={3} value={form.adresse ?? ''}
                    onChange={set('adresse')} placeholder="Adresse complète" />
                </Field>
                <Field label="Téléphone">
                  <input className="input" value={form.telephone ?? ''}
                    onChange={set('telephone')} placeholder="+224 628 000 000" />
                </Field>
                <Field label="Email de contact">
                  <input type="email" className="input" value={form.email_contact ?? ''}
                    onChange={set('email_contact')} placeholder="contact@association.org" />
                </Field>
                <Field label="Site web">
                  <input type="url" className="input" value={form.site_web ?? ''}
                    onChange={set('site_web')} placeholder="https://www.association.org" />
                </Field>
                <Field label="Lien groupe WhatsApp">
                  <input className="input" value={form.whatsapp_groupe ?? ''}
                    onChange={set('whatsapp_groupe')} placeholder="https://chat.whatsapp.com/..." />
                </Field>
              </Section>
            </div>
          </div>
        )}

        {/* ══════════ ONGLET FINANCE ═══════════════════════════════ */}
        {tab === 'finance' && (
          <div className="grid grid-cols-2 gap-5">
            <Section title="Cotisations" icon="🧾">
              <Field label="Cotisation mensuelle *"
                hint="Montant de référence pour la matrice de pointage">
                <div className="relative">
                  <input type="number" className="input pr-14"
                    value={form.montant_cotisation_mensuelle ?? ''}
                    onChange={set('montant_cotisation_mensuelle')}
                    required min="0" step="100" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                    {form.devise}
                  </span>
                </div>
              </Field>
              <Field label="Droit d'adhésion (unique)"
                hint="Montant payé une seule fois à l'inscription">
                <div className="relative">
                  <input type="number" className="input pr-14"
                    value={form.montant_adhesion ?? ''}
                    onChange={set('montant_adhesion')}
                    min="0" step="100" placeholder="0" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                    {form.devise}
                  </span>
                </div>
              </Field>
              <Field label="Devise *">
                <input className="input" value={form.devise ?? ''}
                  onChange={set('devise')} required maxLength={10} placeholder="FCFA" />
              </Field>
            </Section>

            <Section title="Prêts" icon="🏦">
              <Field label="Plafond de prêt"
                hint="Montant maximum accordable à un membre">
                <div className="relative">
                  <input type="number" className="input pr-14"
                    value={form.plafond_pret ?? ''}
                    onChange={set('plafond_pret')}
                    min="0" step="10000" placeholder="Non défini" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                    {form.devise}
                  </span>
                </div>
              </Field>
              <Field label="Taux d'intérêt (%)"
                hint="Taux mensuel ou annuel selon votre convention">
                <div className="relative">
                  <input type="number" className="input pr-8"
                    value={form.taux_interet_pret ?? ''}
                    onChange={set('taux_interet_pret')}
                    min="0" max="100" step="0.5" placeholder="0" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">%</span>
                </div>
              </Field>
            </Section>
          </div>
        )}

        {/* ══════════ ONGLET RÈGLEMENT INTÉRIEUR ═══════════════════ */}
        {tab === 'reglement' && (
          <div className="grid grid-cols-2 gap-5 items-start">
            <Section title="Texte du règlement intérieur" icon="📄">
              <p className="text-xs text-gray-500 -mt-2">
                Saisissez le règlement en texte brut, consultable directement dans l'application.
              </p>
              <textarea
                className="input font-mono text-xs leading-relaxed"
                rows={22}
                value={form.reglement_interieur ?? ''}
                onChange={set('reglement_interieur')}
                placeholder={`RÈGLEMENT INTÉRIEUR DE L'ASSOCIATION\n\nArticle 1 — Objet\n...\n\nArticle 2 — Membres\n...`}
              />
            </Section>

            <Section title="Document PDF officiel" icon="📎">
              <p className="text-xs text-gray-500 -mt-2">
                Uploadez le règlement signé en PDF. Il sera accessible en téléchargement.
              </p>

              {form.reglement_url ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-4">
                  <svg className="w-10 h-10 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">Règlement intérieur.pdf</p>
                    <a href={form.reglement_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline">
                      Consulter / Télécharger
                    </a>
                  </div>
                  <button type="button" onClick={() => setVal('reglement_url', null)}
                    className="text-xs text-red-500 hover:underline flex-shrink-0">
                    Supprimer
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-400">Aucun PDF enregistré</p>
                </div>
              )}

              <div className="space-y-3 pt-1">
                <input
                  ref={reglementRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setReglementFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0
                    file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 cursor-pointer"
                />
                {reglementFile && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 flex-1 truncate">
                      {reglementFile.name} ({(reglementFile.size / 1024).toFixed(0)} Ko)
                    </span>
                    <button type="button" onClick={handleReglementUpload}
                      disabled={uploadingReglement}
                      className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50">
                      {uploadingReglement ? 'Upload…' : 'Enregistrer le PDF'}
                    </button>
                    <button type="button"
                      onClick={() => { setReglementFile(null); if (reglementRef.current) reglementRef.current.value = '' }}
                      className="text-xs text-gray-400 hover:text-gray-600">
                      Annuler
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-400">PDF uniquement · max 10 Mo</p>
              </div>
            </Section>
          </div>
        )}

        {/* ══════════ ONGLET SYSTÈME ═══════════════════════════════ */}
        {tab === 'systeme' && (
          <Section title="Exercice & Système" icon="🗓️">
            <Field label="Exercice en cours *"
              hint="Année de référence pour les rapports et la matrice de cotisations">
              <select className="input max-w-xs"
                value={form.exercice_courant ?? CURRENT_YEAR}
                onChange={set('exercice_courant')}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>

            {/* Infos read-only */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Dernière mise à jour</p>
                <p className="text-sm font-semibold text-gray-700">
                  {form.updated_at
                    ? new Date(form.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Version plateforme</p>
                <p className="text-sm font-semibold text-gray-700">Nafa Platform v1.0</p>
              </div>
            </div>
          </Section>
        )}

        {/* ── Bouton Enregistrer (hors onglet règlement, le PDF s'upload séparément) ── */}
        <div className="flex justify-end pt-1">
          <button type="submit" className="btn-primary px-6" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </form>
    </div>
  )
}
