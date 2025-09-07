import { useState, useRef } from 'react'
import { Button } from '@/components/ui'

interface SimpleAudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  onError?: (error: string) => void
}

export function SimpleAudioRecorder({ onRecordingComplete, onError }: SimpleAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = async () => {
    try {
      console.log('🎙️ Starting recording...')
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      streamRef.current = stream
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      // Handle data
      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Data chunk received:', event.data.size)
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      // Handle stop
      mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped, creating blob...')
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        console.log('💾 Blob created:', blob.size, 'bytes')
        setRecordedBlob(blob)
        setIsRecording(false)
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }
      
      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event)
        onError?.('Recording failed')
        setIsRecording(false)
      }
      
      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setDuration(0)
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
      
      console.log('✅ Recording started successfully')
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to access microphone')
    }
  }

  const stopRecording = () => {
    console.log('🛑 Stopping recording...')
    
    // Clear timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('⏹️ Calling MediaRecorder.stop()')
      mediaRecorderRef.current.stop()
    } else {
      console.warn('⚠️ MediaRecorder not in recording state')
      setIsRecording(false)
    }
  }

  const useRecording = () => {
    if (recordedBlob) {
      console.log('✅ Using recording:', recordedBlob.size, 'bytes,', duration, 'seconds')
      onRecordingComplete(recordedBlob, duration)
      
      // Reset
      setRecordedBlob(null)
      setDuration(0)
    }
  }

  const discardRecording = () => {
    console.log('🗑️ Discarding recording')
    setRecordedBlob(null)
    setDuration(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border space-y-4">
      <h3 className="text-lg font-medium">Simple Audio Recorder</h3>
      
      {/* Status */}
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
        <span className="text-sm">
          {isRecording ? 'Recording' : recordedBlob ? 'Recording Ready' : 'Ready to Record'}
        </span>
        {duration > 0 && (
          <span className="text-lg font-mono font-bold">
            {formatTime(duration)}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex space-x-2">
        {!isRecording && !recordedBlob && (
          <Button onClick={startRecording} className="bg-green-600 hover:bg-green-700">
            🎙️ Start Recording
          </Button>
        )}
        
        {isRecording && (
          <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700">
            ⏹️ Stop Recording
          </Button>
        )}
        
        {recordedBlob && (
          <>
            <Button onClick={useRecording} className="bg-blue-600 hover:bg-blue-700">
              ✅ Use Recording
            </Button>
            <Button onClick={discardRecording} variant="outline">
              🗑️ Discard
            </Button>
          </>
        )}
      </div>
      
      {/* Debug info */}
      <div className="text-xs text-gray-500">
        <p>MediaRecorder State: {mediaRecorderRef.current?.state || 'none'}</p>
        <p>Stream Active: {streamRef.current?.active ? 'Yes' : 'No'}</p>
        <p>Chunks: {chunksRef.current.length}</p>
      </div>
    </div>
  )
}
