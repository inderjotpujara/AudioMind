# API Integration Documentation

## Overview

Audio Journal integrates with external APIs for speech-to-text transcription and AI-powered summarization while maintaining a privacy-first approach.

## Google Cloud Speech-to-Text API

### Configuration
```typescript
interface SpeechConfig {
  encoding: 'WEBM_OPUS' | 'MP3' | 'WAV' | 'M4A';
  sampleRateHertz: 16000 | 44100 | 48000;
  languageCode: string; // e.g., 'en-US', 'es-ES'
  enableSpeakerDiarization: boolean;
  enableAutomaticPunctuation: boolean;
  enableWordTimeOffsets: boolean;
  model: 'latest_long' | 'latest_short';
  useEnhanced: boolean; // Enhanced models for better accuracy
}
```

### API Endpoints

#### Speech Recognition
```typescript
// Synchronous recognition (up to 1 minute)
POST /v1/speech:recognize

// Asynchronous recognition (up to 480 minutes)
POST /v1/speech:longrunningrecognize
GET /v1/operations/{operationId}
```

### Request/Response Format
```typescript
interface SpeechRequest {
  config: SpeechConfig;
  audio: {
    content: string; // Base64 encoded audio
    uri?: string;    // GCS URI for large files
  };
}

interface SpeechResponse {
  results: Array<{
    alternatives: Array<{
      transcript: string;
      confidence: number;
      words: Array<{
        word: string;
        startTime: string; // e.g., "1.5s"
        endTime: string;
        speakerTag?: number;
      }>;
    }>;
  }>;
}
```

### Cost Optimization
```typescript
interface CostCalculator {
  // Base costs (per minute)
  standard: {
    'en-US': 0.006,
    'es-ES': 0.007,
    other: 0.012
  };

  // Enhanced model multiplier
  enhancedMultiplier: 2.0;

  // Speaker diarization cost
  diarizationCost: 0.001; // per minute
}

function estimateCost(
  audio: Blob,
  config: SpeechConfig,
  durationMinutes: number
): number {
  const baseRate = config.languageCode.startsWith('en')
    ? 0.006
    : 0.012;

  let cost = baseRate * durationMinutes;

  if (config.useEnhanced) {
    cost *= 2.0;
  }

  if (config.enableSpeakerDiarization) {
    cost += 0.001 * durationMinutes;
  }

  return cost;
}
```

## OpenAI API Integration

### Configuration
```typescript
interface OpenAIConfig {
  apiKey: string;
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo-preview';
  temperature: number; // 0.0 - 2.0
  maxTokens: number;
  presencePenalty: number; // -2.0 - 2.0
  frequencyPenalty: number; // -2.0 - 2.0
}
```

### Summarization API
```typescript
interface SummarizationRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
}

const summarizationPrompt = `You are an expert at summarizing audio transcriptions.

Please provide a concise but comprehensive summary of the following transcription.
Focus on the main topics, key decisions, and action items discussed.

Transcription:
{transcript}

Summary:`;

function createSummaryRequest(
  transcript: string,
  config: OpenAIConfig
): SummarizationRequest {
  return {
    model: config.model,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that summarizes audio transcriptions.'
      },
      {
        role: 'user',
        content: summarizationPrompt.replace('{transcript}', transcript)
      }
    ],
    temperature: 0.3,
    max_tokens: 500
  };
}
```

### Task Extraction API
```typescript
const taskExtractionPrompt = `Extract all tasks, action items, and follow-ups from the following transcription.

For each task, provide:
- Title: Brief description of the task
- Description: Additional context if available
- Priority: high, medium, or low
- Due Date: If mentioned in the transcription

Format as JSON array of tasks.

Transcription:
{transcript}

Tasks:`;

interface ExtractedTask {
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  assignee?: string;
}

function extractTasks(
  transcript: string,
  config: OpenAIConfig
): Promise<ExtractedTask[]> {
  const request = {
    model: config.model,
    messages: [
      {
        role: 'system',
        content: 'You are a task extraction specialist.'
      },
      {
        role: 'user',
        content: taskExtractionPrompt.replace('{transcript}', transcript)
      }
    ],
    temperature: 0.2,
    max_tokens: 1000
  };

  return openai.chat.completions.create(request)
    .then(response => JSON.parse(response.choices[0].message.content));
}
```

