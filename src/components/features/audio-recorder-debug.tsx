import { useState, useRef } from 'react'
import { Button } from '@/components/ui'

// Minimal debug version of audio recorder to isolate stop button issues
export function AudioRecorderDebug() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      console.log('🎙️ Starting recording...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Data available:', event.data.size, 'bytes')
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        console.log('⏹️ MediaRecorder stopped')
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        console.log('💾 Created blob:', blob.size, 'bytes')
        setRecordedBlob(blob)
        setIsRecording(false)
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error)
        setIsRecording(false)
      }
      
      mediaRecorder.start(1000)
      setIsRecording(true)
      console.log('✅ Recording started')
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error)
    }
  }

  const stopRecording = () => {
    console.log('🛑 Stop recording called')
    console.log('📱 MediaRecorder exists:', !!mediaRecorderRef.current)
    console.log('📊 MediaRecorder state:', mediaRecorderRef.current?.state)
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('⏹️ Stopping MediaRecorder...')
      mediaRecorderRef.current.stop()
    } else {
      console.warn('⚠️ Cannot stop - MediaRecorder not in recording state')
    }
  }

  const playRecording = () => {
    if (recordedBlob) {
      const audio = new Audio(URL.createObjectURL(recordedBlob))
      audio.play()
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
      <h3 className="text-lg font-medium mb-4">Audio Recorder Debug</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-sm">
            Status: {isRecording ? 'Recording' : 'Idle'}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={startRecording}
            disabled={isRecording}
            className="bg-green-600 hover:bg-green-700"
          >
            Start Recording
          </Button>
          
          <Button
            onClick={stopRecording}
            disabled={!isRecording}
            className="bg-red-600 hover:bg-red-700"
          >
            Stop Recording
          </Button>
          
          {recordedBlob && (
            <Button
              onClick={playRecording}
              variant="outline"
            >
              Play Recording
            </Button>
          )}
        </div>
        
        {recordedBlob && (
          <div className="text-sm text-gray-600">
            Recording saved: {Math.round(recordedBlob.size / 1024)}KB
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          Check browser console for detailed logs
        </div>
      </div>
    </div>
  )
}
