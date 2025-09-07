import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon,
  TrashIcon,
  PlayIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { Button, Card, CardContent, CardHeader, CardTitle, Progress, Badge } from '@/components/ui'
import { backgroundProcessor, ProcessingQueueItem } from '@/lib/background-processor'
import { useNavigate } from 'react-router-dom'
import { cn, formatFileSize, formatDuration } from '@/lib/utils'

export default function ProcessingQueue() {
  const [queueItems, setQueueItems] = useState<ProcessingQueueItem[]>([])
  const [queueStatus, setQueueStatus] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    isProcessing: false
  })
  const navigate = useNavigate()

  // Update queue status every second
  useEffect(() => {
    const updateStatus = () => {
      setQueueItems(backgroundProcessor.getQueue())
      setQueueStatus(backgroundProcessor.getQueueStatus())
    }

    updateStatus()
    const interval = setInterval(updateStatus, 1000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: ProcessingQueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'processing':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: ProcessingQueueItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const retryItem = (itemId: string) => {
    backgroundProcessor.retryFailedItem(itemId)
  }

  const cancelItem = (itemId: string) => {
    backgroundProcessor.cancelItem(itemId)
  }

  const clearCompleted = () => {
    backgroundProcessor.clearCompleted()
  }

  const viewSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`)
  }

  if (queueStatus.total === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No files in processing queue
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Upload some audio files to see them here
          </p>
          <Button
            onClick={() => navigate('/upload')}
            className="mt-4"
          >
            Upload Files
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Processing Queue
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track the progress of your audio file processing
        </p>
      </div>

      {/* Queue Status Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowPathIcon className={cn(
              "h-5 w-5",
              queueStatus.isProcessing ? "animate-spin text-blue-500" : "text-gray-400"
            )} />
            Queue Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {queueStatus.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {queueStatus.pending}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {queueStatus.processing}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {queueStatus.completed}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {queueStatus.failed}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
          </div>

          {queueStatus.completed > 0 && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={clearCompleted}
                variant="outline"
                size="sm"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Clear Completed
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Items */}
      <div className="space-y-4">
        <AnimatePresence>
          {queueItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {getStatusIcon(item.status)}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {item.file.name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatFileSize(item.file.size)}
                          </span>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.status === 'completed' && (
                        <Button
                          onClick={() => viewSession(item.sessionId)}
                          variant="outline"
                          size="sm"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                      
                      {item.status === 'failed' && (
                        <Button
                          onClick={() => retryItem(item.id)}
                          variant="outline"
                          size="sm"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      )}

                      {(item.status === 'pending' || item.status === 'failed') && (
                        <Button
                          onClick={() => cancelItem(item.id)}
                          variant="outline"
                          size="sm"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for processing items */}
                  {item.status === 'processing' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>{item.stage}</span>
                        <span>{Math.round(item.progress)}%</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  )}

                  {/* Error message for failed items */}
                  {item.status === 'failed' && item.error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {item.error}
                      </p>
                    </div>
                  )}

                  {/* Timing information */}
                  {(item.startedAt || item.completedAt) && (
                    <div className="mt-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      {item.startedAt && (
                        <span>
                          Started: {item.startedAt.toLocaleTimeString()}
                        </span>
                      )}
                      {item.completedAt && (
                        <span>
                          {item.status === 'completed' ? 'Completed' : 'Failed'}: {item.completedAt.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
