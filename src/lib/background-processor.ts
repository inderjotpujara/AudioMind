import { AudioProcessingService } from './audio-processing'
import { useAudioSessionsStore } from '@/stores/audio-sessions'
import { useUIStore } from '@/stores/ui'

export interface ProcessingQueueItem {
  id: string
  file: File
  sessionId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  stage: string
  startedAt?: Date
  completedAt?: Date
  error?: string
}

class BackgroundProcessor {
  private queue: ProcessingQueueItem[] = []
  private isProcessing = false
  private maxConcurrent = 2
  private processingService?: AudioProcessingService

  setProcessingService(service: AudioProcessingService) {
    this.processingService = service
  }

  async addToQueue(files: File[]): Promise<string[]> {
    const { addSession } = useAudioSessionsStore.getState()
    const sessionIds: string[] = []

    files.forEach(file => {
      // Create session immediately
      const session = addSession({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        duration: 0,
        status: 'pending' as any,
        progress: 0,
        tasks: [],
        tags: [],
        categories: [],
        isFavorite: false,
        customMetadata: {},
      })

      sessionIds.push(session.id)

      // Add to processing queue
      const queueItem: ProcessingQueueItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        sessionId: session.id,
        status: 'pending',
        progress: 0,
        stage: 'Queued for processing'
      }

      this.queue.push(queueItem)
    })

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing()
    }

    return sessionIds
  }

  private async startProcessing() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true
    const { addNotification } = useUIStore.getState()

    while (this.queue.length > 0) {
      // Get pending items up to maxConcurrent
      const pendingItems = this.queue
        .filter(item => item.status === 'pending')
        .slice(0, this.maxConcurrent)

      if (pendingItems.length === 0) {
        // Wait for current processing to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }

      // Process items concurrently
      const processingPromises = pendingItems.map(item => this.processItem(item))
      await Promise.all(processingPromises)
    }

    this.isProcessing = false

    // Notify user when all processing is complete
    addNotification({
      type: 'success',
      title: 'Processing Complete',
      message: 'All audio files have been processed successfully!',
      duration: 5000
    })
  }

  private async processItem(item: ProcessingQueueItem) {
    if (!this.processingService) {
      this.markItemFailed(item, 'Processing service not available')
      return
    }

    const { updateSession } = useAudioSessionsStore.getState()
    const { addNotification } = useUIStore.getState()

    try {
      // Mark as processing
      item.status = 'processing'
      item.startedAt = new Date()
      
      updateSession(item.sessionId, {
        status: 'transcribing' as any,
        progress: 0
      })

      // Process the audio
      const result = await this.processingService.processAudio(
        item.file,
        {
          language: 'en-US',
          enableSpeakerDiarization: true,
          enablePunctuation: true,
          enableWordTimestamps: true,
          generateSummary: true,
          extractTasks: false,
          summaryLength: 'medium'
        },
        (progress, stage) => {
          item.progress = progress
          item.stage = stage
          
          updateSession(item.sessionId, {
            progress: progress
          })
        }
      )

      if (result.success && result.transcription) {
        // Update session with results
        updateSession(item.sessionId, {
          status: 'completed' as any,
          progress: 100,
          transcription: result.transcription,
          summary: result.summary?.summary,
          duration: result.metadata?.duration || 0,
          processedAt: new Date()
        })

        // Mark item as completed
        item.status = 'completed'
        item.completedAt = new Date()
        item.progress = 100
        item.stage = 'Completed'

        // Notify user
        addNotification({
          type: 'success',
          title: 'File Processed',
          message: `${item.file.name} has been processed successfully!`,
          duration: 3000,
          action: {
            label: 'View',
            onClick: () => {
              // Navigate to session
              window.location.href = `/session/${item.sessionId}`
            }
          }
        })

        // Remove from queue
        this.queue = this.queue.filter(q => q.id !== item.id)

      } else {
        this.markItemFailed(item, result.error || 'Processing failed')
      }

    } catch (error) {
      this.markItemFailed(item, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  private markItemFailed(item: ProcessingQueueItem, error: string) {
    const { updateSession } = useAudioSessionsStore.getState()
    const { addNotification } = useUIStore.getState()

    item.status = 'failed'
    item.error = error
    item.completedAt = new Date()

    updateSession(item.sessionId, {
      status: 'failed' as any,
      progress: 0
    })

    addNotification({
      type: 'error',
      title: 'Processing Failed',
      message: `Failed to process ${item.file.name}: ${error}`,
      duration: 0 // Persistent error notification
    })

    // Remove from queue
    this.queue = this.queue.filter(q => q.id !== item.id)
  }

  getQueue(): ProcessingQueueItem[] {
    return [...this.queue]
  }

  getQueueStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      processing: this.queue.filter(item => item.status === 'processing').length,
      completed: this.queue.filter(item => item.status === 'completed').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
      isProcessing: this.isProcessing
    }
  }

  retryFailedItem(itemId: string) {
    const item = this.queue.find(q => q.id === itemId)
    if (item && item.status === 'failed') {
      item.status = 'pending'
      item.error = undefined
      item.progress = 0
      item.stage = 'Queued for retry'

      if (!this.isProcessing) {
        this.startProcessing()
      }
    }
  }

  cancelItem(itemId: string) {
    this.queue = this.queue.filter(q => q.id !== itemId)
  }

  clearCompleted() {
    this.queue = this.queue.filter(item => item.status !== 'completed')
  }
}

// Global singleton instance
export const backgroundProcessor = new BackgroundProcessor()
