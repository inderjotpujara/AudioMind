import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  CloudArrowUpIcon,
  ClockIcon,
  Cog6ToothIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  CloudArrowUpIcon as CloudArrowUpIconSolid,
  ClockIcon as ClockIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  QueueListIcon as QueueListIconSolid,
} from '@heroicons/react/24/solid'
import { useUIStore } from '@/stores/ui'
import { useAudioSessionsStore } from '@/stores/audio-sessions'
import { backgroundProcessor } from '@/lib/background-processor'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { sessions } = useAudioSessionsStore()
  
  // Get real stats
  const totalSessions = sessions.length
  const queueStatus = backgroundProcessor.getQueueStatus()
  const activeQueue = queueStatus.pending + queueStatus.processing

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      current: location.pathname === '/',
    },
    {
      name: 'Upload Audio',
      href: '/upload',
      icon: CloudArrowUpIcon,
      iconSolid: CloudArrowUpIconSolid,
      current: location.pathname === '/upload',
    },
    {
      name: 'Processing Queue',
      href: '/processing-queue',
      icon: QueueListIcon,
      iconSolid: QueueListIconSolid,
      current: location.pathname === '/processing-queue',
    },
    {
      name: 'History',
      href: '/history',
      icon: ClockIcon,
      iconSolid: ClockIconSolid,
      current: location.pathname === '/history',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      iconSolid: Cog6ToothIconSolid,
      current: location.pathname === '/settings',
    },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out flex-shrink-0 shadow-lg",
        "h-screen fixed top-0 left-0 z-50", // Always fixed and full height
        // Responsive visibility
        sidebarOpen ? "translate-x-0" : "-translate-x-64" // Slide in/out by full width
      )}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🎤</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 dark:text-white text-lg">Audio Journal</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">AI-Powered Insights</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.current ? item.iconSolid : item.icon
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative",
                    item.current
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 transform scale-105'
                      : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                  )}
                >
                  <Icon className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200",
                    item.current ? "text-white" : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                  )} />
                  <span className="flex-1">{item.name}</span>
                  
                  {/* Active indicator */}
                  {item.current && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-75" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Quick Stats Section */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Total Sessions</span>
                  <span className="font-medium text-gray-900 dark:text-white">{totalSessions}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Processing Queue</span>
                  <span className={cn(
                    "font-medium",
                    activeQueue > 0 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-gray-900 dark:text-white"
                  )}>
                    {activeQueue > 0 ? activeQueue : 'Empty'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="text-center space-y-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Audio Journal v1.0.0
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Privacy-First • AI-Powered
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}