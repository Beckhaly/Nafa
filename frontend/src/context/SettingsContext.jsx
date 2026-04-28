import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../api/client'

const SettingsContext = createContext({ settings: null, reload: () => {} })

export function SettingsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [settings, setSettings] = useState(null)

  const reload = () => {
    api.get('/parametres').then((r) => setSettings(r.data)).catch(() => {})
  }

  useEffect(() => {
    if (isAuthenticated) reload()
    else setSettings(null)
  }, [isAuthenticated])

  return (
    <SettingsContext.Provider value={{ settings, reload }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
