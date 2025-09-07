import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { PWAInstallPrompt } from '@/components/features/pwa-install-prompt'
import { useUIStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        // Dynamic left margin based on sidebar state
        // Only apply margin on desktop (lg and above)
        sidebarOpen ? "lg:ml-64" : "lg:ml-0",
        // On mobile, always full width (no margin)
        "ml-0"
      )}>
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="bg-gray-50 dark:bg-gray-900">
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
