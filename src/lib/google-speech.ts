import { SpeechConfig, TranscriptionResult, TranscriptionSegment, SpeakerInfo } from '@/types'
import { blobToBase64, getSpeakerColor } from '@/lib/utils'

interface GoogleSpeechResponse {
  results: Array<{
    alternatives: Array<{
      transcript: string
      confidence: number
      words?: Array<{
        word: string
        startTime: string
        endTime: string
        speakerTag?: number
      }>
    }>
  }>
}

interface GoogleServiceAccountConfig {
  type: 'service_account'
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
  universe_domain: string
}

interface AuthConfig {
  type: 'api_key' | 'service_account'
  apiKey?: string
  serviceAccount?: GoogleServiceAccountConfig
}

export class GoogleSpeechToTextService {
  private readonly authConfig: AuthConfig
  private readonly baseUrl = 'https://speech.googleapis.com/v1'
  private accessToken?: string
  private tokenExpiry?: number

  constructor(authConfig: AuthConfig) {
    this.authConfig = authConfig
  }

  private async getAccessToken(): Promise<string> {
    if (this.authConfig.type === 'api_key') {
      return this.authConfig.apiKey!
    }

    // For service account, generate JWT and get access token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const serviceAccount = this.authConfig.serviceAccount!
    const jwt = await this.createJWT(serviceAccount)
    const tokenResponse = await this.exchangeJWTForToken(jwt)
    
    this.accessToken = tokenResponse.access_token
    this.tokenExpiry = Date.now() + (tokenResponse.expires_in * 1000) - 60000 // 1 min buffer
    
    return this.accessToken
  }

  private async createJWT(serviceAccount: GoogleServiceAccountConfig): Promise<string> {
    // Note: This is a simplified JWT creation for demonstration
    // In production, you'd want to use a proper JWT library
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: serviceAccount.token_uri,
      exp: now + 3600,
      iat: now
    }

