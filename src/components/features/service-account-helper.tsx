import { useState } from 'react'
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { extractProjectInfo } from '@/lib/service-account-helper'

export function ServiceAccountHelper() {
  const [jsonInput, setJsonInput] = useState('')
  const [projectInfo, setProjectInfo] = useState<{
    projectId: string
    clientEmail: string
    warning: string
  } | null>(null)
  const [error, setError] = useState('')

  const handleAnalyzeJson = () => {
    try {
      setError('')
      const info = extractProjectInfo(jsonInput)
      setProjectInfo(info)
    } catch (err) {
      setError('Invalid JSON format. Please paste a valid service account JSON.')
      setProjectInfo(null)
    }
  }

  const clearData = () => {
    setJsonInput('')
    setProjectInfo(null)
    setError('')
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-900 dark:text-orange-100">
          <InformationCircleIcon className="h-5 w-5" />
          <span>Service Account Helper</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-medium">Security Warning:</p>
              <p>This tool only extracts your project ID locally. Never share your service account JSON file!</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Paste your service account JSON (optional - to get project ID):
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your service account JSON here..."
            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleAnalyzeJson} disabled={!jsonInput.trim()}>
            Extract Project Info
          </Button>
          <Button variant="outline" onClick={clearData}>
            Clear
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {projectInfo && (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{projectInfo.warning}</p>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p><strong>Project ID:</strong> {projectInfo.projectId}</p>
                  <p><strong>Service Account:</strong> {projectInfo.clientEmail}</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                  <li>Select project: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{projectInfo.projectId}</code></li>
                  <li>Navigate to "APIs & Services" → "Credentials"</li>
                  <li>Click "Create Credentials" → "API Key"</li>
                  <li>Restrict the key to Speech-to-Text and Natural Language APIs</li>
                  <li>Copy the API key and paste it in the settings above</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
