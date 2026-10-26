const GUIDE_HTML = '/guide/GUIDE_UTILISATEUR_COMPLET.html'
const GUIDE_PDF = '/guide/GUIDE_UTILISATEUR_COMPLET.pdf'

export default function GuidePage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guide utilisateur</h1>
          <p className="text-sm text-gray-500 mt-1">Mode d'emploi complet de Nafa, avec captures d'écran.</p>
        </div>
        <div className="flex gap-2">
          <a href={GUIDE_HTML} target="_blank" rel="noreferrer" className="btn btn-secondary">
            Ouvrir dans un onglet
          </a>
          <a href={GUIDE_PDF} download className="btn btn-primary">
            Télécharger le PDF
          </a>
        </div>
      </div>

      <iframe
        src={GUIDE_HTML}
        title="Guide utilisateur Nafa"
        className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm"
        style={{ height: 'calc(100vh - 13rem)', minHeight: '480px' }}
      />
    </div>
  )
}
