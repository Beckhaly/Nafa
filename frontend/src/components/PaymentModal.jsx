import { useState } from 'react'
import { toast } from 'sonner'
import Modal from './Modal'
import api from '../api/client'

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function PaymentModal({ member, annee, mois, montantDu, onSuccess, onClose }) {
  const [montant, setMontant] = useState(montantDu ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/contributions/pay', {
        member_id:  member.member_id,
        annee,
        mois,
        montant:    parseFloat(montant),
        montant_du: montantDu,
      })
      onSuccess(data)
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erreur lors du paiement.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Enregistrer un paiement" onClose={onClose} size="sm">
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
        <p className="font-medium text-blue-800">{member.nom_complet}</p>
        <p className="text-blue-600">{MONTHS[mois - 1]} {annee}</p>
        <p className="text-blue-600">Montant dû : <strong>{montantDu?.toLocaleString('fr-FR')} FCFA</strong></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Montant versé (FCFA)</label>
          <input
            type="number"
            className="input"
            min="1"
            max={montantDu}
            step="1"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            required
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Valider'}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  )
}
