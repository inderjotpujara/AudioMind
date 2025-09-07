import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { useAudioSessionsStore } from '@/stores/audio-sessions'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

export default function Session() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getSessionById } = useAudioSessionsStore()
  const [isPlaying, setIsPlaying] = useState(false)

  const session = id ? getSessionById(id) : null

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Session Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The audio session you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate('/history')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to History
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/history')}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to History
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {session.fileName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Processed {formatDistanceToNow(session.createdAt, { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={session.status === 'completed' ? 'success' : 'warning'}>
            {session.status}
          </Badge>
          {session.confidence && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Confidence: {Math.round(session.confidence * 100)}%
            </div>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {session.audioBlobId && (
        <Card>
          <CardHeader>
            <CardTitle>Audio Playback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                size="sm"
                variant="outline"
              >
                {isPlaying ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.floor(session.duration / 60)}:{String(Math.floor(session.duration % 60)).padStart(2, '0')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcription */}
      {session.transcription && (
        <Card>
          <CardHeader>
            <CardTitle>Transcription</CardTitle>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {session.transcription.language} • {session.transcription.provider}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                {session.transcription.transcript}
              </p>
            </div>
            
            {session.transcription.segments && session.transcription.segments.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Segments
                </h4>
                <div className="space-y-2">
                  {session.transcription.segments.map((segment, index) => (
                    <div
                      key={segment.id || index}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.floor(segment.startTime)}s - {Math.floor(segment.endTime)}s
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(segment.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {segment.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {session.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                {typeof session.summary === 'string' ? session.summary : session.summary.summary}
              </p>
            </div>
            
            {typeof session.summary === 'object' && session.summary.keyPoints && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Key Points
                </h4>
                <ul className="space-y-2">
                  {session.summary.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-900 dark:text-gray-100">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      {session.tasks && session.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {session.tasks.map((task, index) => (
                <div
                  key={task.id || index}
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    readOnly
                    className="h-4 w-4 text-blue-600 mr-3"
                  />
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>File Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">File Size:</span>
              <p className="font-medium">{(session.fileSize / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Duration:</span>
              <p className="font-medium">
                {Math.floor(session.duration / 60)}:{String(Math.floor(session.duration % 60)).padStart(2, '0')}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Format:</span>
              <p className="font-medium">{session.mimeType}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Created:</span>
              <p className="font-medium">{formatDistanceToNow(session.createdAt, { addSuffix: true })}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