### Smart Categorization API
```typescript
const categorizationPrompt = `Categorize the following transcription into relevant tags and categories.

Consider topics like:
- Work/Professional
- Personal
- Meeting
- Interview
- Lecture
- Journal
- Planning
- Problem Solving
- etc.

Return a JSON array of relevant tags.

Transcription:
{transcript}

Tags:`;

function categorizeContent(
  transcript: string,
  config: OpenAIConfig
): Promise<string[]> {
  const request = {
    model: config.model,
    messages: [
      {
        role: 'system',
        content: 'You are a content categorization specialist.'
      },
      {
        role: 'user',
        content: categorizationPrompt.replace('{transcript}', transcript)
      }
    ],
    temperature: 0.1,
    max_tokens: 200
  };

  return openai.chat.completions.create(request)
    .then(response => JSON.parse(response.choices[0].message.content));
}
```

## Error Handling & Retry Logic

### API Error Types
```typescript
interface APIError {
  code: number;
  message: string;
  details?: any;
}

class APIErrorHandler {
  static isRetryableError(error: APIError): boolean {
    // 5xx errors are retryable
    if (error.code >= 500) return true;

    // Rate limiting is retryable
    if (error.code === 429) return true;

    // Network errors are retryable
    if (error.code === 0) return true;

    return false;
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = Math.pow(2, attempt) * 1000; // milliseconds
    const jitter = Math.random() * 1000;
    return Math.min(baseDelay + jitter, 30000); // Max 30 seconds
  }
}
```

### Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 60000) { // 1 minute timeout
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= 5) {
      this.state = 'open';
    }
  }
}
```

## Rate Limiting & Cost Management

### Rate Limiting Implementation
```typescript
class RateLimiter {
  private requests: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time until oldest request expires
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);

      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForSlot(); // Recursively check again
    }

    this.requests.push(now);
  }
}

// Usage
const speechRateLimiter = new RateLimiter(60000, 10); // 10 requests per minute
const openaiRateLimiter = new RateLimiter(60000, 50); // 50 requests per minute
```

### Cost Tracking
```typescript
interface CostTracker {
  monthlyUsage: {
    speechToText: number;
    openai: number;
    total: number;
  };

  dailyUsage: {
    date: string;
    speechToText: number;
    openai: number;
  }[];

  trackSpeechToTextUsage(cost: number): void;
  trackOpenAIUsage(cost: number): void;
  getMonthlyTotal(): number;
  checkBudgetLimit(limit: number): boolean;
}

class CostTrackerImpl implements CostTracker {
  private storage: Storage;

  trackSpeechToTextUsage(cost: number): void {
    const current = this.monthlyUsage.speechToText + cost;
    this.monthlyUsage = {
      ...this.monthlyUsage,
      speechToText: current,
      total: this.monthlyUsage.total + cost
    };
    this.saveToStorage();
  }

  trackOpenAIUsage(cost: number): void {
    const current = this.monthlyUsage.openai + cost;
    this.monthlyUsage = {
      ...this.monthlyUsage,
      openai: current,
      total: this.monthlyUsage.total + cost
    };
    this.saveToStorage();
  }

  checkBudgetLimit(limit: number): boolean {
    return this.monthlyUsage.total <= limit;
  }

  private saveToStorage(): void {
    this.storage.setItem('costTracking', JSON.stringify(this.monthlyUsage));
  }
}
```

## Privacy & Security Considerations

### API Key Management
```typescript
class SecureAPIKeyManager {
  private encryptionKey: CryptoKey;

  async initialize(): Promise<void> {
    // Generate encryption key from user password
    this.encryptionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encryptAPIKey(apiKey: string): Promise<string> {
    const encoded = new TextEncoder().encode(apiKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encoded
    );

    return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)));
  }

  async decryptAPIKey(encryptedKey: string): Promise<string> {
    const data = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  }
}
```

### Data Minimization
- **Local Processing**: Audio files processed client-side when possible
- **Minimal Data**: Only send necessary data to APIs
- **No Storage**: API responses cached temporarily, not stored permanently
- **User Consent**: Explicit permission for each API usage

This API integration strategy ensures reliable, cost-effective, and privacy-respecting external service usage.
