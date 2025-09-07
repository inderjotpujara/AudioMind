# Data Models & Schemas

## Overview

This document defines the data structures and schemas used throughout the Audio Journal PWA application.

## Core Entities

### AudioSession

Represents a complete audio processing session from upload to results.

```typescript
interface AudioSession {
  // Primary identifiers
  id: string;                    // UUID v4
  userId?: string;              // Optional for multi-user support

  // File metadata
  fileName: string;             // Original filename
  fileSize: number;             // Size in bytes
  mimeType: string;             // MIME type (audio/*)
  duration: number;             // Duration in seconds
  sampleRate: number;           // Audio sample rate (Hz)
  channels: number;             // Number of audio channels

  // Timestamps
  createdAt: Date;              // Session creation time
  updatedAt: Date;              // Last modification time
  processedAt?: Date;           // Processing completion time

  // Processing status
  status: ProcessingStatus;     // Current processing state
  progress: number;             // Progress percentage (0-100)

  // Processing results
  transcription?: TranscriptionResult;
  summary?: SummaryResult;
  tasks: Task[];                // Extracted tasks
  tags: string[];               // User-defined tags
  categories: string[];         // Auto-generated categories

  // Storage references
  audioBlobId?: string;         // Reference to stored audio blob
  thumbnailUrl?: string;        // Generated waveform thumbnail

  // User preferences
  isFavorite: boolean;          // User favorite flag
  retentionDate?: Date;         // Auto-deletion date
  customMetadata: Record<string, any>; // Extensible metadata
}
```

### ProcessingStatus Enum

```typescript
enum ProcessingStatus {
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  VALIDATING = 'validating',
  TRANSCRIBING = 'transcribing',
  SUMMARIZING = 'summarizing',
  EXTRACTING_TASKS = 'extracting_tasks',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

## Transcription Data

### TranscriptionResult

Contains the complete transcription data from speech-to-text processing.

```typescript
interface TranscriptionResult {
  // Metadata
  provider: 'google' | 'azure' | 'local';  // Transcription service used
  model: string;                          // Model version/name
  language: string;                       // Detected/requested language
  confidence: number;                     // Overall confidence score (0-1)

  // Timing information
  audioDuration: number;                  // Original audio duration
  processingTime: number;                 // Processing time in seconds

  // Transcription content
  transcript: string;                     // Full text transcript
  segments: TranscriptionSegment[];       // Segmented transcription

  // Speaker information (if available)
  speakers?: SpeakerInfo[];               // Speaker identification data

  // Quality metrics
  wordCount: number;                      // Total words transcribed
  errorRate?: number;                     // Word error rate if available
}
```

### TranscriptionSegment

Individual segments of the transcription with timing information.

```typescript
interface TranscriptionSegment {
  id: string;                            // Unique segment identifier
  startTime: number;                     // Start time in seconds
  endTime: number;                       // End time in seconds
  text: string;                          // Segment text
  confidence: number;                    // Confidence score (0-1)

  // Word-level timing (optional)
  words?: WordTiming[];                  // Individual word timings

  // Speaker information
  speakerId?: number;                    // Speaker identifier
  speakerName?: string;                  // Speaker name/label
}
```

### WordTiming

Word-level timing information for precise navigation.

```typescript
interface WordTiming {
  word: string;                          // The word text
  startTime: number;                     // Start time in seconds
  endTime: number;                       // End time in seconds
  confidence: number;                    // Word confidence (0-1)
}
```

### SpeakerInfo

Information about identified speakers in the audio.

```typescript
interface SpeakerInfo {
  id: number;                            // Speaker identifier
  name?: string;                         // Assigned speaker name
  segments: number[];                    // Array of segment IDs for this speaker
  totalDuration: number;                 // Total speaking time in seconds
  color?: string;                        // UI display color
}
```

## AI Processing Results

### SummaryResult

Contains AI-generated summary of the transcription.

```typescript
interface SummaryResult {
  // Summary content
  summary: string;                       // Main summary text
  keyPoints: string[];                   // Bullet points of key information
  topics: string[];                      // Identified topics/themes

