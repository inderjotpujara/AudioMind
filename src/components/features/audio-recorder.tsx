import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MicrophoneIcon,
  StopIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Button, Progress, Badge } from '@/components/ui'
import { cn, formatDuration } from '@/lib/utils'

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  onError?: (error: string) => void
  maxDuration?: number // in seconds
  showAudioLevel?: boolean // Enable/disable audio level monitoring for performance
  className?: string
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'processing'

export function AudioRecorder({
  onRecordingComplete,
  onError,
  maxDuration = 14400, // 4 hours default (maximum practical limit)
  showAudioLevel = true, // Enable by default, can be disabled for performance
  className
}: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isPlayingPreview, setIsPlayingPreview] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    
    analyserRef.current = null
    mediaRecorderRef.current = null
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Audio level monitoring - optimized to prevent UI blocking
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !showAudioLevel) return

    // Use a smaller buffer for better performance
    const bufferLength = 256 // Reduced from default frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteTimeDomainData(dataArray)
    
    // Calculate RMS (Root Mean Square) for more accurate audio level
    // Sample every 4th element for better performance
    let sum = 0
    const sampleStep = 4
    const sampleCount = Math.floor(bufferLength / sampleStep)
    
    for (let i = 0; i < bufferLength; i += sampleStep) {
      const sample = (dataArray[i] - 128) / 128 // Normalize to -1 to 1
      sum += sample * sample
    }
    const rms = Math.sqrt(sum / sampleCount)
    const level = Math.min(100, rms * 100 * 3) // Amplify for better visibility
    
    setAudioLevel(level)
    
    if (recordingState === 'recording' && showAudioLevel) {
      // Throttle to ~20fps instead of 60fps to reduce CPU usage further
      setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel)
      }, 50) // ~20fps (1000ms / 20 = 50ms)
    }
  }, [recordingState, showAudioLevel])

  // Start recording
  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000 // Use 48kHz for WebM OPUS compatibility
        }
      })

      streamRef.current = stream

      // Setup audio context for level monitoring - only if enabled
      if (showAudioLevel) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Resume audio context if suspended (required by some browsers)
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume()
        }
        
        const source = audioContextRef.current.createMediaStreamSource(stream)
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 512 // Smaller for better performance (was 2048)
        analyserRef.current.smoothingTimeConstant = 0.3 // Less smoothing for more responsive UI
        analyserRef.current.minDecibels = -90
        analyserRef.current.maxDecibels = -10
        source.connect(analyserRef.current)
      }

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes')
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks:', chunksRef.current.length)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        console.log('Created blob:', blob.size, 'bytes')
        setRecordedBlob(blob)
        setRecordingState('stopped')
        cleanup()
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error)
        onError?.(`Recording error: ${event.error?.message || 'Unknown error'}`)
        cleanup()
        setRecordingState('idle')
      }

      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      setRecordingState('recording')
      setDuration(0)

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            stopRecording()
            return maxDuration
          }
          
          return newDuration
        })
      }, 1000)

      // Start audio level monitoring (only if enabled)
      if (showAudioLevel) {
        monitorAudioLevel()
      }

    } catch (error) {
      onError?.(
        error instanceof Error 
          ? error.message 
          : 'Failed to access microphone. Please check permissions.'
      )
      setRecordingState('idle')
    }
  }

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause()
      setRecordingState('paused')
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume()
      setRecordingState('recording')
      
      // Resume timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
            return maxDuration
          }
          return newDuration
        })
      }, 1000)

      // Resume audio level monitoring (only if enabled)
      if (showAudioLevel) {
        monitorAudioLevel()
      }
    }
  }

  // Stop recording - enhanced with better error handling
  const stopRecording = () => {
    console.log('🛑 Stop recording called')
    console.log('📱 MediaRecorder exists:', !!mediaRecorderRef.current)
    console.log('📊 MediaRecorder state:', mediaRecorderRef.current?.state)
    console.log('🎯 Current recording state:', recordingState)
    
    // Force stop if we're in recording state, even if MediaRecorder is missing
    if (recordingState === 'recording' || recordingState === 'paused') {
      console.log('🔄 Forcing stop based on recording state')
      
      // Clear intervals and animation frames first
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        console.log('⏰ Cleared interval')
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
        console.log('🎬 Cleared animation frame')
      }
      
      // Set processing state immediately
      setRecordingState('processing')
      console.log('⚡ Set state to processing')
      
      // Try to stop MediaRecorder if it exists
      if (mediaRecorderRef.current) {
        const recorder = mediaRecorderRef.current
        const currentState = recorder.state
        
        console.log('🎙️ Attempting to stop MediaRecorder, state:', currentState)
        
        try {
          if (currentState === 'recording' || currentState === 'paused') {
            recorder.stop()
            console.log('✅ MediaRecorder.stop() called successfully')
          } else {
            console.warn('⚠️ MediaRecorder not in stoppable state, forcing cleanup')
            // Force cleanup and create a dummy blob
            const dummyBlob = new Blob([], { type: 'audio/webm;codecs=opus' })
            setRecordedBlob(dummyBlob)
            setRecordingState('stopped')
            cleanup()
          }
        } catch (error) {
          console.error('❌ Error stopping MediaRecorder:', error)
          // Force cleanup on error
          cleanup()
          setRecordingState('idle')
          onError?.('Failed to stop recording properly')
        }
      } else {
        console.warn('⚠️ No MediaRecorder found, forcing state reset')
        // No MediaRecorder, just reset state
        setRecordingState('idle')
        setDuration(0)
        setAudioLevel(0)
        cleanup()
      }
    } else {
      console.warn('⚠️ Stop called but not in recording state:', recordingState)
    }
  }

  // Discard recording
  const discardRecording = () => {
    setRecordedBlob(null)
    setDuration(0)
    setAudioLevel(0)
    setRecordingState('idle')
    cleanup()
  }

  // Preview recorded audio
  const playPreview = () => {
    if (!recordedBlob) return

    if (isPlayingPreview) {
      previewAudioRef.current?.pause()
      setIsPlayingPreview(false)
      return
    }

    const audio = new Audio(URL.createObjectURL(recordedBlob))
    previewAudioRef.current = audio
    
    audio.onended = () => {
      setIsPlayingPreview(false)
      previewAudioRef.current = null
    }
    
    audio.onerror = () => {
      setIsPlayingPreview(false)
      previewAudioRef.current = null
      onError?.('Failed to play audio preview')
    }

    audio.play()
    setIsPlayingPreview(true)
  }

  // Use recorded audio
  const useRecording = () => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, duration)
      discardRecording()
    }
  }

  const getStateIcon = () => {
    switch (recordingState) {
      case 'recording':
        return <StopIcon className="h-6 w-6" />
      case 'paused':
        return <PlayIcon className="h-6 w-6" />
      case 'stopped':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />
      case 'processing':
        return <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      default:
        return <MicrophoneIcon className="h-6 w-6" />
    }
  }

  const getStateColor = () => {
    switch (recordingState) {
      case 'recording':
        return 'bg-red-600 hover:bg-red-700'
      case 'paused':
        return 'bg-yellow-600 hover:bg-yellow-700'
      case 'stopped':
        return 'bg-green-600 hover:bg-green-700'
      case 'processing':
        return 'bg-blue-600'
      default:
        return 'bg-blue-600 hover:bg-blue-700'
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Audio Recorder
          </h3>
          <Badge 
            className={cn(
              recordingState === 'recording' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
              recordingState === 'paused' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
              recordingState === 'stopped' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
            )}
          >
            {recordingState === 'idle' && 'Ready'}
            {recordingState === 'recording' && 'Recording'}
            {recordingState === 'paused' && 'Paused'}
            {recordingState === 'stopped' && 'Recorded'}
            {recordingState === 'processing' && 'Processing'}
          </Badge>
        </div>

          {/* Recording Interface */}
        <div className="space-y-8">
          {/* Main Control Button */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <motion.button
                onClick={() => {
                  console.log('🖱️ Button clicked, current state:', recordingState)
                  if (recordingState === 'idle') {
                    console.log('▶️ Starting recording...')
                    startRecording()
                  } else if (recordingState === 'recording') {
                    console.log('⏹️ Stopping recording...')
                    stopRecording()
                  } else if (recordingState === 'paused') {
                    console.log('▶️ Resuming recording...')
                    resumeRecording()
                  }
                }}
                disabled={recordingState === 'processing'}
                className={cn(
                  'relative h-24 w-24 rounded-full text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center',
                  'hover:scale-105 active:scale-95 cursor-pointer',
                  'focus:outline-none focus:ring-4 focus:ring-blue-500/50',
                  getStateColor(),
                  recordingState === 'recording' && 'shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={
                  recordingState === 'idle' ? 'Start Recording' :
                  recordingState === 'recording' ? 'Stop Recording' :
                  recordingState === 'paused' ? 'Resume Recording' :
                  'Processing...'
                }
              >
                {getStateIcon()}
              </motion.button>
              
              {/* Recording pulse animation */}
              {recordingState === 'recording' && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                  <div className="absolute inset-2 rounded-full bg-red-300 animate-ping opacity-20 animation-delay-300" />
                </>
              )}
            </div>

            {/* Duration display */}
            {(recordingState !== 'idle') && (
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white tracking-wider">
                  {formatDuration(duration)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {recordingState === 'recording' && 'Recording in progress'}
                  {recordingState === 'paused' && 'Recording paused'}
                  {recordingState === 'stopped' && 'Recording completed'}
                  {recordingState === 'processing' && 'Processing...'}
                </div>
              </div>
            )}

            {/* Audio Level Visualization or Performance Mode Indicator */}
            {recordingState === 'recording' && showAudioLevel && (
              <div className="w-full max-w-xs">
                <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Audio Level
                </div>
                <div className="relative">
                  {/* Background bar */}
                  <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    {/* Level indicator */}
                    <div 
                      className="h-full transition-all duration-100 ease-out rounded-full"
                      style={{
                        width: `${audioLevel}%`,
                        background: audioLevel > 80 
                          ? 'linear-gradient(90deg, #22c55e 0%, #ef4444 100%)'
                          : audioLevel > 50
                          ? 'linear-gradient(90deg, #22c55e 0%, #f59e0b 100%)'
                          : '#22c55e'
                      }}
                    />
                  </div>
                  {/* Level markers */}
                  <div className="absolute inset-0 flex justify-between items-center px-1">
                    <div className="w-0.5 h-2 bg-white/50 rounded-full" />
                    <div className="w-0.5 h-2 bg-white/50 rounded-full" />
                    <div className="w-0.5 h-2 bg-white/50 rounded-full" />
                    <div className="w-0.5 h-2 bg-white/50 rounded-full" />
                  </div>
                </div>
                {/* Numeric level */}
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {Math.round(audioLevel)}%
                </div>
              </div>
            )}

            {/* Performance Mode Indicator */}
            {recordingState === 'recording' && !showAudioLevel && (
              <div className="w-full max-w-xs">
                <div className="text-center text-sm text-green-600 dark:text-green-400 mb-3">
                  🚀 Performance Mode - Audio levels disabled for better UI responsiveness
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <AnimatePresence>
            {recordingState === 'recording' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-center space-x-3"
              >
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  size="sm"
                >
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                
                <Button
                  onClick={() => {
                    console.log('Stop button clicked')
                    stopRecording()
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                  <StopIcon className="h-4 w-4 mr-2" />
                  Stop
                </Button>
                
                <Button
                  onClick={discardRecording}
                  variant="outline"
                  size="sm"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </motion.div>
            )}

            {recordingState === 'paused' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-center space-x-3"
              >
                <Button
                  onClick={resumeRecording}
                  size="sm"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  size="sm"
                >
                  <StopIcon className="h-4 w-4 mr-2" />
                  Stop
                </Button>
                
                <Button
                  onClick={discardRecording}
                  variant="outline"
                  size="sm"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </motion.div>
            )}

            {recordingState === 'stopped' && recordedBlob && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex justify-center space-x-3">
                  <Button
                    onClick={playPreview}
                    variant="outline"
                    size="sm"
                  >
                    {isPlayingPreview ? (
                      <PauseIcon className="h-4 w-4 mr-2" />
                    ) : (
                      <PlayIcon className="h-4 w-4 mr-2" />
                    )}
                    {isPlayingPreview ? 'Pause' : 'Preview'}
                  </Button>
                  
                  <Button
                    onClick={discardRecording}
                    variant="outline"
                    size="sm"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Discard
                  </Button>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={useRecording}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Use Recording
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Max duration warning */}
          {duration > maxDuration * 0.9 && recordingState === 'recording' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center space-x-2 text-amber-600 dark:text-amber-400"
            >
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="text-sm">
                Approaching maximum duration ({formatDuration(maxDuration)})
              </span>
            </motion.div>
          )}

          {/* Instructions */}
          {recordingState === 'idle' && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>Click the microphone to start recording</p>
              <p>💡 <strong>Tip:</strong> Record at least 5-10 seconds of speech for best results</p>
              <p className="text-xs">Maximum duration: {formatDuration(maxDuration)}</p>
            </div>
          )}

          {/* Short recording warning */}
          {recordingState === 'recording' && duration > 0 && duration < 5 && (
            <div className="text-center text-sm text-amber-600 dark:text-amber-400">
              <p>⏱️ Recording for {duration}s - consider speaking for at least 5 seconds</p>
            </div>
          )}

          {/* Long recording info */}
          {recordingState === 'recording' && duration >= 300 && duration < 600 && (
            <div className="text-center text-sm text-blue-600 dark:text-blue-400">
              <p>📝 {Math.floor(duration / 60)}m {duration % 60}s recorded - great for detailed content!</p>
            </div>
          )}

          {/* Very long recording info */}
          {recordingState === 'recording' && duration >= 1800 && duration < 3600 && (
            <div className="text-center text-sm text-orange-600 dark:text-orange-400">
              <p>🎙️ {Math.floor(duration / 60)}m recorded - consider breaking into segments for easier processing</p>
            </div>
          )}

          {/* Extremely long recording warning */}
          {recordingState === 'recording' && duration >= 3600 && (
            <div className="text-center text-sm text-red-600 dark:text-red-400">
              <p>⚠️ {Math.floor(duration / 3600)}h {Math.floor((duration % 3600) / 60)}m - very long recordings may take significant time to process</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
