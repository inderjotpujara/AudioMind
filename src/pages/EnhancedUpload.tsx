import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from '@/components/ui'
import { EnhancedAudioRecorder } from '@/components/features/enhanced-audio-recorder'
import { AudioUpload } from '@/components/features/audio-upload'
import { SimpleProcessingResult } from '@/lib/simple-processing'
import { useAudioSessionsStore } from '@/stores/audio-sessions'
import { useUserSettingsStore } from '@/stores/user-settings'
import { useUIStore } from '@/stores/ui'
import { motion, AnimatePresence } from 'framer-motion'

export default function EnhancedUpload() {
  const navigate = useNavigate()
  const { addSession } = useAudioSessionsStore()
  const { getGoogleApiKey } = useUserSettingsStore()
  const { addNotification } = useUIStore()
  
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('record')
  const [apiKey, setApiKey] = useState('')
  const [processingResult, setProcessingResult] = useState<SimpleProcessingResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleProcessingComplete = useCallback((result: SimpleProcessingResult) => {
    console.log('🎉 Processing complete in Upload page:', result)
    setProcessingResult(result)
    setShowResults(true)

    if (result.success && result.transcript) {
      // Create a new audio session
      const sessionData = {
        fileName: `Recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`,
        fileSize: 0, // We don't have the exact size here
        mimeType: 'audio/webm;codecs=opus',
        duration: result.duration / 1000, // Convert ms to seconds
        status: 'completed' as const,
        progress: 100,
        transcription: {
          provider: 'google' as const,
          model: 'latest_long',
          language: result.detectedLanguage || 'en-US',
          confidence: 0.9, // Default confidence
          transcript: result.transcript,
          segments: [],
        },
        summary: result.originalTranscript && result.originalTranscript !== result.transcript ? {
          summary: `Translated from ${result.translatedFrom}: ${result.transcript}`,
          keyPoints: [result.originalTranscript],
          topics: [],
          provider: 'google' as const,
          model: 'translate-v2',
          generatedAt: new Date(),
          confidence: 0.9,
          wordCount: result.transcript.split(' ').length,
          compressionRatio: 1,
        } : undefined,
        tasks: [],
        tags: result.translatedFrom ? ['translated', result.translatedFrom] : [],
        categories: [],
        isFavorite: false,
        customMetadata: {},
      }

      addSession(sessionData)

      addNotification({
        type: 'success',
        title: '🎉 Processing Complete!',
        message: result.translatedFrom 
          ? `Transcribed and translated from ${result.translatedFrom}`
          : 'Audio transcribed successfully',
      })

      // Navigate to the session after showing results
      setTimeout(() => {
        navigate('/history')
      }, 3000)
    } else {
      addNotification({
        type: 'error',
        title: 'Processing Failed',
        message: result.error || 'Unknown error occurred',
      })
    }
  }, [addSession, addNotification, navigate])

  const handleError = useCallback((error: string) => {
    console.error('❌ Upload page error:', error)
    addNotification({
      type: 'error',
      title: 'Error',
      message: error,
    })
  }, [addNotification])

  const handleFileUpload = useCallback((files: File[]) => {
    console.log('📁 Files uploaded:', files)
    // For now, just show a message that file upload integration is pending
    addNotification({
      type: 'info',
      title: 'File Upload',
      message: 'File upload integration coming soon. Please use the recorder for now.',
    })
  }, [addNotification])

  const currentApiKey = apiKey || getGoogleApiKey()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
            Audio Journal
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            AI-Powered Transcription & Translation
          </p>
        </div>
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>70+ Languages</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            <span>Real-time Processing</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
            <span>Auto Translation</span>
          </div>
        </div>
      </motion.div>

      {/* API Key Setup */}
      <AnimatePresence>
        {!currentApiKey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 dark:border-orange-700 shadow-lg">
              <CardHeader>
                <CardTitle className="text-orange-800 dark:text-orange-300 flex items-center">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔑
                  </motion.span>
                  <span className="ml-2">API Key Required</span>
                </CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-400">
                  Enter your Google Cloud API key to unlock AI-powered transcription and translation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Enter your Google API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full p-4 border-2 border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/50 transition-all duration-200"
                    />
                    {apiKey && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        <span className="text-green-500">✓</span>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-orange-100 dark:border-orange-800">
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">📋 Required APIs:</p>
                      <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Speech-to-Text API</li>
                        <li>• Translation API</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-orange-100 dark:border-orange-800">
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">🔗 Get API Key:</p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        Google Cloud Console → APIs & Services → Credentials
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <motion.div 
        className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={() => setActiveTab('record')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'record'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border dark:border-gray-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          🎙️ Record Audio
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'upload'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border dark:border-gray-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          📁 Upload Files
        </button>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'record' && (
          <motion.div
            key="record"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>🎙️ Audio Recorder</CardTitle>
                <CardDescription>
                  Record audio with multi-language support and automatic translation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedAudioRecorder
                  onProcessingComplete={handleProcessingComplete}
                  onError={handleError}
                  apiKey={currentApiKey || undefined}
                  maxDuration={14400} // 4 hours
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>📁 File Upload</CardTitle>
                <CardDescription>
                  Upload audio files for processing (MP3, WAV, WebM, M4A)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AudioUpload
                  multiple={true}
                  maxSize={500 * 1024 * 1024} // 500MB
                  onFilesSelected={handleFileUpload}
                  onError={handleError}
                />
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🚧 <strong>Coming Soon:</strong> File upload integration with the enhanced processing pipeline
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Results */}
      <AnimatePresence>
        {showResults && processingResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-300 flex items-center">
                  ✅ Processing Complete
                  <Button
                    onClick={() => setShowResults(false)}
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Language Info */}
                {processingResult.detectedLanguage && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">🔍 Detected Language:</span>
                      <span className="text-blue-700 dark:text-blue-400">{processingResult.detectedLanguage}</span>
                    </div>
                    {processingResult.translatedFrom && (
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">🌐 Translated from:</span>
                        <span className="text-blue-700 dark:text-blue-400">{processingResult.translatedFrom}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Original Transcript */}
                {processingResult.originalTranscript && processingResult.originalTranscript !== processingResult.transcript && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">📝 Original Transcript:</p>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-700 dark:text-gray-300">{processingResult.originalTranscript}</p>
                    </div>
                  </div>
                )}

                {/* Final Transcript */}
                <div>
                  {processingResult.translatedFrom && (
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">🔄 Translated Transcript:</p>
                  )}
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-800 dark:text-gray-200">{processingResult.transcript}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => navigator.clipboard.writeText(processingResult.transcript || '')}
                    size="sm"
                  >
                    📋 Copy Final
                  </Button>
                  {processingResult.originalTranscript && processingResult.originalTranscript !== processingResult.transcript && (
                    <Button 
                      onClick={() => navigator.clipboard.writeText(processingResult.originalTranscript || '')}
                      variant="outline"
                      size="sm"
                    >
                      📋 Copy Original
                    </Button>
                  )}
                  <Button 
                    onClick={() => navigate('/history')}
                    variant="outline"
                    size="sm"
                  >
                    📚 View in History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>💡 How to Use</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">🎙️ Recording:</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Select input language (or auto-detect)</li>
                  <li>• Choose output language for translation</li>
                  <li>• Click record and speak clearly</li>
                  <li>• Stop when finished</li>
                  <li>• Click "Process Audio" to transcribe</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">🌐 Language Support:</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• 70+ languages supported</li>
                  <li>• Mixed language detection (English+Hindi)</li>
                  <li>• Automatic translation between languages</li>
                  <li>• Regional variants (US/UK English, etc.)</li>
                  <li>• Copy both original and translated text</li>
                </ul>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
