// Simple, non-blocking audio processing with multi-language support
import { getLanguageByCode, createLanguageAlternatives, MIXED_LANGUAGE_CONFIGS } from './language-config'

export interface SimpleProcessingOptions {
  inputLanguage?: string // Language of the audio (auto-detect if not specified)
  outputLanguage?: string // Language for the final transcript (translate if different)
  enableTranslation?: boolean
}

export interface SimpleProcessingResult {
  success: boolean
  transcript?: string
  originalTranscript?: string // Before translation
  detectedLanguage?: string
  translatedFrom?: string
  error?: string
  duration: number
}

export class SimpleAudioProcessor {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async processAudio(
    audioBlob: Blob,
    options: SimpleProcessingOptions = {},
    onProgress?: (progress: number, message: string) => void
  ): Promise<SimpleProcessingResult> {
    const startTime = Date.now()
    
    try {
      console.log('🚀 Starting simple audio processing...')
      console.log('📁 Audio blob size:', audioBlob.size, 'bytes')
      console.log('📁 Audio blob type:', audioBlob.type)
      onProgress?.(10, 'Preparing audio...')
      
      // Small delay to prevent blocking
      await this.delay(100)
      
      // Convert to base64
      onProgress?.(30, 'Converting audio format...')
      console.log('🔄 Converting blob to base64...')
      const base64Audio = await this.blobToBase64(audioBlob)
      console.log('✅ Base64 conversion complete, length:', base64Audio.length)
      
      await this.delay(100)
      
      // Determine input language configuration
      const { inputLanguage = 'auto', outputLanguage = 'en', enableTranslation = true } = options
      
      console.log('🌐 Language settings:', { inputLanguage, outputLanguage, enableTranslation })
      
      let languageCode: string
      let alternativeLanguageCodes: string[] = []
      
      if (inputLanguage === 'auto') {
        // Auto-detect mode - use most common languages with mixed language support
        languageCode = 'en-US'
        alternativeLanguageCodes = [
          'en-US', 'hi-IN', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'zh-CN', 
          'ar-SA', 'pt-BR', 'ru-RU', 'it-IT', 'nl-NL', 'tr-TR', 'th-TH'
        ]
        console.log('🔍 Using auto-detection with extended language support for mixed languages')
      } else {
        // Check if it's a mixed language configuration
        const mixedConfig = MIXED_LANGUAGE_CONFIGS[inputLanguage as keyof typeof MIXED_LANGUAGE_CONFIGS]
        if (mixedConfig) {
          languageCode = mixedConfig.googleSpeechCode
          alternativeLanguageCodes = mixedConfig.alternativeCodes
          console.log('🔀 Using mixed language config:', mixedConfig.name, '(' + languageCode + ')')
          console.log('🎯 Alternative codes:', alternativeLanguageCodes)
        } else {
          // Specific single language mode
          const inputLangConfig = getLanguageByCode(inputLanguage)
          if (inputLangConfig) {
            languageCode = inputLangConfig.googleSpeechCode
            alternativeLanguageCodes = createLanguageAlternatives(languageCode)
            console.log('🎯 Using specific language:', inputLangConfig.name, '(' + languageCode + ')')
          } else {
            languageCode = 'en-US'
            alternativeLanguageCodes = ['en-US']
            console.warn('⚠️ Unknown language code, falling back to English')
          }
        }
      }
      
      // Prepare API request with language configuration
      const requestBody = {
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode,
          alternativeLanguageCodes: alternativeLanguageCodes.slice(0, 5), // Max 5 alternatives
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          maxAlternatives: 3,
          profanityFilter: false,
          model: 'latest_long',
          useEnhanced: true,
        },
        audio: {
          content: base64Audio,
        },
      }
      
      console.log('📡 API Request config:', {
        encoding: requestBody.config.encoding,
        languageCode: requestBody.config.languageCode,
        audioSizeBytes: audioBlob.size,
        base64Length: base64Audio.length
      })
      
      // Call Google Speech API
      onProgress?.(50, 'Sending to Google Speech API...')
      console.log('🌐 Making API request to Google Speech...')
      
      const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📨 API Response status:', response.status, response.statusText)
      onProgress?.(80, 'Processing response...')
      await this.delay(100)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('📦 Full API Response:', JSON.stringify(data, null, 2))
      
      onProgress?.(100, 'Complete!')

      // Extract transcript with detailed logging
      console.log('🔍 Extracting transcript from response...')
      console.log('📋 Results array:', data.results)
      
      if (!data.results || data.results.length === 0) {
        console.warn('⚠️ No results in API response, trying with automatic language detection...')
        
        // Try again with automatic language detection
        const autoRequestBody = {
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            enableAutomaticPunctuation: true,
            enableWordTimeOffsets: true,
            maxAlternatives: 3,
            profanityFilter: false,
            model: 'latest_short', // Use short model for faster processing
            useEnhanced: false,
          },
          audio: {
            content: base64Audio,
          },
        }
        
        console.log('🌐 Retrying with automatic language detection...')
        const autoResponse = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(autoRequestBody),
        })
        
        if (autoResponse.ok) {
          const autoData = await autoResponse.json()
          console.log('📦 Auto-detect response:', JSON.stringify(autoData, null, 2))
          
          if (autoData.results && autoData.results.length > 0) {
            // Use the auto-detected results
            const transcripts = autoData.results.map((result: any, index: number) => {
              console.log(`📝 Auto Result ${index}:`, result)
              const alternative = result.alternatives?.[0]
              console.log(`🎯 Auto Alternative ${index}:`, alternative)
              return alternative?.transcript || ''
            }).filter((t: string) => t.length > 0)

            if (transcripts.length > 0) {
              // Use auto-detected results
              originalTranscript = transcripts.join(' ')
              detectedLanguage = autoData.results?.[0]?.languageCode || languageCode
              console.log('✅ Auto-detection successful:', originalTranscript)
            } else {
              return {
                success: true,
                transcript: 'No speech detected in audio (auto-detection also failed)',
                duration: Date.now() - startTime,
              }
            }
          } else {
            return {
              success: true,
              transcript: 'No speech detected in audio (tried both manual and automatic language detection)',
              duration: Date.now() - startTime,
            }
          }
        } else {
          return {
            success: true,
            transcript: 'No speech detected in audio',
            duration: Date.now() - startTime,
          }
        }
      }

      const transcripts = data.results.map((result: any, index: number) => {
        console.log(`📝 Result ${index}:`, result)
        const alternative = result.alternatives?.[0]
        console.log(`🎯 Alternative ${index}:`, alternative)
        return alternative?.transcript || ''
      }).filter((t: string) => t.length > 0)

      console.log('📄 Extracted transcripts:', transcripts)
      
      let originalTranscript = transcripts.join(' ') || 'No speech detected'
      let finalTranscript = originalTranscript
      let detectedLanguage = data.results?.[0]?.languageCode || languageCode
      let translatedFrom: string | undefined
      
      console.log('📝 Original transcript:', originalTranscript)
      console.log('🔍 Detected language:', detectedLanguage)
      
      // Translation logic
      if (enableTranslation && outputLanguage !== 'auto' && originalTranscript !== 'No speech detected') {
        const outputLangConfig = getLanguageByCode(outputLanguage)
        const detectedLangConfig = getLanguageByCode(detectedLanguage.split('-')[0]) // Remove region code
        
        // Check if translation is needed
        const needsTranslation = outputLangConfig && detectedLangConfig && 
          outputLangConfig.googleTranslateCode !== detectedLangConfig.googleTranslateCode
        
        if (needsTranslation) {
          console.log('🔄 Translating from', detectedLangConfig.name, 'to', outputLangConfig.name)
          onProgress?.(90, `Translating to ${outputLangConfig.name}...`)
          
          try {
            const translatedText = await this.translateText(
              originalTranscript,
              detectedLangConfig.googleTranslateCode,
              outputLangConfig.googleTranslateCode
            )
            
            if (translatedText) {
              finalTranscript = translatedText
              translatedFrom = detectedLangConfig.name
              console.log('✅ Translation complete:', translatedText)
            } else {
              console.warn('⚠️ Translation failed, using original text')
            }
          } catch (error) {
            console.error('❌ Translation error:', error)
            // Continue with original transcript if translation fails
          }
        } else {
          console.log('ℹ️ No translation needed')
        }
      }

      const duration = Date.now() - startTime

      console.log('✅ Processing complete!')
      console.log('📊 Final transcript:', finalTranscript)
      console.log('⏱️ Processing time:', duration, 'ms')

      return {
        success: true,
        transcript: finalTranscript,
        originalTranscript: originalTranscript !== finalTranscript ? originalTranscript : undefined,
        detectedLanguage,
        translatedFrom: translatedFrom || undefined,
        duration,
      }

    } catch (error) {
      console.error('❌ Processing failed with error:', error)
      console.error('📍 Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }
    }
  }

  private async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string | null> {
    try {
      console.log('🌐 Translating:', { sourceLanguage, targetLanguage, textLength: text.length })
      
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'text'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Translation API Error:', response.status, errorText)
        return null
      }

      const data = await response.json()
      console.log('📦 Translation response:', data)

      const translatedText = data.data?.translations?.[0]?.translatedText
      if (translatedText) {
        return translatedText
      } else {
        console.error('❌ No translation in response')
        return null
      }
    } catch (error) {
      console.error('❌ Translation request failed:', error)
      return null
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        if (base64) {
          resolve(base64)
        } else {
          reject(new Error('Failed to convert blob to base64'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
