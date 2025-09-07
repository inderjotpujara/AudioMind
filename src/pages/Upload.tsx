import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Cog6ToothIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  MicrophoneIcon,
  // XCircleIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Switch,
  // Badge,
  Progress,
  Modal,
  toast,
} from '@/components/ui'
import { AudioUpload } from '@/components/features/audio-upload'
import { AudioRecorder } from '@/components/features/audio-recorder'
import { useAudioSessionsStore } from '@/stores/audio-sessions'
import { useUserSettingsStore } from '@/stores/user-settings'
import { useUIStore } from '@/stores/ui'
import { AudioProcessingService } from '@/lib/audio-processing'
import { ProcessingOptions, ProcessingStatus } from '@/types'
import { formatFileSize, cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { backgroundProcessor } from '@/lib/background-processor'

export default function Upload() {
  const navigate = useNavigate()
  const { addSession, updateSession } = useAudioSessionsStore()
  const { getGoogleApiKey, defaultLanguage } = useUserSettingsStore()
  const { addNotification } = useUIStore()
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload')
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    language: defaultLanguage,
    enableSpeakerDiarization: true,
    enablePunctuation: true,
    enableWordTimestamps: true,
    generateSummary: true,
    extractTasks: true,
    summaryLength: 'medium',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [processingResults, setProcessingResults] = useState<any[]>([])
  const [processingCancelled, setProcessingCancelled] = useState(false)

  const apiKey = getGoogleApiKey()
  const processingService = new AudioProcessingService(apiKey || undefined)

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files && files.length > 0) {
      setSelectedFiles(files)
      toast.success(`Selected ${files.length} file(s)`)
    } else {
      toast.error('No valid files selected')
    }
  }, [])

  const handleFileError = useCallback((error: string) => {
    toast.error(error)
  }, [])

  const handleRecordingComplete = useCallback((audioBlob: Blob, duration: number) => {
    // Create a File object from the recorded Blob
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const recordedFile = new File(
      [audioBlob], 
      `recording-${timestamp}.webm`, 
      { 
        type: 'audio/webm',
        lastModified: Date.now()
      }
    )

    // Add to selected files
    setSelectedFiles(prev => [...prev, recordedFile])
    toast.success(`Recording saved (${Math.round(duration)}s)`)
    
    // Switch to upload tab to show the recorded file
    setActiveTab('upload')
  }, [])

  const handleRecordingError = useCallback((error: string) => {
    toast.error(`Recording failed: ${error}`)
  }, [])

  const handleCancelProcessing = useCallback(() => {
    setProcessingCancelled(true)
    setIsProcessing(false)
    toast.info('Processing cancelled by user')
  }, [])

  const estimateProcessingCost = useCallback(() => {
    if (selectedFiles.length === 0) return { total: 0, breakdown: [] }

    const totalMinutes = selectedFiles.reduce((acc, file) => {
      // Rough estimate: 1MB ≈ 1 minute of audio
      return acc + (file.size / (1024 * 1024))
    }, 0)

    return processingService.estimateProcessingCost(totalMinutes)
  }, [selectedFiles, processingService])

  const processFiles = async () => {
    if (!apiKey) {
      toast.error('Please configure your Google API key in settings first')
      navigate('/settings')
      return
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one audio file')
      return
    }

    // Always use background processing to prevent UI blocking
    // This ensures the UI stays responsive regardless of file size or count
    const shouldProcessInBackground = true

    if (shouldProcessInBackground) {
      // Setup background processor with the processing service
      const processingService = new AudioProcessingService(apiKey)
      backgroundProcessor.setProcessingService(processingService)
      
      // Start background processing
      const sessionIds = await backgroundProcessor.addToQueue(selectedFiles)
      
      // Show notification and allow navigation
      addNotification({
        type: 'success',
        title: '🚀 Background Processing Started',
        message: `Processing ${selectedFiles.length} file(s) in background. UI stays fully responsive! You'll be notified when complete.`,
        duration: 8000, // Show for 8 seconds
        action: {
          label: 'View Queue',
          onClick: () => navigate('/processing-queue')
        }
      })
      
      // Clear selected files
      setSelectedFiles([])
      
      // Navigate to dashboard or queue
      toast.success('🎉 Files queued for background processing! Navigate freely while processing.')
      navigate('/processing-queue')
      return
    }

    // Process files with non-blocking async processing
    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingResults([])
    setProcessingCancelled(false) // Reset cancellation flag
    
    const results: Array<{ file: File; session: any; result: any }> = []

    // Process files one by one with yielding control to prevent UI blocking
    const processFilesAsync = async () => {
      for (let i = 0; i < selectedFiles.length; i++) {
        // Check if processing was cancelled
        if (processingCancelled) {
          setProcessingStage('Processing cancelled')
          break
        }
        
        const file = selectedFiles[i]
        if (!file) continue
        
        try {
          // Create session
          const session = addSession({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            duration: 0, // Will be updated after metadata extraction
            status: ProcessingStatus.UPLOADING,
            progress: 0,
            tasks: [],
            tags: [],
            categories: [],
            isFavorite: false,
            customMetadata: {},
          })

          // Yield control to browser to prevent UI blocking
          await new Promise(resolve => setTimeout(resolve, 10))

          // Process the file
          const result = await processingService.processAudio(
            file,
            processingOptions,
            (progress, stage, status) => {
              const overallProgress = ((i / selectedFiles.length) + (progress / 100 / selectedFiles.length)) * 100
              setProcessingProgress(overallProgress)
              setProcessingStage(`${stage} (${i + 1}/${selectedFiles.length})`)
              
              updateSession(session.id, {
                progress,
                status,
              })
            }
          )

          if (result.success) {
            // Update session with results
            updateSession(session.id, {
              status: ProcessingStatus.COMPLETED,
              progress: 100,
              ...(result.transcription && { transcription: result.transcription }),
              ...(result.summary && { summary: result.summary }),
              tasks: result.tasks || [],
              duration: result.metadata?.duration || 0,
              processedAt: new Date(),
            })

            results.push({ file, session, result })
            toast.success(`Successfully processed ${file.name}`)
          } else {
            updateSession(session.id, {
              status: ProcessingStatus.FAILED,
              progress: 0,
            })
            
            toast.error(`Failed to process ${file.name}: ${result.error}`)
          }

          // Yield control between files to keep UI responsive
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error) {
          console.error('Processing error:', error)
          toast.error(`Error processing ${file.name}`)
          
          // Yield control even on error
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // All files processed
      setProcessingResults(results)
      setIsProcessing(false)
      setProcessingProgress(100)
      setProcessingStage('Complete')

      if (results.length > 0) {
        toast.success(`Successfully processed ${results.length} file(s)`)
        
        // Navigate to the first successful result
        setTimeout(() => {
          navigate(`/session/${results[0]?.session.id}`)
        }, 2000)
      }
    }

    // Start async processing
    processFilesAsync().catch(error => {
      console.error('Async processing error:', error)
      setIsProcessing(false)
      toast.error('Processing failed unexpectedly')
    })
  }

  const costEstimate = estimateProcessingCost()

  const supportedLanguages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Upload Audio Files
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Transform your audio recordings into structured insights with AI-powered transcription and analysis
        </p>
      </div>

      {/* API Key Warning */}
      {!apiKey && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Google API Key Required
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Please configure your Google Cloud API key to enable audio processing.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300"
                >
                  Go to Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Audio Input Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audio Input</CardTitle>
              <CardDescription>
                Upload files or record audio directly in your browser
              </CardDescription>
              {!apiKey && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Google API key not configured. <Button variant="link" className="p-0 h-auto text-yellow-800 dark:text-yellow-200" onClick={() => navigate('/settings')}>Configure now</Button>
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('upload')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                activeTab === 'upload'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              📁 Upload Files
            </button>
            <button
              onClick={() => setActiveTab('record')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                activeTab === 'record'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              🎤 Record Audio
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <AudioUpload
                  onFilesSelected={handleFilesSelected}
                  onError={handleFileError}
                  multiple={true}
                  maxFiles={5}
                  disabled={isProcessing}
                />
              </motion.div>
            )}

            {activeTab === 'record' && (
              <motion.div
                key="record"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  onError={handleRecordingError}
                  maxDuration={14400} // 4 hours maximum
                  showAudioLevel={false} // Disabled for better performance - prevents UI blocking
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing Options Preview */}
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Processing Configuration
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Language:</span>
                  <p className="font-medium">
                    {supportedLanguages.find(l => l.code === processingOptions.language)?.name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Speaker ID:</span>
                  <p className="font-medium">
                    {processingOptions.enableSpeakerDiarization ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Summary:</span>
                  <p className="font-medium">
                    {processingOptions.generateSummary ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Tasks:</span>
                  <p className="font-medium">
                    {processingOptions.extractTasks ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>

              {costEstimate.total > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Estimated Cost:</strong> ${costEstimate.total.toFixed(4)}
                    {'speechToText' in costEstimate && 'naturalLanguage' in costEstimate && (
                      <span className="text-blue-600 dark:text-blue-300 ml-2">
                        (Speech: ${costEstimate.speechToText.toFixed(4)}, 
                        NL: ${costEstimate.naturalLanguage.toFixed(4)})
                      </span>
                    )}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Processing Section */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3" />
                  Processing Audio Files
                </CardTitle>
                <CardDescription>
                  {processingStage}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={processingProgress} showValue className="mb-4" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>This may take a few minutes depending on file size and complexity.</p>
                    <p className="mt-1">✅ UI is now responsive - you can navigate freely while processing!</p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelProcessing}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {processingResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  Processing Complete
                </CardTitle>
                <CardDescription>
                  Successfully processed {processingResults.length} file(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processingResults.map(({ file, session, result }) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatFileSize(file.size)} • {result.processingTime / 1000}s processing time
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/session/${session.id}`)}
                      >
                        View Results
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {selectedFiles.length > 0 && !isProcessing && (
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setSelectedFiles([])}
          >
            Clear Files
          </Button>
          
          <Button
            onClick={processFiles}
            disabled={!apiKey || selectedFiles.length === 0}
            className="min-w-32"
          >
            Process {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Processing Settings"
        size="lg"
      >
        <div className="space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              value={processingOptions.language}
              onChange={(e) => setProcessingOptions(prev => ({ ...prev, language: e.target.value }))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Processing Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Processing Features
            </h4>
            
            <Switch
              checked={processingOptions.enableSpeakerDiarization}
              onChange={(checked) => setProcessingOptions(prev => ({ ...prev, enableSpeakerDiarization: checked }))}
              label="Speaker Diarization"
              description="Identify and separate different speakers in the audio"
            />
            
            <Switch
              checked={processingOptions.enablePunctuation}
              onChange={(checked) => setProcessingOptions(prev => ({ ...prev, enablePunctuation: checked }))}
              label="Automatic Punctuation"
              description="Add punctuation marks to the transcription"
            />
            
            <Switch
              checked={processingOptions.enableWordTimestamps}
              onChange={(checked) => setProcessingOptions(prev => ({ ...prev, enableWordTimestamps: checked }))}
              label="Word Timestamps"
              description="Include timing information for each word"
            />
            
            <Switch
              checked={processingOptions.generateSummary}
              onChange={(checked) => setProcessingOptions(prev => ({ ...prev, generateSummary: checked }))}
              label="Generate Summary"
              description="Create an AI-powered summary of the content"
            />
            
            <Switch
              checked={processingOptions.extractTasks}
              onChange={(checked) => setProcessingOptions(prev => ({ ...prev, extractTasks: checked }))}
              label="Extract Tasks"
              description="Automatically identify actionable items and tasks"
            />
          </div>

          {/* Summary Length */}
          {processingOptions.generateSummary && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Summary Length
              </label>
              <select
                value={processingOptions.summaryLength}
                onChange={(e) => setProcessingOptions(prev => ({ 
                  ...prev, 
                  summaryLength: e.target.value as 'short' | 'medium' | 'long'
                }))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="short">Short (1-2 sentences)</option>
                <option value="medium">Medium (1 paragraph)</option>
                <option value="long">Long (detailed summary)</option>
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowSettings(false)}>
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
