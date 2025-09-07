import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AudioSession, ProcessingStatus } from '@/types'
import { generateId } from '@/lib/utils'

interface AudioSessionsState {
  // State
  sessions: AudioSession[]
  currentSession: AudioSession | null
  isLoading: boolean
  error: string | null

  // Actions
  addSession: (session: Omit<AudioSession, 'id' | 'createdAt' | 'updatedAt'>) => AudioSession
  updateSession: (id: string, updates: Partial<AudioSession>) => void
  deleteSession: (id: string) => void
  setCurrentSession: (session: AudioSession | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Computed properties
  getSessionById: (id: string) => AudioSession | undefined
  getSessionsByStatus: (status: ProcessingStatus) => AudioSession[]
  getFavoriteSessions: () => AudioSession[]
  getRecentSessions: (limit?: number) => AudioSession[]
  getSessionsByTag: (tag: string) => AudioSession[]
  getSessionsByCategory: (category: string) => AudioSession[]
}

// Helper function to ensure dates are Date objects
const ensureDateObjects = (session: AudioSession): AudioSession => ({
  ...session,
  createdAt: session.createdAt instanceof Date ? session.createdAt : new Date(session.createdAt),
  updatedAt: session.updatedAt instanceof Date ? session.updatedAt : new Date(session.updatedAt),
  ...(session.processedAt && {
    processedAt: session.processedAt instanceof Date ? session.processedAt : new Date(session.processedAt)
  }),
})

export const useAudioSessionsStore = create<AudioSessionsState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: null,

      // Actions
      addSession: (sessionData) => {
        const newSession: AudioSession = {
          ...sessionData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          progress: 0,
          tasks: [],
          tags: sessionData.tags || [],
          categories: sessionData.categories || [],
          isFavorite: false,
          customMetadata: sessionData.customMetadata || {},
        }

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSession: newSession,
          error: null,
        }))

        return newSession
      },

      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id
              ? { ...session, ...updates, updatedAt: new Date() }
              : session
          ),
          currentSession:
            state.currentSession?.id === id
              ? { ...state.currentSession, ...updates, updatedAt: new Date() }
              : state.currentSession,
        }))
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
          currentSession:
            state.currentSession?.id === id ? null : state.currentSession,
        }))
      },

      setCurrentSession: (session) => {
        set({ currentSession: session })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error, isLoading: false })
      },

      clearError: () => {
        set({ error: null })
      },

      // Computed properties
      getSessionById: (id) => {
        return get().sessions.find((session) => session.id === id)
      },

      getSessionsByStatus: (status) => {
        return get().sessions.filter((session) => session.status === status)
      },

      getFavoriteSessions: () => {
        return get().sessions.filter((session) => session.isFavorite)
      },

      getRecentSessions: (limit = 10) => {
        return get()
          .sessions.sort((a, b) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
            return bTime - aTime
          })
          .slice(0, limit)
      },

      getSessionsByTag: (tag) => {
        return get().sessions.filter((session) =>
          session.tags.includes(tag)
        )
      },

      getSessionsByCategory: (category) => {
        return get().sessions.filter((session) =>
          session.categories.includes(category)
        )
      },
    }),
    {
      name: 'audio-sessions-storage',
      // Only persist sessions, not loading states
      partialize: (state) => ({
        sessions: state.sessions,
        currentSession: state.currentSession,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Fix date objects when loading from storage
          if (state.sessions) {
            state.sessions = state.sessions.map(ensureDateObjects)
          }
          if (state.currentSession) {
            state.currentSession = ensureDateObjects(state.currentSession)
          }
        }
      },
    }
  )
)
