import { useState, useEffect } from 'react'
import api from '../api/client'

/**
 * Hook pour charger les tables de statuts et énumérations
 * @returns {{ [refKey]: { [id]: { libelle, icone, couleur, description } } }}
 */
export function useStatusLabels() {
  const [labels, setLabels] = useState({})

  useEffect(() => {
    const refs = [
      'statuts-membres',
      'statuts-contributions',
      'statuts-cotisations-exceptionnelles',
      'statuts-loans',
      'statuts-events',
      'statuts-participants',
      'canaux-diffusion',
      'statuts-diffusions',
    ]

    Promise.all(
      refs.map((ref) =>
        api.get(`/admin/reference/${ref}`).catch(() => null)
      )
    ).then((results) => {
      const combined = {}
      refs.forEach((ref, idx) => {
        if (results[idx]?.data) {
          combined[ref] = Object.fromEntries(
            results[idx].data.map((row) => [row.id, row])
          )
        }
      })
      setLabels(combined)
    })
  }, [])

  return labels
}

/** Fallback labels pour éviter les crashes si les données ne chargent pas */
export const FALLBACK_STATUTS = {
  'statuts-contributions': {
    'paid': { libelle: 'Payée', icone: '✅', couleur: '#4CAF50' },
    'partial': { libelle: 'Partielle', icone: '⚠️', couleur: '#FF9800' },
    'unpaid': { libelle: 'Impayée', icone: '❌', couleur: '#F44336' },
  },
  'statuts-membres': {
    'actif': { libelle: 'Actif', icone: '👤', couleur: '#4CAF50' },
    'inactif': { libelle: 'Inactif', icone: '⏸️', couleur: '#FFC107' },
    'suspendu': { libelle: 'Suspendu', icone: '🚫', couleur: '#F44336' },
  },
  'statuts-loans': {
    'actif': { libelle: 'Actif', icone: '📊', couleur: '#2196F3' },
    'en_retard': { libelle: 'En retard', icone: '⏰', couleur: '#FF9800' },
    'solde': { libelle: 'Soldé', icone: '✅', couleur: '#4CAF50' },
  },
  'statuts-events': {
    'planifie': { libelle: 'Planifié', icone: '📅', couleur: '#2196F3' },
    'en_cours': { libelle: 'En cours', icone: '⏳', couleur: '#FF9800' },
    'termine': { libelle: 'Terminé', icone: '✅', couleur: '#4CAF50' },
    'annule': { libelle: 'Annulé', icone: '❌', couleur: '#F44336' },
  },
}
