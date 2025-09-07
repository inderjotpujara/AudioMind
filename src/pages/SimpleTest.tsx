import { useState } from 'react'
import { SimpleAudioRecorder } from '@/components/features/simple-audio-recorder'
import { SimpleAudioProcessor, SimpleProcessingOptions } from '@/lib/simple-processing'
import { getLanguageOptions, getPopularLanguages } from '@/lib/language-config'
import { Button, Progress, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export default function SimpleTest() {
  const [apiKey, setApiKey] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastRecording, setLastRecording] = useState<{ blob: Blob; duration: number } | null>(null)
  
  // Language settings
  const [inputLanguage, setInputLanguage] = useState('auto')
  const [outputLanguage, setOutputLanguage] = useState('en')
  const [enableTranslation, setEnableTranslation] = useState(true)
  
  // Processing results
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [originalTranscript, setOriginalTranscript] = useState<string | null>(null)
  const [translatedFrom, setTranslatedFrom] = useState<string | null>(null)

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    console.log('🎉 Recording complete!')
    console.log('📁 Blob size:', audioBlob.size, 'bytes')
    console.log('📁 Blob type:', audioBlob.type)
    console.log('⏱️ Duration:', duration, 'seconds')
    console.log('📊 Data rate:', Math.round(audioBlob.size / duration), 'bytes/second')
    
    // Store the recording for playback
    setLastRecording({ blob: audioBlob, duration })
    
    if (!apiKey.trim()) {
      setError('Please enter your Google API key first')
      return
    }

    if (duration < 1) {
      setError('Recording too short. Please record for at least 1 second.')
      return
    }

    if (audioBlob.size < 1000) {
      setError('Audio file too small. Please record some speech.')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setProgressMessage('Starting...')
    setResult(null)
    setError(null)

    try {
      const processor = new SimpleAudioProcessor(apiKey.trim())
      
      const options: SimpleProcessingOptions = {
        inputLanguage,
        outputLanguage,
        enableTranslation
      }
      
      const processingResult = await processor.processAudio(
        audioBlob,
        options,
        (progress, message) => {
          console.log(`📊 Progress: ${progress}% - ${message}`)
          setProgress(progress)
          setProgressMessage(message)
        }
      )

      console.log('🎯 Processing result:', processingResult)
      
      if (processingResult.success) {
        const transcript = processingResult.transcript || 'No transcript available'
        setResult(transcript)
        setDetectedLanguage(processingResult.detectedLanguage || null)
        setOriginalTranscript(processingResult.originalTranscript || null)
        setTranslatedFrom(processingResult.translatedFrom || null)
        
        console.log('✅ Success! Transcript:', transcript)
        console.log('📊 Transcript length:', transcript.length, 'characters')
        console.log('🔍 Detected language:', processingResult.detectedLanguage)
        console.log('🌐 Translated from:', processingResult.translatedFrom)
      } else {
        const errorMsg = processingResult.error || 'Processing failed'
        setError(errorMsg)
        console.error('❌ Failed! Error:', errorMsg)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      console.error('❌ Exception:', errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecordingError = (error: string) => {
    console.error('🎙️ Recording error:', error)
    setError(`Recording error: ${error}`)
  }

  const playRecording = () => {
    if (!lastRecording) return
    
    console.log('🔊 Playing recording...')
    const audioUrl = URL.createObjectURL(lastRecording.blob)
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
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Simple Audio Test</h1>
        <p className="text-gray-600 mt-2">Test recording and transcription with minimal complexity</p>
      </div>

      {/* API Key Input */}
      <Card>
        <CardHeader>
          <CardTitle>Google API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="password"
            placeholder="Enter your Google Speech-to-Text API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-2">
            Get your API key from Google Cloud Console → APIs & Services → Credentials
          </p>
          <p className="text-xs text-blue-600 mt-1">
            💡 Make sure to enable both Speech-to-Text AND Translation APIs
          </p>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle>🌐 Language Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Language */}
            <div>
              <label className="block text-sm font-medium mb-2">
                🎤 Audio Language (What you're speaking)
              </label>
              <select
                value={inputLanguage}
                onChange={(e) => setInputLanguage(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {getLanguageOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Output Language */}
            <div>
              <label className="block text-sm font-medium mb-2">
                📝 Transcript Language (What you want to read)
              </label>
              <select
                value={outputLanguage}
                onChange={(e) => setOutputLanguage(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {getLanguageOptions().filter(opt => opt.value !== 'auto').map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Translation Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableTranslation"
              checked={enableTranslation}
              onChange={(e) => setEnableTranslation(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="enableTranslation" className="text-sm">
              🔄 Enable automatic translation when languages differ
            </label>
          </div>

          {/* Popular Languages Quick Select */}
          <div>
            <p className="text-sm font-medium mb-2">🔥 Popular Languages:</p>
            <div className="flex flex-wrap gap-2">
              {getPopularLanguages().slice(0, 8).map(lang => (
                <Button
                  key={lang.code}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputLanguage(lang.code)}
                  className={inputLanguage === lang.code ? 'bg-blue-100' : ''}
                >
                  {lang.nativeName}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Recorder */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Recorder</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleAudioRecorder
            onRecordingComplete={handleRecordingComplete}
            onError={handleRecordingError}
          />
          
          {/* Playback Controls */}
          {lastRecording && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium">Last Recording:</p>
                  <p className="text-gray-600">
                    {Math.round(lastRecording.blob.size / 1024)}KB • {lastRecording.duration}s
                  </p>
                </div>
                <Button onClick={playRecording} variant="outline" size="sm">
                  🔊 Play Recording
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Audio</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-3" />
            <p className="text-sm text-gray-600">{progressMessage}</p>
            <p className="text-xs text-green-600 mt-2">
              ✅ UI should remain responsive during processing
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✅ Transcription Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language Detection Info */}
            {detectedLanguage && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">🔍 Detected Language:</span>
                  <span className="text-blue-700">{detectedLanguage}</span>
                </div>
                {translatedFrom && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium">🌐 Translated from:</span>
                    <span className="text-blue-700">{translatedFrom}</span>
                  </div>
                )}
              </div>
            )}

            {/* Original Transcript (if translated) */}
            {originalTranscript && originalTranscript !== result && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">📝 Original Transcript:</p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-700">{originalTranscript}</p>
                </div>
              </div>
            )}

            {/* Final Transcript */}
            <div>
              {translatedFrom && (
                <p className="text-sm font-medium text-green-600 mb-2">🔄 Translated Transcript:</p>
              )}
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-gray-800">{result}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => navigator.clipboard.writeText(result)}
                size="sm"
              >
                📋 Copy Final
              </Button>
              {originalTranscript && originalTranscript !== result && (
                <Button 
                  onClick={() => navigator.clipboard.writeText(originalTranscript)}
                  variant="outline"
                  size="sm"
                >
                  📋 Copy Original
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">❌ Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
            <Button 
              onClick={() => setError(null)}
              variant="outline"
              className="mt-3"
              size="sm"
            >
              Clear Error
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>1. Enter your Google API key above</p>
          <p>2. Click "Start Recording" and speak clearly</p>
          <p>3. Click "Stop Recording" when done</p>
          <p>4. Click "Use Recording" to start transcription</p>
          <p>5. Check that you can navigate/switch tabs during processing</p>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="font-medium">Debug Info:</p>
            <p>• Check browser console for detailed logs</p>
            <p>• All steps should have emoji indicators</p>
            <p>• UI should never freeze or show "Page Unresponsive"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
