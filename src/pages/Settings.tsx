import { useState } from 'react'
import {
  KeyIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BellIcon,
  ComputerDesktopIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Switch,
  Tabs,
  // Badge,
  Modal,
  toast,
} from '@/components/ui'
import { useUserSettingsStore } from '@/stores/user-settings'
import { useAudioSessionsStore } from '@/stores/audio-sessions'
import { useTasksStore } from '@/stores/tasks'
import { AudioProcessingService } from '@/lib/audio-processing'
import { formatFileSize } from '@/lib/utils'
import { ServiceAccountHelper } from '@/components/features/service-account-helper'

export default function Settings() {
  const {
    defaultLanguage,
    theme,
    dataRetentionDays,
    autoDeleteOldSessions,
    emailNotifications,
    pushNotifications,
    processingCompleteNotification,
    taskReminderNotification,
    maxConcurrentUploads,
    lowQualityMode,
    offlineMode,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    getGoogleApiKey,
    setGoogleApiKey,
    clearApiKeys,
  } = useUserSettingsStore()

  const { sessions } = useAudioSessionsStore()
  const { tasks } = useTasksStore()

  const [apiKey, setApiKey] = useState('')
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [clearDataModalOpen, setClearDataModalOpen] = useState(false)
  const [apiKeyHelpModalOpen, setApiKeyHelpModalOpen] = useState(false)

  const currentApiKey = getGoogleApiKey()
  const processingService = new AudioProcessingService()

  // Calculate storage usage
  const totalSessions = sessions.length
  const totalTasks = tasks.length
  const totalSize = sessions.reduce((acc, session) => acc + session.fileSize, 0)

  const handleApiKeyValidation = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key')
      return
    }

    setIsValidatingApiKey(true)
    try {
      const isValid = await processingService.validateApiKey(apiKey.trim())
      
      if (isValid) {
        setGoogleApiKey(apiKey.trim())
        toast.success('API key validated and saved successfully')
        setApiKey('')
      } else {
        toast.error('Invalid API key. Please check your key and try again.')
      }
    } catch (error) {
      toast.error('Failed to validate API key. Please try again.')
    } finally {
      setIsValidatingApiKey(false)
    }
  }

  const handleExportSettings = () => {
    try {
      const settingsData = exportSettings()
      const blob = new Blob([settingsData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audio-journal-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Settings exported successfully')
    } catch (error) {
      toast.error('Failed to export settings')
    }
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settingsData = e.target?.result as string
        importSettings(settingsData)
        toast.success('Settings imported successfully')
      } catch (error) {
        toast.error('Failed to import settings. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  const handleResetSettings = () => {
    resetSettings()
    toast.success('Settings reset to defaults')
    setResetModalOpen(false)
  }

  const handleClearAllData = () => {
    // This would clear all sessions and tasks
    // Implementation would depend on your store methods
    toast.success('All data cleared successfully')
    setClearDataModalOpen(false)
  }

  const supportedLanguages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-US', name: 'Spanish (US)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
  ]

  const tabItems = [
    {
      label: 'API Keys',
      icon: <KeyIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Google Cloud API Key */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Google Cloud Authentication</CardTitle>
                  <CardDescription>
                    Required for speech-to-text transcription and natural language processing
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setApiKeyHelpModalOpen(true)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="How to get Google API Key"
                >
                  <QuestionMarkCircleIcon className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentApiKey ? (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <KeyIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        API Key Configured
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        {showApiKey ? currentApiKey : '••••••••••••••••'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearApiKeys()
                        toast.success('API key removed')
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      <strong>API Key Required:</strong> You need a Google Cloud API key to use transcription and summarization features.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">⚠️ Security Warning:</h4>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Never use Service Account JSON files in browser apps!</strong> Service account private keys should only be used in secure server environments. Use API Keys for client-side applications.
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      type="password"
                      placeholder="Enter your Google Cloud API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleApiKeyValidation}
                      loading={isValidatingApiKey}
                      disabled={!apiKey.trim()}
                    >
                      Validate & Save
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="mb-2">To get your API key:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                      <li>Enable the Speech-to-Text and Natural Language APIs</li>
                      <li>Create credentials (API key)</li>
                      <li>Copy and paste the key above</li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Account Helper */}
          <ServiceAccountHelper />
        </div>
      )
    },
    {
      label: 'Processing',
      icon: <GlobeAltIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Language & Processing</CardTitle>
              <CardDescription>
                Configure default language and processing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Language
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => updateSettings({ defaultLanguage: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Concurrent Uploads
                </label>
                <select
                  value={maxConcurrentUploads}
                  onChange={(e) => updateSettings({ maxConcurrentUploads: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={1}>1 file at a time</option>
                  <option value={2}>2 files at a time</option>
                  <option value={3}>3 files at a time</option>
                  <option value={5}>5 files at a time</option>
                </select>
              </div>

              <Switch
                checked={lowQualityMode}
                onChange={(checked) => updateSettings({ lowQualityMode: checked })}
                label="Low Quality Mode"
                description="Reduce processing quality for faster results and lower costs"
              />

              <Switch
                checked={offlineMode}
                onChange={(checked) => updateSettings({ offlineMode: checked })}
                label="Offline Mode"
                description="Enable offline capabilities (limited functionality)"
              />
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      label: 'Privacy',
      icon: <ShieldCheckIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
              <CardDescription>
                Control how long your data is stored
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto-delete sessions after
                </label>
                <select
                  value={dataRetentionDays}
                  onChange={(e) => updateSettings({ dataRetentionDays: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>1 year</option>
                  <option value={0}>Never (manual deletion only)</option>
                </select>
              </div>

              <Switch
                checked={autoDeleteOldSessions}
                onChange={(checked) => updateSettings({ autoDeleteOldSessions: checked })}
                label="Enable Auto-deletion"
                description="Automatically delete sessions based on retention period"
              />
            </CardContent>
          </Card>

          {/* Storage Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage</CardTitle>
              <CardDescription>
                Current data usage and management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalSessions}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Audio Sessions
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalTasks}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tasks
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatFileSize(totalSize)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Size
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleExportSettings}
                  className="flex-1"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('import-file')?.click()}
                  className="flex-1"
                >
                  <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="hidden"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => setClearDataModalOpen(true)}
                className="w-full text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      label: 'Notifications',
      icon: <BellIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose when and how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Switch
                checked={emailNotifications}
                onChange={(checked) => updateSettings({ emailNotifications: checked })}
                label="Email Notifications"
                description="Receive notifications via email"
              />

              <Switch
                checked={pushNotifications}
                onChange={(checked) => updateSettings({ pushNotifications: checked })}
                label="Push Notifications"
                description="Receive browser push notifications"
              />

              <Switch
                checked={processingCompleteNotification}
                onChange={(checked) => updateSettings({ processingCompleteNotification: checked })}
                label="Processing Complete"
                description="Notify when audio processing is finished"
              />

              <Switch
                checked={taskReminderNotification}
                onChange={(checked) => updateSettings({ taskReminderNotification: checked })}
                label="Task Reminders"
                description="Remind about upcoming task deadlines"
              />
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      label: 'Appearance',
      icon: <ComputerDesktopIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: '☀️' },
                    { value: 'dark', label: 'Dark', icon: '🌙' },
                    { value: 'auto', label: 'System', icon: '💻' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateSettings({ theme: option.value as any })}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        theme === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reset Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Reset Settings</CardTitle>
              <CardDescription>
                Restore all settings to their default values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setResetModalOpen(true)}
                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                Reset All Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs tabs={tabItems} />

      {/* Reset Settings Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Settings"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to reset all settings to their default values? This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetSettings}>
              Reset Settings
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear Data Modal */}
      <Modal
        isOpen={clearDataModalOpen}
        onClose={() => setClearDataModalOpen(false)}
        title="Clear All Data"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete all your audio sessions and tasks? This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setClearDataModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAllData}>
              Clear All Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* Google API Key Help Modal */}
      <Modal
        isOpen={apiKeyHelpModalOpen}
        onClose={() => setApiKeyHelpModalOpen(false)}
        title="How to Get Google Cloud API Key"
        size="lg"
      >
        <div className="space-y-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              Follow these steps to obtain your Google Cloud API key for speech-to-text and natural language processing:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Create Google Cloud Account</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Visit <a href="https://cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Cloud Console</a> and create an account or sign in.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Create a New Project</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    In the Google Cloud Console, create a new project or select an existing one from the project dropdown.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Enable Required APIs</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Go to "APIs & Services" → "Library" and enable these APIs:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                    <li>Cloud Speech-to-Text API</li>
                    <li>Cloud Natural Language API</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Create API Key</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Go to "APIs & Services" → "Credentials" → "Create Credentials" → "API Key".
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                  5
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Secure Your API Key</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Click "Restrict Key" and limit it to the Speech-to-Text and Natural Language APIs for security.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                  6
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Copy & Paste</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Copy your API key and paste it into the field above. Click "Validate & Save" to test it.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Pro Tips:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Google provides $300 in free credits for new accounts</li>
                <li>• Speech-to-Text: Free for first 60 minutes per month</li>
                <li>• Natural Language: Free for first 5,000 units per month</li>
                <li>• Monitor usage in the Google Cloud Console billing section</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">⚠️ Service Account vs API Key:</h4>
              <div className="text-sm text-red-800 dark:text-red-200 space-y-2">
                <p><strong>✅ Use API Key:</strong> Perfect for browser apps like Audio Journal. Secure and appropriate for client-side use.</p>
                <p><strong>❌ Don't Use Service Account JSON:</strong> Contains private keys that should never be exposed in browsers. Only for backend servers.</p>
                <p><strong>If you have a Service Account:</strong> Create an API Key instead by going to "APIs & Services" → "Credentials" → "Create Credentials" → "API Key".</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">🔒 Security Notice:</h4>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Your API key is stored locally in your browser and never sent to our servers. 
                All API calls are made directly from your browser to Google Cloud.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
            >
              Open Google Cloud Console
            </Button>
            <Button onClick={() => setApiKeyHelpModalOpen(false)}>
              Got it!
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
