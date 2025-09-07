import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MicrophoneIcon,
  StopIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Button, Progress, Badge } from '@/components/ui'
import { SimpleAudioProcessor, SimpleProcessingOptions, SimpleProcessingResult } from '@/lib/simple-processing'
import { getLanguageOptions, getPopularLanguages } from '@/lib/language-config'
import { cn, formatDuration } from '@/lib/utils'

interface EnhancedAudioRecorderProps {
  onProcessingComplete?: (result: SimpleProcessingResult) => void
  onError?: (error: string) => void
  maxDuration?: number
  apiKey?: string
  className?: string
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'processing'

export function EnhancedAudioRecorder({
  onProcessingComplete,
  onError,
  maxDuration = 14400, // 4 hours
  apiKey,
  className
}: EnhancedAudioRecorderProps) {
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  
  // Language settings
  const [inputLanguage, setInputLanguage] = useState('auto')
  const [outputLanguage, setOutputLanguage] = useState('en')
  const [enableTranslation, setEnableTranslation] = useState(true)
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = useCallback(async () => {
    try {
      console.log('🎙️ Starting enhanced recording...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        } 
      })
      
      streamRef.current = stream
      chunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          console.log('📊 Data chunk received:', event.data.size)
        }
      }
      
      mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped, creating blob...')
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        console.log('💾 Blob created:', blob.size, 'bytes')
        setAudioBlob(blob)
        setRecordingState('stopped')
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }
      
