import { GoogleNLConfig, GoogleNLResponse, SummaryResult, Task, TaskPriority, TaskStatus } from '@/types'
import { generateId } from '@/lib/utils'

interface GoogleNLRequest {
  document: {
    type: 'PLAIN_TEXT'
    content: string
    language?: string
  }
  features: {
    extractSyntax?: boolean
    extractEntities?: boolean
    extractDocumentSentiment?: boolean
    extractEntitySentiment?: boolean
    classifyText?: boolean
  }
  encodingType?: 'UTF8' | 'UTF16' | 'UTF32'
}

export class GoogleNaturalLanguageService {
  private readonly apiKey: string
  private readonly baseUrl = 'https://language.googleapis.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async analyzeText(
    text: string,
    features: GoogleNLConfig['features'] = ['entities', 'sentiment', 'categories']
  ): Promise<GoogleNLResponse> {
    const request: GoogleNLRequest = {
      document: {
        type: 'PLAIN_TEXT',
        content: text,
      },
      features: {
        extractEntities: features.includes('entities'),
        extractDocumentSentiment: features.includes('sentiment'),
        classifyText: features.includes('categories'),
        extractSyntax: features.includes('syntax'),
      },
      encodingType: 'UTF8',
    }

    const response = await fetch(
      `${this.baseUrl}/documents:annotateText?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Google NL API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || ''
        }`
      )
    }

    return response.json()
  }

  async generateSummary(
    transcript: string,
    config: GoogleNLConfig
  ): Promise<SummaryResult> {
    try {
      const analysis = await this.analyzeText(transcript, config.features)

      // Extract key information from the analysis
      const entities = analysis.entities || []
      const categories = analysis.categories || []
      // const sentiment = analysis.documentSentiment

      // Generate summary using extracted information
      const summary = this.buildSummaryFromAnalysis(analysis, transcript)
      const keyPoints = this.extractKeyPoints(entities, transcript)
      const topics = this.extractTopics(entities, categories)

      return {
        summary,
        keyPoints,
        topics,
        provider: 'google',
        model: config.model || 'v1',
        generatedAt: new Date(),
        confidence: 0.85, // Google NL typically provides high confidence
        wordCount: summary.split(' ').length,
        compressionRatio: transcript.length / summary.length,
      }
    } catch (error) {
      throw new Error(
        `Summary generation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  async extractTasks(
    transcript: string,
    sessionId: string
  ): Promise<Task[]> {
    try {
      // const analysis = await this.analyzeText(transcript, ['entities', 'syntax'])

      const tasks: Task[] = []
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10)

      // Look for action-oriented language patterns
      const actionPatterns = [
        /\b(?:need to|should|must|will|going to|plan to|schedule|meeting|deadline|due|remind|todo|task)\b/gi,
        /\b(?:call|email|send|contact|follow up|check|review|update|complete|finish)\b/gi,
        /\b(?:buy|purchase|order|get|obtain|acquire)\b/gi,
        /\b(?:book|reserve|appointment|meeting|call)\b/gi,
      ]

      sentences.forEach((sentence) => {
        const trimmedSentence = sentence.trim()
        
        // Check if sentence contains action patterns
        const hasActionPattern = actionPatterns.some(pattern => 
          pattern.test(trimmedSentence)
        )

        if (hasActionPattern && trimmedSentence.length > 20) {
          // Extract potential due dates
          const dueDate = this.extractDueDate(trimmedSentence)
          
          // Determine priority based on urgency words
          const priority = this.determinePriority(trimmedSentence)

          // Extract title (first few words or until comma/period)
          const title = this.extractTaskTitle(trimmedSentence)

          if (title.length > 5) { // Ensure we have a meaningful title
            tasks.push({
              id: generateId(),
              sessionId,
              title,
              description: trimmedSentence,
              createdAt: new Date(),
              updatedAt: new Date(),
              status: TaskStatus.TODO,
              priority,
              completed: false,
              tags: this.extractTaskTags(trimmedSentence),
              confidence: 0.7, // Lower confidence for extracted tasks
              customFields: {},
              ...(dueDate && { dueDate }),
              sourceText: trimmedSentence,
            })
          }
        }
      })

      // Limit to top 10 tasks to avoid overwhelming the user
      return tasks.slice(0, 10)
    } catch (error) {
      console.error('Task extraction failed:', error)
      return []
    }
  }

  private buildSummaryFromAnalysis(
    analysis: GoogleNLResponse,
    originalText: string
  ): string {
    const entities = analysis.entities || []
    const sentiment = analysis.documentSentiment
    const categories = analysis.categories || []

    let summary = ''

    // Add sentiment context
    if (sentiment) {
      if (sentiment.score > 0.3) {
        summary += 'The discussion was generally positive. '
      } else if (sentiment.score < -0.3) {
        summary += 'The discussion addressed some challenges. '
      }
    }

    // Add main topics from entities
    const topEntities = entities
      .filter(e => e.salience && e.salience > 0.1)
      .sort((a, b) => (b.salience || 0) - (a.salience || 0))
      .slice(0, 5)

    if (topEntities.length > 0) {
      const entityNames = topEntities.map(e => e.name)
      summary += `Key topics discussed include: ${entityNames.slice(0, 3).join(', ')}`
      
      if (entityNames.length > 3) {
        summary += ` and ${entityNames.length - 3} other topics`
      }
      summary += '. '
    }

    // Add category information
    if (categories.length > 0) {
      const topCategory = categories[0]
      if (topCategory) {
        const categoryName = topCategory.name.split('/').pop()
        if (categoryName) {
          summary += `This appears to be primarily about ${categoryName}. `
        }
      }
    }

    // If summary is too short, add extractive content
    if (summary.length < 100) {
      const sentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 20)
      const additionalContent = sentences.slice(0, 2).join('. ').trim()
      summary += additionalContent + '.'
    }

    return summary.trim()
  }

  private extractKeyPoints(
    entities: GoogleNLResponse['entities'] = [],
    transcript: string
  ): string[] {
    const keyPoints: string[] = []
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 20)

    // Get high-salience entities
    const importantEntities = entities
      .filter(e => e.salience && e.salience > 0.05)
      .slice(0, 8)

    // Find sentences containing important entities
    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase().trim()
      const hasImportantEntity = importantEntities.some(entity =>
        sentenceLower.includes(entity.name.toLowerCase())
      )

      if (hasImportantEntity && sentence.length > 30 && sentence.length < 200) {
        keyPoints.push(sentence.trim())
      }
    })

    // Also add sentences with decision or conclusion words
    const conclusionPatterns = /\b(?:decided|concluded|agreed|determined|resolved|final|outcome|result)\b/gi
    sentences.forEach(sentence => {
      if (conclusionPatterns.test(sentence) && sentence.length > 30 && sentence.length < 200) {
        keyPoints.push(sentence.trim())
      }
    })

    // Remove duplicates and return top 8
    return [...new Set(keyPoints)].slice(0, 8)
  }

  private extractTopics(
    entities: GoogleNLResponse['entities'] = [],
    categories: GoogleNLResponse['categories'] = []
  ): string[] {
    const topics = new Set<string>()

    // Add topics from categories
    categories.forEach(category => {
      if (category.confidence > 0.7) {
        const topic = category.name.split('/').pop()
        if (topic) {
          topics.add(topic.replace(/([A-Z])/g, ' $1').trim())
        }
      }
    })

    // Add topics from high-salience entities
    entities.forEach(entity => {
      if (entity.salience && entity.salience > 0.1) {
        topics.add(entity.name)
      }
    })

    return Array.from(topics).slice(0, 10)
  }

  private extractDueDate(text: string): Date | undefined {
    const now = new Date()
    
    // Look for relative dates
    const tomorrow = /\b(tomorrow)\b/i
    const nextWeek = /\b(next week)\b/i
    const thisWeek = /\b(this week|by friday|by the end of the week)\b/i
    const nextMonth = /\b(next month)\b/i

    if (tomorrow.test(text)) {
      const date = new Date(now)
      date.setDate(date.getDate() + 1)
      return date
    }

    if (thisWeek.test(text)) {
      const date = new Date(now)
      date.setDate(date.getDate() + (5 - date.getDay())) // Friday
      return date
    }

    if (nextWeek.test(text)) {
      const date = new Date(now)
      date.setDate(date.getDate() + 7)
      return date
    }

    if (nextMonth.test(text)) {
      const date = new Date(now)
      date.setMonth(date.getMonth() + 1)
      return date
    }

    return undefined
  }

  private determinePriority(text: string): TaskPriority {
    const urgentWords = /\b(urgent|asap|immediately|critical|emergency)\b/i
    const highWords = /\b(important|priority|soon|deadline)\b/i
    const lowWords = /\b(sometime|eventually|when possible|low priority)\b/i

    if (urgentWords.test(text)) return TaskPriority.URGENT
    if (highWords.test(text)) return TaskPriority.HIGH
    if (lowWords.test(text)) return TaskPriority.LOW
    return TaskPriority.MEDIUM
  }

  private extractTaskTitle(text: string): string {
    // Take first meaningful part of the sentence
    const words = text.split(' ')
    let title = ''
    
    for (let i = 0; i < Math.min(words.length, 8); i++) {
      const word = words[i];
      if (word) {
        title += word + ' ';
        // Stop at punctuation or when we have enough words
        if (/[,.;:]/.test(word) || title.length > 50) {
          break;
        }
      }
    }

    return title.trim().replace(/[,.;:]$/, '')
  }

  private extractTaskTags(text: string): string[] {
    const tags: string[] = []
    
    if (/\b(meeting|call|conference)\b/i.test(text)) tags.push('meeting')
    if (/\b(email|send|contact)\b/i.test(text)) tags.push('communication')
    if (/\b(buy|purchase|order)\b/i.test(text)) tags.push('shopping')
    if (/\b(review|check|analyze)\b/i.test(text)) tags.push('review')
    if (/\b(deadline|due|urgent)\b/i.test(text)) tags.push('deadline')
    
    return tags
  }
}