  // Metadata
  provider: 'openai' | 'anthropic' | 'local'; // AI service used
  model: string;                         // Model version
  generatedAt: Date;                     // Generation timestamp

  // Quality metrics
  confidence: number;                    // Summary confidence (0-1)
  wordCount: number;                     // Summary length
  compressionRatio: number;              // Original/ summary ratio

  // Alternative versions
  alternatives?: SummaryAlternative[];   // Alternative summary versions
}
```

### SummaryAlternative

Alternative summary versions for user selection.

```typescript
interface SummaryAlternative {
  type: 'concise' | 'detailed' | 'action-focused' | 'technical';
  summary: string;
  keyPoints: string[];
  selected: boolean;                     // User selection flag
}
```

## Task Management

### Task

Represents an actionable item extracted from audio content.

```typescript
interface Task {
  // Identifiers
  id: string;                            // Unique task identifier
  sessionId: string;                     // Parent session ID
  userId?: string;                       // Optional user association

  // Task content
  title: string;                         // Task title/summary
  description?: string;                  // Detailed description
  category?: string;                     // Task category

  // Timing
  createdAt: Date;                       // Creation timestamp
  updatedAt: Date;                       // Last modification
  completedAt?: Date;                    // Completion timestamp
  dueDate?: Date;                        // Due date

  // Status and priority
  status: TaskStatus;                    // Current status
  priority: TaskPriority;                // Priority level
  completed: boolean;                    // Completion flag

  // Source information
  sourceSegmentId?: string;              // Source transcription segment
  sourceText?: string;                   // Original text that generated task

  // User assignments
  assignee?: string;                     // Assigned person
  tags: string[];                        // User-defined tags

  // Metadata
  confidence: number;                    // AI confidence score (0-1)
  customFields: Record<string, any>;     // Extensible custom fields
}
```

### TaskStatus Enum

```typescript
enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DEFERRED = 'deferred'
}
```

### TaskPriority Enum

```typescript
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}
```

## User Preferences & Settings

### UserSettings

User configuration and preferences.

```typescript
interface UserSettings {
  // Audio processing preferences
  defaultLanguage: string;               // Default transcription language
  transcriptionProvider: 'google' | 'azure' | 'auto';
  summarizationProvider: 'openai' | 'anthropic' | 'auto';

  // Privacy settings
  dataRetentionDays: number;             // Days to keep data (0 = forever)
  autoDeleteOldSessions: boolean;        // Enable auto-deletion
  cloudBackupEnabled: boolean;           // Enable cloud backup

  // UI preferences
  theme: 'light' | 'dark' | 'auto';      // Theme preference
  language: string;                      // UI language
  timezone: string;                      // User timezone

  // Notification settings
  emailNotifications: boolean;           // Email notifications
  pushNotifications: boolean;            // Push notifications
  processingCompleteNotification: boolean; // Notify when processing done
  taskReminderNotification: boolean;     // Task reminders

  // Performance settings
  maxConcurrentUploads: number;          // Max simultaneous uploads
  lowQualityMode: boolean;               // Reduce quality for performance
  offlineMode: boolean;                  // Enable offline capabilities

  // Advanced settings
  apiKeys: {                             // Encrypted API keys
    googleCloud?: string;
    openai?: string;
    anthropic?: string;
  };
  customPrompts: Record<string, string>; // Custom AI prompts
  exportFormats: string[];               // Preferred export formats
}
```

## Storage & Caching

### CacheEntry

Structure for cached API responses and computed data.

```typescript
interface CacheEntry<T = any> {
  key: string;                          // Cache key
  data: T;                              // Cached data
  timestamp: Date;                      // Cache timestamp
  expiresAt?: Date;                     // Expiration date
  size: number;                         // Data size in bytes
  accessCount: number;                  // Access frequency
  lastAccessed: Date;                   // Last access time
}
```

### StorageStats

Storage usage and statistics.

```typescript
interface StorageStats {
  totalSize: number;                    // Total storage used (bytes)
  sessionsCount: number;                // Number of sessions
  audioSize: number;                    // Audio files size
  transcriptionSize: number;            // Transcription data size
  tasksCount: number;                   // Total tasks
  oldestSession: Date;                  // Oldest session date
  newestSession: Date;                  // Newest session date

