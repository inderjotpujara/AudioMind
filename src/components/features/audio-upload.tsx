import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button, Progress, Badge } from '@/components/ui'
import { validateAudioFile, formatFileSize } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface AudioUploadProps {
  onFilesSelected: (files: File[]) => void
  onError?: (error: string) => void
  multiple?: boolean
  maxFiles?: number
  className?: string
  disabled?: boolean
}

interface FileWithPreview extends File {
  preview?: string
  status?: 'pending' | 'uploading' | 'success' | 'error'
  progress?: number
  error?: string
}

export function AudioUpload({
  onFilesSelected,
  onError,
  multiple = false,
  maxFiles = 1,
  className,
  disabled = false
}: AudioUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const firstRejection = rejectedFiles[0]
      const error = firstRejection.errors?.[0]?.message || 'Invalid file'
      onError?.(error)
      return
    }

    // Validate audio files and keep track of valid ones
    const validFiles: File[] = []
    const validFilesWithPreview: FileWithPreview[] = []
    const errors: string[] = []

    for (const file of acceptedFiles) {
      // Skip invalid files
      if (!file || !(file instanceof File)) {
        errors.push('Invalid file detected')
        continue
      }

      const validation = validateAudioFile(file)
      
      if (validation.valid) {
        // Keep the original File object for onFilesSelected
        validFiles.push(file)
        
        // Create FileWithPreview for internal state - properly extending File
        const fileWithPreview = Object.assign(file, {
          status: 'pending' as const,
          progress: 0,
          error: undefined
        }) as FileWithPreview
        
        validFilesWithPreview.push(fileWithPreview)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    }

    if (errors.length > 0) {
      onError?.(errors.join(', '))
      return
    }

    // Use the original File objects for the callback
    const safeValidFiles = validFiles.filter(file => file && file instanceof File)
    
    setSelectedFiles(prev => {
      const newFiles = multiple ? [...prev, ...validFilesWithPreview] : validFilesWithPreview
      return newFiles.slice(0, maxFiles)
    })

    // Only call onFilesSelected if we have valid files
    if (safeValidFiles.length > 0) {
      onFilesSelected(safeValidFiles)
    }
  }, [onFilesSelected, onError, multiple, maxFiles])

  const { getRootProps, getInputProps, isDragActive: dropzoneActive, open } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.webm', '.ogg', '.mp4', '.m4a', '.aac', '.flac']
    },
    multiple,
    maxFiles,
    disabled,
    noClick: false, // Ensure click is enabled
    noKeyboard: false, // Ensure keyboard is enabled
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  })

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setSelectedFiles([])
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive || dropzoneActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'hover:scale-[1.01] active:scale-[0.99]'
        )}
      >
        <input {...getInputProps()} data-testid="file-input" />
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CloudArrowUpIcon
            className={cn(
              'mx-auto h-12 w-12 mb-4 transition-colors',
              isDragActive || dropzoneActive
                ? 'text-blue-500'
                : 'text-gray-400 dark:text-gray-500'
            )}
          />
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {isDragActive ? 'Drop audio files here' : 'Upload audio files'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Supports MP3, WAV, WebM, M4A, AAC, FLAC (max 500MB)
            </p>
          </div>
        </motion.div>


        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-blue-500/10 rounded-lg flex items-center justify-center"
          >
            <div className="text-blue-600 dark:text-blue-400 font-medium">
              Drop files to upload
            </div>
          </motion.div>
        )}
      </div>

      {/* Selected Files */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Selected Files ({selectedFiles.length})
              </h4>
              {selectedFiles.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {file.status === 'uploading' && file.progress !== undefined && (
                      <div className="mt-2">
                        <Progress value={file.progress} size="sm" showValue />
                      </div>
                    )}
                    
                    {file.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {file.error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-3">
                    {file.status && (
                      <Badge
                        variant={
                          file.status === 'success' ? 'success' :
                          file.status === 'error' ? 'error' :
                          file.status === 'uploading' ? 'warning' : 'default'
                        }
                      >
                        {file.status}
                      </Badge>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
