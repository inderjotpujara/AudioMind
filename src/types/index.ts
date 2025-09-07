// Core Data Models
export interface AudioSession {
  id: string;
  userId?: string;

  // File metadata
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration: number;
  sampleRate?: number;
  channels?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;

  // Processing status
  status: ProcessingStatus;
  progress: number;

  // Processing results
  transcription?: TranscriptionResult;
  summary?: SummaryResult;
  tasks: Task[];
  tags: string[];
  categories: string[];

  // Storage references
  audioBlobId?: string;
  thumbnailUrl?: string;

  // User preferences
  isFavorite: boolean;
  retentionDate?: Date;
  customMetadata: Record<string, any>;
}

export enum ProcessingStatus {
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

export interface Task {
  id: string;
  sessionId: string;
  userId?: string;

  // Task content
  title: string;
  description?: string;
  category?: string;

  // Timing
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dueDate?: Date;

  // Status and priority
  status: TaskStatus;
  priority: TaskPriority;
  completed: boolean;

  // Source information
  sourceSegmentId?: string;
  sourceText?: string;

  // User assignments
  assignee?: string;
  tags: string[];

  // Metadata
  confidence: number;
  customFields: Record<string, any>;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// API Types
export interface SpeechConfig {
  encoding: 'LINEAR16' | 'FLAC' | 'MULAW' | 'AMR' | 'AMR_WB' | 'OGG_OPUS' | 'SPEEX_WITH_HEADER_BYTE' | 'WEBM_OPUS';
  sampleRateHertz?: 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000; // Made optional
  languageCode: string;
  enableSpeakerDiarization?: boolean;
  enableAutomaticPunctuation?: boolean;
  enableWordTimeOffsets?: boolean;
  model?: 'latest_long' | 'latest_short' | 'command_and_search' | 'phone_call' | 'video' | 'default';
  useEnhanced?: boolean;
  // Speaker diarization config
  diarizationSpeakerCount?: number;
  minSpeakerCount?: number;
  maxSpeakerCount?: number;
}

export interface TranscriptionResult {
  provider: 'google' | 'azure' | 'local';
  model: string;
  language: string;
  confidence: number;
  audioDuration: number;
  processingTime: number;
  transcript: string;
  segments: TranscriptionSegment[];
  speakers?: SpeakerInfo[];
}

export interface TranscriptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  words?: WordInfo[];
  speakerId?: number;
}

export interface WordInfo {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface SpeakerInfo {
  id: number;
  name: string;
  segments: TranscriptionSegment[];
  totalDuration: number;
  color: string;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  topics: string[];
  provider: 'google' | 'local';
  model: string;
  generatedAt: Date;
  confidence: number;
  wordCount: number;
  compressionRatio: number;
  alternatives?: SummaryAlternative[];
}

export interface SummaryAlternative {
  summary: string;
  confidence: number;
  style: 'brief' | 'detailed' | 'bullet_points';
}

// Google API Types
export interface GoogleNLConfig {
  apiKey: string;
  model?: string;
  features: ('entities' | 'sentiment' | 'syntax' | 'categories')[];
  language?: string;
}

export interface GoogleNLResponse {
  documentSentiment?: {
    magnitude: number;
    score: number;
  };
  language: string;
  entities?: Array<{
    name: string;
    type: string;
    salience: number;
    mentions?: Array<{
      text: {
        content: string;
        beginOffset: number;
      };
      type: string;
    }>;
  }>;
  categories?: Array<{
    name: string;
    confidence: number;
  }>;
}

// Component Props Types
export interface UploadZoneProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  loading?: boolean;
  onFilesSelected: (files: File[]) => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
}

export interface AudioPlayerProps {
  src: string;
  duration?: number;
  waveformData?: number[];
  showWaveform?: boolean;
  showTimestamps?: boolean;
  onTimeUpdate?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

// Utility Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FormField<T = any> {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  value: T;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  validation?: (value: T) => string | null;
}

export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// UI State Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ProcessingOptions {
  language?: string;
  enableSpeakerDiarization: boolean;
  enablePunctuation: boolean;
  enableWordTimestamps: boolean;
  generateSummary: boolean;
  extractTasks: boolean;
  summaryLength: 'short' | 'medium' | 'long';
}

export interface ProcessingResult {
  success: boolean;
  transcription?: TranscriptionResult;
  summary?: SummaryResult;
  tasks: Task[];
  metadata?: {
    duration: number;
    sampleRate: number;
    channels: number;
    format: string;
  };
  error?: string;
  processingTime: number;
}

// User Settings Types
export interface UserSettings {
  // Audio processing settings
  defaultLanguage: string;
  transcriptionProvider: 'google';
  summarizationProvider: 'google';

  // Privacy settings
  dataRetentionDays: number;
  autoDeleteOldSessions: boolean;
  cloudBackupEnabled: boolean;

  // UI settings
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;

  // Notification settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  processingCompleteNotification: boolean;
  taskReminderNotification: boolean;

  // Performance settings
  maxConcurrentUploads: number;
  lowQualityMode: boolean;
  offlineMode: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  stack?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Audio File Types
export const AUDIO_TYPES = [
  'audio/mpeg',     // .mp3
  'audio/wav',      // .wav
  'audio/webm',     // .webm
  'audio/ogg',      // .ogg
  'audio/mp4',      // .mp4, .m4a
  'audio/aac',      // .aac
  'audio/flac',     // .flac
] as const;

export type AudioMimeType = typeof AUDIO_TYPES[number];

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
