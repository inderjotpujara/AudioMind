import { 
  ProcessingOptions, 
  ProcessingResult, 
  SpeechConfig,
  ProcessingStatus 
} from '@/types'
import { GoogleSpeechToTextService, DEFAULT_SPEECH_CONFIG, detectAudioEncoding } from './google-speech'
import { GoogleNaturalLanguageService } from './google-nl'
import { extractAudioMetadata } from '@/lib/utils'

export class AudioProcessingService {
  private speechService: GoogleSpeechToTextService | null = null
  private nlService: GoogleNaturalLanguageService | null = null

  constructor(googleApiKey?: string) {
    if (googleApiKey) {
      this.speechService = new GoogleSpeechToTextService({ type: 'api_key', apiKey: googleApiKey })
      this.nlService = new GoogleNaturalLanguageService(googleApiKey)
    }
  }

  setApiKey(apiKey: string) {
    this.speechService = new GoogleSpeechToTextService({ type: 'api_key', apiKey })
    this.nlService = new GoogleNaturalLanguageService(apiKey)
  }

  async processAudio(
    audioFile: File,
    options: ProcessingOptions,
    onProgress?: (progress: number, stage: string, status: ProcessingStatus) => void
  ): Promise<ProcessingResult> {
    const startTime = Date.now()

    try {
      if (!this.speechService || !this.nlService) {
        throw new Error('Google API key not configured')
      }

      // Step 1: Extract metadata
      onProgress?.(10, 'Extracting audio metadata', ProcessingStatus.VALIDATING)
      const metadata = await extractAudioMetadata(audioFile)
      
      // Yield control to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 10))

      // Step 2: Configure speech recognition
      onProgress?.(20, 'Configuring speech recognition', ProcessingStatus.TRANSCRIBING)
      const encoding = detectAudioEncoding(audioFile.type)
      
      const speechConfig: SpeechConfig = {
        ...DEFAULT_SPEECH_CONFIG,
        encoding,
        languageCode: options.language || 'en-US',
        enableSpeakerDiarization: options.enableSpeakerDiarization,
        enableAutomaticPunctuation: options.enablePunctuation,
        enableWordTimeOffsets: options.enableWordTimestamps,
      }

      // Handle sample rate based on encoding type
      if (encoding === 'LINEAR16') {
        // For WAV files, omit sampleRateHertz to allow auto-detection
        delete speechConfig.sampleRateHertz
      } else if (encoding === 'WEBM_OPUS') {
        // For WebM OPUS, use 48000 Hz (standard for WebM) or omit to auto-detect
        delete speechConfig.sampleRateHertz // Let Google auto-detect
      } else {
        // For other formats, use the detected sample rate from metadata if available
        if (metadata.sampleRate && metadata.sampleRate > 0) {
          speechConfig.sampleRateHertz = metadata.sampleRate
        } else {
          // Fallback: omit to let Google auto-detect
          delete speechConfig.sampleRateHertz
        }
      }

      // Step 3: Transcribe audio
      onProgress?.(30, 'Transcribing audio...', ProcessingStatus.TRANSCRIBING)
      const audioBlob = new Blob([audioFile], { type: audioFile.type })
      
      // Create a progress wrapper for transcription
      const transcriptionProgress = (progress: number, stage: string) => {
        // Map transcription progress to overall progress (30-60%)
        const overallProgress = 30 + (progress * 0.3)
        
        // Add helpful context for long audio processing
        let enhancedStage = stage
        if (stage.includes('chunks')) {
          enhancedStage = `${stage} (Long audio detected - using chunked processing)`
        } else if (stage.includes('cloud storage')) {
          enhancedStage = `${stage} (Using Google Cloud for optimal results)`
        }
        
        onProgress?.(overallProgress, enhancedStage, ProcessingStatus.TRANSCRIBING)
      }
      
      const transcription = await this.speechService.transcribe(audioBlob, speechConfig, transcriptionProgress)

      onProgress?.(60, 'Transcription complete', ProcessingStatus.TRANSCRIBING)
      
      // Yield control after transcription
      await new Promise(resolve => setTimeout(resolve, 50))

      let summary = undefined
      let tasks: any[] = []

      // Step 4: Generate summary (if requested)
      if (options.generateSummary && transcription.transcript) {
        // Check if transcript has enough content for summarization
        const wordCount = transcription.transcript.trim().split(/\s+/).length
        const minWordsForSummary = 10 // Minimum words needed for Google NL API
        
        if (wordCount >= minWordsForSummary) {
          onProgress?.(70, 'Generating summary...', ProcessingStatus.SUMMARIZING)
          
          try {
            const nlConfig = {
              apiKey: '', // Already configured in service
              features: ['entities', 'sentiment', 'categories'] as ('entities' | 'sentiment' | 'syntax' | 'categories')[],
            }

            summary = await this.nlService.generateSummary(transcription.transcript, nlConfig)
            onProgress?.(85, 'Summary generated', ProcessingStatus.SUMMARIZING)
            
            // Yield control after summary generation
            await new Promise(resolve => setTimeout(resolve, 25))
          } catch (error) {
            console.warn('NL API failed, generating fallback summary:', error)
            // Generate a simple fallback summary
            summary = {
              summary: this.generateFallbackSummary(transcription.transcript),
              keyPoints: [transcription.transcript.slice(0, 100) + (transcription.transcript.length > 100 ? '...' : '')],
              topics: ['Audio Recording'],
              provider: 'fallback',
              model: 'basic',
              generatedAt: new Date(),
              confidence: 0.5,
              wordCount: wordCount,
              compressionRatio: 1.0
            }
            onProgress?.(85, 'Basic summary generated', ProcessingStatus.SUMMARIZING)
          }
        } else {
          // Too short for summarization, create a basic summary
          console.log(`Transcript too short (${wordCount} words) for NL API, creating basic summary`)
          summary = {
            summary: `Short recording (${wordCount} words): "${transcription.transcript}"`,
            keyPoints: [transcription.transcript],
            topics: ['Short Recording'],
            provider: 'fallback',
            model: 'basic',
            generatedAt: new Date(),
            confidence: 0.7,
            wordCount: wordCount,
            compressionRatio: 1.0
          }
          onProgress?.(85, 'Basic summary created for short recording', ProcessingStatus.SUMMARIZING)
        }
      }

      // Step 5: Extract tasks (if requested)
      if (options.extractTasks && transcription.transcript) {
        onProgress?.(90, 'Extracting tasks...', ProcessingStatus.EXTRACTING_TASKS)
        tasks = await this.nlService.extractTasks(
          transcription.transcript, 
          'temp-session-id' // Will be replaced with actual session ID
        )
        onProgress?.(95, 'Tasks extracted', ProcessingStatus.EXTRACTING_TASKS)
      }

      onProgress?.(100, 'Processing complete', ProcessingStatus.COMPLETED)

      const processingTime = Date.now() - startTime

      return {
        success: true,
        transcription,
        ...(summary && { summary }),
        tasks,
        metadata: {
          duration: metadata.duration,
          sampleRate: metadata.sampleRate,
          channels: metadata.channels,
          format: audioFile.type,
        },
        processingTime,
      }

    } catch (error) {
      console.error('Audio processing failed:', error)
      
      onProgress?.(0, 'Processing failed', ProcessingStatus.FAILED)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        tasks: [],
        processingTime: Date.now() - startTime,
      }
    }
  }

  // Validate API key
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      // Test API key validity
      
      // Create a minimal test request
      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: {
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 16000,
              languageCode: 'en-US',
            },
            audio: {
              content: '', // Empty content for validation
            },
          }),
        }
      )

      // If we get a 400 error with invalid audio content, the API key is valid
      // If we get a 401/403 error, the API key is invalid
      return response.status !== 401 && response.status !== 403
    } catch {
      return false
    }
  }

  // Get supported languages
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
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
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'ar-SA', name: 'Arabic' },
      { code: 'nl-NL', name: 'Dutch' },
      { code: 'sv-SE', name: 'Swedish' },
      { code: 'da-DK', name: 'Danish' },
      { code: 'no-NO', name: 'Norwegian' },
      { code: 'fi-FI', name: 'Finnish' },
    ]
  }

  // Estimate processing cost (rough estimation)
  estimateProcessingCost(durationMinutes: number): {
    speechToText: number
    naturalLanguage: number
    total: number
  } {
    // Google Speech-to-Text: ~$0.006 per 15 seconds
    const speechCost = (durationMinutes / 15) * 0.006 * 60

    // Google Natural Language: ~$0.0005 per 1000 characters
    // Estimate ~150 words per minute, ~6 characters per word
    const estimatedCharacters = durationMinutes * 150 * 6
    const nlCost = (estimatedCharacters / 1000) * 0.0005

    return {
      speechToText: speechCost,
      naturalLanguage: nlCost,
      total: speechCost + nlCost,
    }
  }

  // Generate a simple fallback summary when NL API fails
  private generateFallbackSummary(transcript: string): string {
    const words = transcript.trim().split(/\s+/)
    const wordCount = words.length
    
    if (wordCount <= 5) {
      return `Very short recording: "${transcript}"`
    } else if (wordCount <= 20) {
      return `Short recording containing: ${transcript}`
    } else {
      // For longer text, take first and last parts
      const firstPart = words.slice(0, 10).join(' ')
      const lastPart = words.slice(-5).join(' ')
      return `Audio recording (${wordCount} words) starting with: "${firstPart}" and ending with: "${lastPart}"`
    }
  }
}