    const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '')
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '')
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`
    
    // Sign with private key (this requires Web Crypto API or a JWT library)
    const signature = await this.signJWT(signatureInput, serviceAccount.private_key)
    
    return `${signatureInput}.${signature}`
  }

  private async signJWT(_data: string, _privateKey: string): Promise<string> {
    // This is a simplified version - in production use a proper JWT library
    // For now, we'll return a placeholder since JWT signing in browser is complex
    throw new Error('Service Account authentication requires a backend service for security. Please use API Key authentication instead.')
  }

  private async exchangeJWTForToken(jwt: string): Promise<{access_token: string, expires_in: number}> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`)
    }

    return response.json()
  }

  private async getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio()
      const url = URL.createObjectURL(blob)
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url)
        resolve(audio.duration || 0)
      })
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url)
        // If we can't get duration, assume it's short
        resolve(30)
      })
      
      audio.src = url
    })
  }

  async transcribe(
    audioBlob: Blob,
    config: SpeechConfig,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<TranscriptionResult> {
    const startTime = Date.now()

    try {
      // Check audio duration first
      const duration = await this.getAudioDuration(audioBlob)
      
      // If audio is longer than 60 seconds, use chunked transcription for API key users
      if (duration > 60) {
        console.log(`Audio duration (${duration.toFixed(1)}s) exceeds sync limit.`)
        
        if (this.authConfig.type === 'service_account') {
          console.log('Using LongRunningRecognize API with Google Cloud Storage.')
          return this.transcribeLongAudio(audioBlob, config, onProgress)
        } else {
          console.log('Using chunked transcription for API key authentication.')
          return this.transcribeChunkedAudio(audioBlob, config, onProgress)
        }
      }
      
      const base64Audio = await blobToBase64(audioBlob)

      // Build the request config according to Google Speech API specification
      const requestConfig: any = {
        encoding: config.encoding,
        languageCode: config.languageCode,
        maxAlternatives: 1,
        profanityFilter: false,
        enableAutomaticPunctuation: config.enableAutomaticPunctuation || false,
        enableWordTimeOffsets: config.enableWordTimeOffsets || false,
      }

      // Only include sampleRateHertz if provided (omit for LINEAR16 to allow auto-detection)
      if (config.sampleRateHertz) {
        requestConfig.sampleRateHertz = config.sampleRateHertz
      }

      // For LINEAR16 encoding, handle stereo audio properly
      if (config.encoding === 'LINEAR16') {
        // Enable stereo audio support for LINEAR16
        requestConfig.audioChannelCount = 2
        requestConfig.enableSeparateRecognitionPerChannel = true
      }

      // Add speaker diarization configuration if enabled
      if (config.enableSpeakerDiarization) {
        requestConfig.diarizationConfig = {
          enableSpeakerDiarization: true,
          minSpeakerCount: config.minSpeakerCount || 1,
          maxSpeakerCount: config.maxSpeakerCount || 6,
        }
      }

      // Add model if specified
      if (config.model && config.model !== 'default') {
        requestConfig.model = config.model
      }

      // Add useEnhanced if specified
      if (config.useEnhanced !== undefined) {
        requestConfig.useEnhanced = config.useEnhanced
      }

      const request = {
        config: requestConfig,
        audio: {
          content: base64Audio,
        },
      }

      // Get authentication token/key
      const authToken = await this.getAccessToken()
      
      // Build URL and headers based on auth type
      const url = this.authConfig.type === 'api_key' 
        ? `${this.baseUrl}/speech:recognize?key=${authToken}`
        : `${this.baseUrl}/speech:recognize`
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (this.authConfig.type === 'service_account') {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `Google Speech API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ''
          }`
        )
      }

      const data: GoogleSpeechResponse = await response.json()
      const processingTime = Date.now() - startTime

      const result = this.processResponse(data, config, processingTime)
      
      // Add note if audio was too long
      if (duration > 58) {
        result.transcript = `[Note: Audio was ${duration.toFixed(1)}s long. Google Speech API limit is 60s for sync requests. Only processed portion shown.]\n\n${result.transcript}`
      }
      
      return result
    } catch (error) {
      throw new Error(
        `Transcription failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  private processResponse(
    data: GoogleSpeechResponse,
    config: SpeechConfig,
    processingTime: number
    ): TranscriptionResult {
    // Handle multi-channel response structure
    const transcriptionResults = data.results?.filter((result) => 
      result.alternatives && result.alternatives[0]?.transcript
    ) || []

    // Combine transcripts from all channels, removing duplicates
    const transcripts = transcriptionResults
      .map((result) => result.alternatives[0]?.transcript?.trim())
      .filter((transcript) => transcript && transcript.length > 0)

    // Remove duplicate transcripts (same content from different channels)
    const uniqueTranscripts = Array.from(new Set(transcripts))
    const transcript = uniqueTranscripts.join(' ')

    // Calculate average confidence from valid results
    const validConfidences = transcriptionResults
      .map((result) => result.alternatives[0]?.confidence)
      .filter((conf) => typeof conf === 'number')
    
    const confidence = validConfidences.length > 0 
      ? validConfidences.reduce((acc, conf) => acc + conf, 0) / validConfidences.length 
      : 0

    const segments = this.extractSegments(data)
    const speakers = config.enableSpeakerDiarization 
      ? this.extractSpeakers(data) 
      : undefined

    return {
      provider: 'google',
      model: config.model || 'latest_long',
      language: config.languageCode,
      confidence,
      audioDuration: 0, // Would need to calculate from audio
      processingTime,
      transcript,
      segments,
      speakers: speakers || [],
    }
  }

  private extractSegments(data: GoogleSpeechResponse): TranscriptionSegment[] {
    const segments: TranscriptionSegment[] = []

    data.results?.forEach((result, resultIndex) => {
      const alternative = result.alternatives[0]
      if (alternative?.transcript) {
        const words = alternative.words || []
        const startTime = words[0] ? this.parseTime(words[0].startTime) : 0
        const lastWord = words[words.length - 1]
        const endTime = lastWord ? this.parseTime(lastWord.endTime) : 0

        segments.push({
          id: `segment-${resultIndex}`,
          startTime,
          endTime,
          text: alternative.transcript,
          confidence: alternative.confidence || 0,
          words: words.map((word) => ({
            word: word.word,
            startTime: this.parseTime(word.startTime),
            endTime: this.parseTime(word.endTime),
            confidence: 1, // Google doesn't provide word-level confidence in this format
          })),
          speakerId: words[0]?.speakerTag || 0,
        })
      }
    })

    return segments
  }

  private extractSpeakers(data: GoogleSpeechResponse): SpeakerInfo[] {
    const speakers = new Map<number, SpeakerInfo>()

    data.results?.forEach((result) => {
      result.alternatives[0]?.words?.forEach((word) => {
        const speakerTag = word.speakerTag
        if (speakerTag) {
          if (!speakers.has(speakerTag)) {
            speakers.set(speakerTag, {
              id: speakerTag,
              name: `Speaker ${speakerTag}`,
              segments: [],
              totalDuration: 0,
              color: getSpeakerColor(speakerTag),
            })
          }
          
          const speaker = speakers.get(speakerTag)!
          const duration = this.parseTime(word.endTime) - this.parseTime(word.startTime)
          speaker.totalDuration += duration
        }
      })
    })

    return Array.from(speakers.values())
  }

  private parseTime(timeString: string): number {
    if (!timeString) return 0
    // Google returns time as "1.234s" format
    return parseFloat(timeString.replace('s', ''))
  }

  // Long audio transcription using Google Cloud Storage and LongRunningRecognize
  private async transcribeLongAudio(
    audioBlob: Blob,
    config: SpeechConfig,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<TranscriptionResult> {
    const startTime = Date.now()

    try {
      // Step 1: Upload to Google Cloud Storage
      onProgress?.(10, 'Uploading audio to cloud storage...')
      const gcsUri = await this.uploadToGCS(audioBlob)

      // Step 2: Start long-running recognition
      onProgress?.(30, 'Starting transcription process...')
      const operationName = await this.startLongRunningRecognize(gcsUri, config)

      // Step 3: Poll for completion
      onProgress?.(50, 'Processing audio (this may take a few minutes)...')
      const result = await this.pollLongRunningOperation(operationName, onProgress)

      // Step 4: Clean up GCS file
      onProgress?.(95, 'Cleaning up...')
      await this.deleteFromGCS(gcsUri)

      onProgress?.(100, 'Transcription complete!')

      const processingTime = Date.now() - startTime
      return this.processLongRunningResponse(result, config, processingTime)

    } catch (error) {
      throw new Error(
        `Long audio transcription failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  private async uploadToGCS(audioBlob: Blob): Promise<string> {
    // Generate a unique filename
    const timestamp = Date.now()
    const filename = `audio-${timestamp}.webm`
    const bucketName = 'audiomind-temp-storage' // You'll need to create this bucket
    
    // Note: base64Audio conversion removed as we upload the blob directly
    
    const authToken = await this.getAccessToken()
    
    // Upload to Google Cloud Storage
    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${filename}`
    
    const headers: Record<string, string> = {
      'Content-Type': audioBlob.type,
    }
    
    if (this.authConfig.type === 'service_account') {
      headers['Authorization'] = `Bearer ${authToken}`
    } else {
      // For API key, we need to use a different approach
      throw new Error('Long audio transcription requires Service Account authentication for Google Cloud Storage access')
    }

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: audioBlob
    })

    if (!response.ok) {
      throw new Error(`Failed to upload to GCS: ${response.status} ${response.statusText}`)
    }

    return `gs://${bucketName}/${filename}`
  }

  private async startLongRunningRecognize(gcsUri: string, config: SpeechConfig): Promise<string> {
    const requestConfig: any = {
      encoding: config.encoding,
      languageCode: config.languageCode,
      maxAlternatives: 1,
      profanityFilter: false,
      enableAutomaticPunctuation: config.enableAutomaticPunctuation || false,
      enableWordTimeOffsets: config.enableWordTimeOffsets || false,
    }

    if (config.sampleRateHertz) {
      requestConfig.sampleRateHertz = config.sampleRateHertz
    }

    if (config.enableSpeakerDiarization) {
      requestConfig.diarizationConfig = {
        enableSpeakerDiarization: true,
        minSpeakerCount: config.minSpeakerCount || 1,
        maxSpeakerCount: config.maxSpeakerCount || 6,
      }
    }

    if (config.model && config.model !== 'default') {
      requestConfig.model = config.model
    }

    if (config.useEnhanced !== undefined) {
      requestConfig.useEnhanced = config.useEnhanced
    }

    const request = {
      config: requestConfig,
      audio: {
        uri: gcsUri,
      },
    }

    const authToken = await this.getAccessToken()
    const url = `${this.baseUrl}/speech:longrunningrecognize`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Long-running recognition failed: ${response.status} ${response.statusText}. ${
          errorData.error?.message || ''
        }`
      )
    }

    const data = await response.json()
    return data.name // Operation name for polling
  }

  private async pollLongRunningOperation(
    operationName: string,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<any> {
    const authToken = await this.getAccessToken()
    const maxAttempts = 120 // 10 minutes max (5-second intervals)
    let attempts = 0

    while (attempts < maxAttempts) {
      const response = await fetch(
        `https://speech.googleapis.com/v1/operations/${operationName}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to poll operation: ${response.status}`)
      }

      const operation = await response.json()

      if (operation.done) {
        if (operation.error) {
          throw new Error(`Operation failed: ${operation.error.message}`)
        }
        return operation.response
      }

      // Update progress based on time elapsed
      const progressPercent = Math.min(95, 50 + (attempts / maxAttempts) * 45)
      onProgress?.(progressPercent, `Processing audio... (${Math.floor(attempts * 5 / 60)}m ${(attempts * 5) % 60}s elapsed)`)

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    throw new Error('Transcription timed out after 10 minutes')
  }

  private async deleteFromGCS(gcsUri: string): Promise<void> {
    try {
      const bucketName = gcsUri.split('/')[2]
      const filename = gcsUri.split('/').slice(3).join('/')
      
      const authToken = await this.getAccessToken()
      
      await fetch(
        `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filename)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )
    } catch (error) {
      console.warn('Failed to clean up GCS file:', error)
      // Don't throw - cleanup failure shouldn't fail the transcription
    }
  }

  private processLongRunningResponse(
    data: any,
    config: SpeechConfig,
    processingTime: number
  ): TranscriptionResult {
    // Long-running response has the same structure as sync response
    return this.processResponse(data, config, processingTime)
  }

  // Chunked transcription for API key users (no Google Cloud Storage required)
  private async transcribeChunkedAudio(
    audioBlob: Blob,
    config: SpeechConfig,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<TranscriptionResult> {
    const startTime = Date.now()

    try {
      onProgress?.(10, 'Preparing audio chunks...')
      
      // Split audio into 50-second chunks with 5-second overlap
      const chunks = await this.splitAudioIntoChunks(audioBlob, 50, 5)
      
      onProgress?.(20, `Processing ${chunks.length} audio chunks...`)
      
      const chunkResults: TranscriptionResult[] = []
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunkProgress = 20 + ((i / chunks.length) * 70)
        onProgress?.(chunkProgress, `Processing chunk ${i + 1} of ${chunks.length}...`)
        
        try {
          // Use the regular transcribe method for each chunk (without progress callback to avoid recursion)
          const chunk = chunks[i]
          if (chunk) {
            const chunkResult = await this.transcribeShortAudio(chunk, config)
            chunkResults.push(chunkResult)
          }
        } catch (error) {
          console.warn(`Failed to transcribe chunk ${i + 1}:`, error)
          // Continue with other chunks
        }
        
        // Add small delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      onProgress?.(95, 'Combining results...')
      
      // Combine results from all chunks
      const combinedResult = this.combineChunkResults(chunkResults, config, Date.now() - startTime)
      
      onProgress?.(100, 'Chunked transcription complete!')
      
      return combinedResult
      
    } catch (error) {
      throw new Error(
        `Chunked transcription failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  private async transcribeShortAudio(
    audioBlob: Blob,
    config: SpeechConfig
  ): Promise<TranscriptionResult> {
    // This is the original transcribe logic without duration check
    const startTime = Date.now()
    
    const base64Audio = await blobToBase64(audioBlob)

    // Build the request config
    const requestConfig: any = {
      encoding: config.encoding,
      languageCode: config.languageCode,
      maxAlternatives: 1,
      profanityFilter: false,
      enableAutomaticPunctuation: config.enableAutomaticPunctuation || false,
      enableWordTimeOffsets: config.enableWordTimeOffsets || false,
    }

    if (config.sampleRateHertz) {
      requestConfig.sampleRateHertz = config.sampleRateHertz
    }

    if (config.encoding === 'LINEAR16') {
      requestConfig.audioChannelCount = 2
      requestConfig.enableSeparateRecognitionPerChannel = true
    }

    if (config.enableSpeakerDiarization) {
      requestConfig.diarizationConfig = {
        enableSpeakerDiarization: true,
        minSpeakerCount: config.minSpeakerCount || 1,
        maxSpeakerCount: config.maxSpeakerCount || 6,
      }
    }

    if (config.model && config.model !== 'default') {
      requestConfig.model = config.model
    }

    if (config.useEnhanced !== undefined) {
      requestConfig.useEnhanced = config.useEnhanced
    }

    const request = {
      config: requestConfig,
      audio: {
        content: base64Audio,
      },
    }

    const authToken = await this.getAccessToken()
    
    const url = this.authConfig.type === 'api_key' 
      ? `${this.baseUrl}/speech:recognize?key=${authToken}`
      : `${this.baseUrl}/speech:recognize`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (this.authConfig.type === 'service_account') {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Google Speech API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || ''
        }`
      )
    }

    const data: GoogleSpeechResponse = await response.json()
    const processingTime = Date.now() - startTime

    return this.processResponse(data, config, processingTime)
  }

  private async splitAudioIntoChunks(
    audioBlob: Blob,
    chunkDurationSeconds: number,
    overlapSeconds: number = 0
  ): Promise<Blob[]> {
    // For now, we'll use a simple approach that creates overlapping chunks
    // In a production environment, you'd want to use Web Audio API for precise splitting
    
    const chunks: Blob[] = []
    const totalDuration = await this.getAudioDuration(audioBlob)
    const chunkSize = Math.floor((audioBlob.size * chunkDurationSeconds) / totalDuration)
    const overlapSize = Math.floor((audioBlob.size * overlapSeconds) / totalDuration)
    
    let offset = 0
    
    while (offset < audioBlob.size) {
      const end = Math.min(offset + chunkSize, audioBlob.size)
      const chunk = audioBlob.slice(offset, end)
      
      if (chunk.size > 0) {
        chunks.push(chunk)
      }
      
      // Move to next chunk with overlap
      offset += chunkSize - overlapSize
      
      // Prevent infinite loop
      if (offset >= audioBlob.size - overlapSize) {
        break
      }
    }
    
    return chunks
  }

  private combineChunkResults(
    chunkResults: TranscriptionResult[],
    config: SpeechConfig,
    totalProcessingTime: number
  ): TranscriptionResult {
    if (chunkResults.length === 0) {
      throw new Error('No successful chunk transcriptions')
    }

    // Combine transcripts
    const transcripts = chunkResults.map(result => result.transcript).filter(t => t.trim())
    const combinedTranscript = transcripts.join(' ')

    // Calculate average confidence
    const confidences = chunkResults.map(result => result.confidence).filter(c => c > 0)
    const avgConfidence = confidences.length > 0 
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length 
      : 0

    // Combine segments with time offset adjustment
    const combinedSegments: TranscriptionSegment[] = []
    let timeOffset = 0

    chunkResults.forEach((result, chunkIndex) => {
      result.segments.forEach(segment => {
        combinedSegments.push({
          ...segment,
          id: `chunk-${chunkIndex}-${segment.id}`,
          startTime: segment.startTime + timeOffset,
          endTime: segment.endTime + timeOffset,
        })
      })
      
      // Estimate time offset for next chunk (approximate)
      if (result.segments.length > 0) {
        const lastSegment = result.segments[result.segments.length - 1]
        if (lastSegment) {
          timeOffset += lastSegment.endTime
        }
      }
    })

    // Combine speakers
    const speakerMap = new Map<number, SpeakerInfo>()

    chunkResults.forEach(result => {
      result.speakers?.forEach(speaker => {
        if (!speakerMap.has(speaker.id)) {
          speakerMap.set(speaker.id, {
            ...speaker,
            totalDuration: 0,
            segments: []
          })
        }
        const combinedSpeaker = speakerMap.get(speaker.id)!
        combinedSpeaker.totalDuration += speaker.totalDuration
      })
    })

    return {
      provider: 'google',
      model: config.model || 'latest_long',
      language: config.languageCode,
      confidence: avgConfidence,
      audioDuration: 0,
      processingTime: totalProcessingTime,
      transcript: `[Chunked Transcription - ${chunkResults.length} segments]\n\n${combinedTranscript}`,
      segments: combinedSegments,
      speakers: Array.from(speakerMap.values()),
    }
  }
}

// Default speech configuration
export const DEFAULT_SPEECH_CONFIG: SpeechConfig = {
  encoding: 'WEBM_OPUS',
  // Note: sampleRateHertz is omitted by default to allow auto-detection
  languageCode: 'en-US',
  enableSpeakerDiarization: true,
  enableAutomaticPunctuation: true,
  enableWordTimeOffsets: true,
  model: 'latest_long',
  useEnhanced: false,
  minSpeakerCount: 1,
  maxSpeakerCount: 6,
}

// Detect encoding from MIME type
export function detectAudioEncoding(mimeType: string): SpeechConfig['encoding'] {
  switch (mimeType) {
    case 'audio/webm':
    case 'audio/webm;codecs=opus':
      return 'WEBM_OPUS'
    case 'audio/ogg':
    case 'audio/ogg;codecs=opus':
      return 'OGG_OPUS'
    case 'audio/wav':
      return 'LINEAR16' // WAV files use LINEAR16 encoding
    case 'audio/flac':
      return 'FLAC'
    case 'audio/mpeg':
    case 'audio/mp3':
    case 'audio/mp4':
    case 'audio/aac':
    case 'audio/m4a':
      // For MP3/MP4/AAC, we need to convert to supported format or use LINEAR16
      return 'LINEAR16' // Fallback to LINEAR16 for unsupported formats
    default:
      return 'WEBM_OPUS' // Default fallback
  }
}
