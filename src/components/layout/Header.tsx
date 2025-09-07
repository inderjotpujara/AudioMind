import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline'
import { Button, DropdownMenu, Input, Badge } from '@/components/ui'
import { PWAInstallButton } from '@/components/features/pwa-install-prompt'
import { useUIStore } from '@/stores/ui'
import { useUserSettingsStore } from '@/stores/user-settings'
export default function Header() {
  const location = useLocation()
  const { toggleSidebar, theme, setTheme, searchQuery, setSearchQuery, notifications, clearNotifications } = useUIStore()
  const { updateSettings } = useUserSettingsStore()
  const [showSearch, setShowSearch] = useState(false)

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard'
      case '/upload':
        return 'Upload Audio'
      case '/history':
        return 'Audio History'
      case '/settings':
        return 'Settings'
      default:
        return 'Audio Journal'
    }
  }

  const themeOptions = [
    {
      label: 'Light',
      onClick: () => {
        setTheme('light')
        updateSettings({ theme: 'light' })
      },
      icon: <SunIcon className="h-4 w-4" />
    },
    {
      label: 'Dark',
      onClick: () => {
        setTheme('dark')
        updateSettings({ theme: 'dark' })
      },
      icon: <MoonIcon className="h-4 w-4" />
    },
    {
      label: 'System',
      onClick: () => {
        setTheme('auto')
        updateSettings({ theme: 'auto' })
      },
      icon: <ComputerDesktopIcon className="h-4 w-4" />
    }
  ]

  const userMenuOptions = [
    {
      label: 'Settings',
      onClick: () => window.location.href = '/settings',
      icon: <UserCircleIcon className="h-4 w-4" />
    },
    {
      label: 'Export Data',
      onClick: () => console.log('Export data'),
      icon: <UserCircleIcon className="h-4 w-4" />
    },
    {
      label: 'Sign Out',
      onClick: () => console.log('Sign out'),
      icon: <UserCircleIcon className="h-4 w-4" />,
      destructive: true
    }
  ]

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Sidebar Toggle - Always visible for testing */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            title="Toggle Sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </Button>

          {/* Page Title */}
          <div className="flex items-center">
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-lg mx-4">
          {showSearch || location.pathname === '/history' ? (
            <div className="relative">
              <Input
                type="search"
                placeholder="Search audio sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setShowSearch(true)}
              className="w-full max-w-sm justify-start text-gray-700 dark:text-gray-300"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              Search sessions...
            </Button>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* PWA Install Button */}
          <PWAInstallButton />
          
          {/* Notifications */}
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="icon" className="relative">
                <BellIcon className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge
                    variant="error"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            }
            items={notifications.length === 0 ? [
              {
                label: 'No notifications',
                onClick: () => {},
                disabled: true
              }
            ] : [
              ...notifications.map((notification) => ({
                label: notification.title,
                onClick: () => {},
                icon: (
                  <div className={`w-2 h-2 rounded-full ${
                    notification.type === 'error' ? 'bg-red-500' :
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                )
              })),
              {
                label: 'Clear all notifications',
                onClick: clearNotifications,
                destructive: true
              }
            ]}
            align="right"
          />

          {/* Theme Selector */}
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="icon">
                {theme === 'light' && <SunIcon className="h-5 w-5" />}
                {theme === 'dark' && <MoonIcon className="h-5 w-5" />}
                {theme === 'auto' && <ComputerDesktopIcon className="h-5 w-5" />}
              </Button>
            }
            items={themeOptions}
            align="right"
          />

          {/* User Menu */}
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="icon">
                <UserCircleIcon className="h-6 w-6" />
              </Button>
            }
            items={userMenuOptions}
            align="right"
          />
        </div>
      </div>

      {/* Mobile Page Title */}
      <div className="md:hidden px-4 pb-3">
        <h1 className="text-lg font-medium text-gray-900 dark:text-white">
          {getPageTitle()}
        </h1>
      </div>
    </header>
  )
}
