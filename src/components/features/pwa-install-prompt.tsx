import { useState } from 'react'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Button, Card, CardContent } from '@/components/ui'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { motion, AnimatePresence } from 'framer-motion'

export function PWAInstallPrompt() {
  const { canInstall, installApp } = usePWAInstall()
  const [isDismissed, setIsDismissed] = useState(false)

  const handleInstall = async () => {
    const success = await installApp()
    if (success) {
      setIsDismissed(true)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    // Store dismissal in localStorage to avoid showing again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Check if user has dismissed recently (within 7 days)
  const dismissedRecently = () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (!dismissed) return false
    
    const dismissedTime = parseInt(dismissed)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    return dismissedTime > sevenDaysAgo
  }

  if (!canInstall || isDismissed || dismissedRecently()) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
      >
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ArrowDownTrayIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Install Audio Journal
                </h3>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">
                  Get the full app experience with offline access and faster loading.
                </p>
                
                <div className="mt-3 flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Install
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-300"
                  >
                    Not now
                  </Button>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

export function PWAInstallButton() {
  const { canInstall, installApp } = usePWAInstall()

  if (!canInstall) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={installApp}
      className="flex items-center"
    >
      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
      Install App
    </Button>
  )
}
