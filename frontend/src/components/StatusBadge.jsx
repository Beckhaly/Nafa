/**
 * Affiche un statut avec icone et couleur
 * @param {string} statut - La valeur du statut (ex: 'paid', 'actif')
 * @param {object} statusData - Les données du statut { libelle, icone, couleur, description }
 * @param {string} size - Taille du badge: 'sm' | 'md' | 'lg'
 */
export default function StatusBadge({ statut, statusData, size = 'md' }) {
  if (!statusData) {
    return <span className="text-gray-400 text-sm">—</span>
  }

  const { libelle, icone, couleur } = statusData

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  }

  const bgColor = couleur ? { backgroundColor: couleur + '15' } : {}
  const textColor = couleur ? { color: couleur } : {}

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-medium border ${sizeClasses[size]}`}
      style={{
        ...bgColor,
        ...textColor,
        borderColor: couleur ? couleur + '40' : '#e5e7eb',
      }}
      title={statusData.description || libelle}
    >
      {icone && <span className="flex-shrink-0">{icone}</span>}
      <span>{libelle}</span>
    </span>
  )
}
