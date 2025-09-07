import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserSettings } from '@/types'

interface UserSettingsState extends UserSettings {
  // Actions
  updateSettings: (settings: Partial<UserSettings>) => void
  resetSettings: () => void
  exportSettings: () => string
  importSettings: (settingsJson: string) => void
  
  // API Keys management
  setGoogleApiKey: (key: string) => void
  getGoogleApiKey: () => string | null
  clearApiKeys: () => void
}

const DEFAULT_SETTINGS: UserSettings = {
  // Audio processing settings
  defaultLanguage: 'en-US',
  transcriptionProvider: 'google',
  summarizationProvider: 'google',

  // Privacy settings
  dataRetentionDays: 90,
  autoDeleteOldSessions: true,
  cloudBackupEnabled: false,

  // UI settings
  theme: 'auto',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

  // Notification settings
  emailNotifications: true,
  pushNotifications: true,
  processingCompleteNotification: true,
  taskReminderNotification: true,

  // Performance settings
  maxConcurrentUploads: 3,
  lowQualityMode: false,
  offlineMode: false,
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (newSettings) => {
        set((state) => ({
          ...state,
          ...newSettings,
        }))
      },

      resetSettings: () => {
        set(DEFAULT_SETTINGS)
      },

      exportSettings: () => {
        const settings = get()
        const exportData = {
          ...settings,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        }

        // Remove functions from export
        delete (exportData as any).updateSettings
        delete (exportData as any).resetSettings
        delete (exportData as any).exportSettings
        delete (exportData as any).importSettings
        delete (exportData as any).setGoogleApiKey
        delete (exportData as any).getGoogleApiKey
        delete (exportData as any).clearApiKeys

        return JSON.stringify(exportData, null, 2)
      },

      importSettings: (settingsJson) => {
        try {
          const importedSettings = JSON.parse(settingsJson)

          // Validate imported settings
          if (!importedSettings || typeof importedSettings !== 'object') {
            throw new Error('Invalid settings format')
          }

          // Remove metadata fields
          delete importedSettings.exportedAt
          delete importedSettings.version

          // Update settings
          get().updateSettings(importedSettings)
        } catch (error) {
          throw new Error(
            `Failed to import settings: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          )
        }
      },

      setGoogleApiKey: (key) => {
        // Store API key securely (in a real app, this would be encrypted)
        localStorage.setItem('google_api_key', key)
      },

      getGoogleApiKey: () => {
        return localStorage.getItem('google_api_key')
      },

      clearApiKeys: () => {
        localStorage.removeItem('google_api_key')
      },
    }),
    {
      name: 'user-settings-storage',
      // Don't persist API key functions
      partialize: (state) => {
        const { setGoogleApiKey, getGoogleApiKey, clearApiKeys, ...persistedState } = state
        return persistedState
      },
    }
  )
)
