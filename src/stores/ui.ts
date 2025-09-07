import { create } from 'zustand'
import { Notification } from '@/types'
import { generateId } from '@/lib/utils'

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'auto'

  // Layout
  sidebarOpen: boolean
  activeView: 'dashboard' | 'upload' | 'history' | 'settings'

  // Modals and overlays
  activeModal: string | null
  modalProps: Record<string, any>

  // Notifications
  notifications: Notification[]

  // Loading states
  globalLoading: boolean
  loadingStates: Record<string, boolean>

  // Search and filters
  searchQuery: string
  activeFilters: Record<string, any>

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setActiveView: (view: 'dashboard' | 'upload' | 'history' | 'settings') => void
  openModal: (modalId: string, props?: Record<string, any>) => void
  closeModal: () => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  setGlobalLoading: (loading: boolean) => void
  setLoadingState: (key: string, loading: boolean) => void
  clearLoadingState: (key: string) => void
  setSearchQuery: (query: string) => void
  setFilter: (key: string, value: any) => void
  clearFilters: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  theme: 'auto',
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : false, // Open on desktop by default
  activeView: 'dashboard',
  activeModal: null,
  modalProps: {},
  notifications: [],
  globalLoading: false,
  loadingStates: {},
  searchQuery: '',
  activeFilters: {},

  // Actions
  setTheme: (theme) => {
    set({ theme })
    
    // Apply theme to document
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // Auto theme based on system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open })
  },

  setActiveView: (view) => {
    set({ activeView: view })
  },

  openModal: (modalId, props = {}) => {
    set({
      activeModal: modalId,
      modalProps: props,
    })
  },

  closeModal: () => {
    set({
      activeModal: null,
      modalProps: {},
    })
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      duration: notification.duration ?? 5000,
    }

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }))

    // Auto-remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(newNotification.id)
      }, newNotification.duration)
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },

  setGlobalLoading: (loading) => {
    set({ globalLoading: loading })
  },

  setLoadingState: (key, loading) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: loading,
      },
    }))
  },

  clearLoadingState: (key) => {
    set((state) => {
      const { [key]: _, ...rest } = state.loadingStates
      return { loadingStates: rest }
    })
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  setFilter: (key, value) => {
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        [key]: value,
      },
    }))
  },

  clearFilters: () => {
    set({ activeFilters: {} })
  },
}))

// Initialize theme on app start
const initializeTheme = () => {
  const { theme, setTheme } = useUIStore.getState()
  setTheme(theme)
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme, setTheme } = useUIStore.getState()
    if (theme === 'auto') {
      setTheme('auto') // Re-apply auto theme
    }
  })

  // Initialize theme
  initializeTheme()
}
