import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AUDIO_TYPES, MAX_FILE_SIZE, ValidationResult, AudioMimeType } from '@/types'

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Validate audio file with comprehensive checks
 */
export function validateAudioFile(file: File): ValidationResult {
  // Validate input
  if (!file || !(file instanceof File)) {
    return {
      valid: false,
      error: 'Invalid file provided'
    };
  }

  // Check file type - be more permissive
  const isValidMimeType = AUDIO_TYPES.includes(file.type as AudioMimeType) || file.type.startsWith('audio/')
  if (!isValidMimeType) {
    return {
      valid: false,
      error: 'Unsupported file type. Please use MP3, WAV, WebM, MP4, AAC, or FLAC files.'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`
    };
  }

  // Check file extension as fallback - only if MIME type check failed
  if (!AUDIO_TYPES.includes(file.type as AudioMimeType)) {
    const extension = getFileExtension(file.name).toLowerCase();
    const validExtensions = ['mp3', 'wav', 'webm', 'ogg', 'mp4', 'm4a', 'aac', 'flac'];
    if (!validExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid file extension.'
      };
    }
  }

  return { valid: true };
}

/**
 * Check if a file is an audio file (legacy function)
 */
export function isAudioFile(file: File): boolean {
  return validateAudioFile(file).valid;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Format date in a human readable format
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if the app is running in development mode
 */
export const isDevelopment = import.meta.env.DEV

/**
 * Check if the app is running in production mode
 */
export const isProduction = import.meta.env.PROD

/**
 * Get environment variable with fallback
 */
export function getEnvVar(key: string, fallback: string = ''): string {
  return import.meta.env[key] || fallback
}

/**
 * Extract audio metadata from file
 */
export async function extractAudioMetadata(file: File): Promise<{
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
  format: string;
}> {
  // Validate input
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file provided to extractAudioMetadata')
  }

  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve({
          duration: audio.duration,
          sampleRate: 44100, // Default, would need more advanced parsing
          channels: 2,       // Default, would need more advanced parsing
          bitrate: 128,      // Default, would need more advanced parsing
          format: file.type
        });
      });

      audio.addEventListener('error', (error) => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load audio metadata: ${error}`));
      });

      // Set timeout to prevent hanging
      setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error('Timeout loading audio metadata'));
      }, 10000); // 10 second timeout

      audio.src = url;
    } catch (error) {
      reject(new Error(`Error creating audio metadata: ${error}`));
    }
  });
}

/**
 * Convert blob to base64
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        const base64 = result.split(',')[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error('Failed to extract base64 from file'));
        }
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Get speaker color for visualization
 */
export function getSpeakerColor(speakerId: number): string {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
  ];
  const index = (speakerId - 1) % colors.length;
  return colors[index] || colors[0]!;
}

/**
 * Highlight text with query
 */
export function highlightText(text: string, query: string): string {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Local storage utilities with error handling
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Create app error with metadata
 */
export function createAppError(code: string, message: string, details?: Record<string, any>): Error {
  const error = new Error(message);
  (error as any).code = code;
  (error as any).details = details;
  (error as any).timestamp = new Date();
  return error;
}