  // Breakdown by type
  breakdown: {
    audio: number;
    transcriptions: number;
    summaries: number;
    tasks: number;
    metadata: number;
  };

  // Usage trends
  dailyUploads: Array<{
    date: string;
    count: number;
    size: number;
  }>;
}
```

## API Request/Response Models

### ProcessingRequest

Request structure for audio processing jobs.

```typescript
interface ProcessingRequest {
  sessionId: string;                    // Session identifier
  audioBlob: Blob;                      // Audio file blob
  options: ProcessingOptions;           // Processing configuration

  // Callbacks (for progress updates)
  onProgress?: (progress: number) => void;
  onComplete?: (result: ProcessingResult) => void;
  onError?: (error: Error) => void;
}
```

### ProcessingOptions

Configuration options for audio processing.

```typescript
interface ProcessingOptions {
  // Transcription settings
  language?: string;                    // Language code
  enableSpeakerDiarization: boolean;    // Speaker identification
  enablePunctuation: boolean;           // Automatic punctuation
  enableWordTimestamps: boolean;        // Word-level timing

  // AI processing settings
  generateSummary: boolean;             // Generate AI summary
  extractTasks: boolean;                // Extract actionable tasks
  summaryLength: 'short' | 'medium' | 'long'; // Summary length preference

  // Quality settings
  transcriptionModel: string;           // Specific model to use
  priority: 'speed' | 'accuracy';       // Speed vs accuracy trade-off
}
```

### ProcessingResult

Complete result structure from audio processing.

```typescript
interface ProcessingResult {
  sessionId: string;                    // Session identifier
  success: boolean;                     // Processing success flag
  error?: string;                       // Error message if failed

  // Results
  transcription?: TranscriptionResult;
  summary?: SummaryResult;
  tasks?: Task[];

  // Metadata
  processingTime: number;               // Total processing time
  cost?: number;                        // Processing cost (if applicable)
  apiCalls: number;                     // Number of API calls made

  // Quality metrics
  quality: {
    transcription: number;              // Transcription quality (0-1)
    summary: number;                    // Summary quality (0-1)
    tasks: number;                      // Task extraction quality (0-1)
  };
}
```

## Export/Import Models

### ExportFormat

Structure for exporting session data.

```typescript
interface ExportFormat {
  format: 'json' | 'txt' | 'pdf' | 'docx' | 'html';
  includeAudio: boolean;                // Include original audio
  includeTranscription: boolean;        // Include transcription
  includeSummary: boolean;              // Include AI summary
  includeTasks: boolean;                // Include extracted tasks
  includeMetadata: boolean;             // Include session metadata

  // Format-specific options
  options?: {
    // PDF options
    pageSize?: 'a4' | 'letter';
    includeTimestamps?: boolean;

    // Text options
    includeSpeakerNames?: boolean;
    formatTimestamps?: boolean;
  };
}
```

### ImportData

Structure for importing external data.

```typescript
interface ImportData {
  version: string;                      // Import format version
  sessions: AudioSession[];             // Sessions to import
  tasks: Task[];                        // Tasks to import
  settings?: Partial<UserSettings>;     // Settings to import

  // Metadata
  exportedAt: Date;                     // Export timestamp
  exportedBy: string;                   // Export source
  checksum: string;                     // Data integrity checksum
}
```

## Database Schema

### IndexedDB Structure

```typescript
// Database configuration
const DB_CONFIG = {
  name: 'AudioJournal',
  version: 1,
  stores: {
    sessions: {
      keyPath: 'id',
      indexes: [
        'fileName',
        'createdAt',
        'status',
        'tags',
        'categories',
        'isFavorite'
      ]
    },
    tasks: {
      keyPath: 'id',
      indexes: [
        'sessionId',
        'status',
        'priority',
        'dueDate',
        'completed',
        'assignee'
      ]
    },
    cache: {
      keyPath: 'key',
      indexes: [
        'timestamp',
        'expiresAt',
        'lastAccessed'
      ]
    },
    settings: {
      keyPath: 'id'
    }
  }
};
```

This comprehensive data model ensures type safety, efficient storage, and scalable architecture for the Audio Journal PWA.