      mediaRecorder.start(1000) // Collect data every second
      setRecordingState('recording')
      setDuration(0)
      
      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)
      
      console.log('✅ Enhanced recording started successfully')
      
    } catch (error) {
      console.error('❌ Recording start failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording'
      onError?.(errorMessage)
    }
  }, [maxDuration, onError])

  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping enhanced recording...')
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('⏹️ Calling MediaRecorder.stop()')
      mediaRecorderRef.current.stop()
    }
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setRecordingState('paused')
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setRecordingState('recording')
      
      // Resume timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)
    }
  }, [maxDuration, stopRecording])

  const processAudio = useCallback(async () => {
    if (!audioBlob || !apiKey?.trim()) {
      onError?.('No audio to process or API key missing')
      return
    }

    console.log('🚀 Starting audio processing...')
    setIsProcessing(true)
    setProgress(0)
    setProgressMessage('Starting...')

    try {
      const processor = new SimpleAudioProcessor(apiKey.trim())
      
      const options: SimpleProcessingOptions = {
        inputLanguage,
        outputLanguage,
        enableTranslation
      }
      
      const result = await processor.processAudio(
        audioBlob,
        options,
        (progress, message) => {
          console.log(`📊 Progress: ${progress}% - ${message}`)
          setProgress(progress)
          setProgressMessage(message)
        }
      )

      console.log('🎯 Processing result:', result)
      onProcessingComplete?.(result)

    } catch (error) {
      console.error('❌ Processing failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Processing failed'
      onError?.(errorMessage)
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setProgressMessage('')
    }
  }, [audioBlob, apiKey, inputLanguage, outputLanguage, enableTranslation, onProcessingComplete, onError])

  const resetRecording = useCallback(() => {
    console.log('🔄 Resetting recording...')
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    mediaRecorderRef.current = null
    chunksRef.current = []
    setRecordingState('idle')
    setDuration(0)
    setAudioBlob(null)
    setIsProcessing(false)
    setProgress(0)
    setProgressMessage('')
  }, [])

  const playRecording = useCallback(() => {
    if (!audioBlob) return
    
    console.log('🔊 Playing recording...')
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
      console.log('🔇 Playback finished')
    }
    
    audio.onerror = (error) => {
      console.error('❌ Playback error:', error)
      URL.revokeObjectURL(audioUrl)
    }
    
    audio.play().catch(error => {
      console.error('❌ Failed to play:', error)
      URL.revokeObjectURL(audioUrl)
    })
  }, [audioBlob])

  const getMainButtonConfig = () => {
    switch (recordingState) {
      case 'idle':
        return {
          icon: MicrophoneIcon,
          label: 'Start Recording',
          onClick: startRecording,
          className: 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white border-2 border-red-400 dark:border-red-500',
          disabled: false
        }
      case 'recording':
        return {
          icon: StopIcon,
          label: 'Stop Recording',
          onClick: stopRecording,
          className: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white animate-pulse border-2 border-red-500 dark:border-red-600',
          disabled: false
        }
      case 'paused':
        return {
          icon: PlayIcon,
          label: 'Resume Recording',
          onClick: resumeRecording,
          className: 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-2 border-orange-400 dark:border-orange-500',
          disabled: false
        }
      case 'stopped':
        return {
          icon: CheckCircleIcon,
          label: 'Recording Complete',
          onClick: () => {},
          className: 'bg-green-500 dark:bg-green-600 text-white cursor-default border-2 border-green-400 dark:border-green-500',
          disabled: true
        }
      default:
        return {
          icon: MicrophoneIcon,
          label: 'Start Recording',
          onClick: startRecording,
          className: 'bg-gray-500 dark:bg-gray-600 text-white border-2 border-gray-400 dark:border-gray-500',
          disabled: true
        }
    }
  }

  const buttonConfig = getMainButtonConfig()
  const Icon = buttonConfig.icon

  return (
    <div className={cn('space-y-6', className)}>
      {/* Language Settings */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              🎤 Audio Language (What you speak)
            </label>
            <select
              value={inputLanguage}
              onChange={(e) => setInputLanguage(e.target.value)}
              className={cn(
                "w-full p-3 border rounded-lg transition-all duration-200",
                "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                "border-gray-300 dark:border-gray-600",
                "focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400",
                (recordingState === 'recording' || isProcessing) && "opacity-50 cursor-not-allowed"
              )}
              disabled={recordingState === 'recording' || isProcessing}
            >
              {getLanguageOptions().map(option => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.value === '---'}
                  className={option.value === '---' ? 'font-bold text-gray-500' : ''}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              📝 Output Language (What you want to read)
            </label>
            <select
              value={outputLanguage}
              onChange={(e) => setOutputLanguage(e.target.value)}
              className={cn(
                "w-full p-3 border rounded-lg transition-all duration-200",
                "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                "border-gray-300 dark:border-gray-600",
                "focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400",
                (recordingState === 'recording' || isProcessing) && "opacity-50 cursor-not-allowed"
              )}
              disabled={recordingState === 'recording' || isProcessing}
            >
              {getLanguageOptions().filter(opt => opt.value !== 'auto' && opt.value !== '---').map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Translation Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableTranslation"
              checked={enableTranslation}
              onChange={(e) => setEnableTranslation(e.target.checked)}
              className="w-4 h-4 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
              disabled={recordingState === 'recording' || isProcessing}
            />
            <label htmlFor="enableTranslation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              🔄 Enable automatic translation
            </label>
          </div>
          <Badge variant={enableTranslation ? "default" : "secondary"} className="text-xs">
            {enableTranslation ? "ON" : "OFF"}
          </Badge>
        </div>
      </motion.div>

      {/* Popular Languages Quick Select */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">🔥 Quick Select Languages:</p>
        <div className="flex flex-wrap gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputLanguage('auto')}
              className={cn(
                "transition-all duration-200 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
                inputLanguage === 'auto' 
                  ? 'bg-blue-100 dark:bg-blue-950/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 shadow-sm' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
              disabled={recordingState === 'recording' || isProcessing}
            >
              🌐 Auto-detect
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputLanguage('en-hi')}
              className={cn(
                "transition-all duration-200 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
                inputLanguage === 'en-hi' 
                  ? 'bg-purple-100 dark:bg-purple-950/30 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-400 shadow-sm' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
              disabled={recordingState === 'recording' || isProcessing}
            >
              🔀 English + Hindi
            </Button>
          </motion.div>
          
          {getPopularLanguages().slice(0, 6).map(lang => (
            <motion.div 
              key={lang.code} 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputLanguage(lang.code)}
                className={cn(
                  "transition-all duration-200 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
                  inputLanguage === lang.code 
                    ? 'bg-green-100 dark:bg-green-950/30 border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 shadow-sm' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
                disabled={recordingState === 'recording' || isProcessing}
              >
                {lang.nativeName}
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recording Controls */}
      <motion.div 
        className="flex flex-col items-center space-y-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Main Recording Button */}
        <div className="relative">
          {/* Pulse animation for recording */}
          {recordingState === 'recording' && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-400 dark:bg-red-500"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
          
          <motion.div
            whileHover={{ 
              scale: recordingState === 'idle' ? 1.05 : 1,
              rotate: recordingState === 'recording' ? [0, 1, -1, 0] : 0
            }}
            whileTap={{ scale: recordingState === 'idle' ? 0.95 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={buttonConfig.onClick}
              disabled={buttonConfig.disabled || isProcessing}
              className={cn(
                'w-28 h-28 rounded-full flex flex-col items-center justify-center text-sm font-medium transition-all duration-300 shadow-lg',
                buttonConfig.className,
                recordingState === 'recording' && 'shadow-red-200 dark:shadow-red-900/50 shadow-xl',
                recordingState === 'stopped' && 'shadow-green-200 dark:shadow-green-900/50 shadow-xl'
              )}
            >
              <Icon className="w-10 h-10 mb-1" />
              <span className="text-xs font-semibold">{buttonConfig.label}</span>
            </Button>
          </motion.div>
        </div>

        {/* Recording Info */}
        <motion.div 
          className="text-center space-y-2"
          animate={{
            scale: recordingState === 'recording' ? [1, 1.02, 1] : 1
          }}
          transition={{
            duration: 1,
            repeat: recordingState === 'recording' ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <div className="text-3xl font-mono font-bold text-gray-800 dark:text-gray-200">
            {formatDuration(duration)}
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Badge 
              variant={
                recordingState === 'recording' ? 'error' :
                recordingState === 'stopped' ? 'success' :
                recordingState === 'paused' ? 'secondary' : 'outline'
              }
              className="text-xs px-3 py-1"
            >
              {recordingState === 'recording' && '🔴 Recording'}
              {recordingState === 'paused' && '⏸️ Paused'}
              {recordingState === 'stopped' && '✅ Ready to process'}
              {recordingState === 'idle' && '⚪ Ready to record'}
            </Badge>
            {duration > 0 && (
              <Badge variant="outline" className="text-xs">
                {Math.round(duration / 60)}m {duration % 60}s
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Secondary Controls */}
        <AnimatePresence>
          {recordingState === 'recording' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex space-x-2"
            >
              <Button
                onClick={pauseRecording}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <PauseIcon className="w-4 h-4" />
                <span>Pause</span>
              </Button>
            </motion.div>
          )}

          {recordingState === 'stopped' && audioBlob && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex space-x-2"
            >
              <Button
                onClick={playRecording}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <PlayIcon className="w-4 h-4" />
                <span>Play</span>
              </Button>
              
              {apiKey && (
                <Button
                  onClick={processAudio}
                  disabled={isProcessing}
                  className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing...' : 'Process Audio'}</span>
                </Button>
              )}
              
              <Button
                onClick={resetRecording}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Reset</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Processing Progress */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <Badge variant="default" className="mb-2 bg-blue-500 text-white px-4 py-2">
                  🔄 Processing Audio
                </Badge>
              </motion.div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">{progressMessage}</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{progress}%</span>
              </div>
              <Progress 
                value={progress} 
                className="w-full h-2 bg-white/50 dark:bg-gray-800/50" 
              />
            </div>
            
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1 text-green-600">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ✅
                </motion.div>
                <span>UI responsive</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-600">
                <motion.div
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  🔄
                </motion.div>
                <span>AI processing</span>
              </div>
              <div className="flex items-center space-x-1 text-purple-600">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🌐
                </motion.div>
                <span>Multi-language</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Stats */}
      {audioBlob && (
        <motion.div 
          className="text-center text-sm text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>Recording: {Math.round(audioBlob.size / 1024)}KB • {formatDuration(duration)}</p>
        </motion.div>
      )}
    </div>
  )
}
