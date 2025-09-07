import { useEffect, useRef, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon
} from '@heroicons/react/24/outline'
import { Button, Progress } from '@/components/ui'
import { formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface AudioPlayerProps {
  src: string
  className?: string
  showWaveform?: boolean
  showTimestamps?: boolean
  onTimeUpdate?: (time: number) => void
  onPlay?: () => void
  onPause?: () => void
  onError?: (error: Error) => void
  waveformColor?: string
  progressColor?: string
}

export function AudioPlayer({
  src,
  className,
  showWaveform = true,
  showTimestamps = true,
  onTimeUpdate,
  onPlay,
  onPause,
  onError,
  waveformColor = '#3b82f6',
  progressColor = '#1d4ed8'
}: AudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !src) return

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: waveformColor,
      progressColor: progressColor,
      height: showWaveform ? 80 : 40,
      normalize: true,
      backend: 'WebAudio',
      responsive: true,
      cursorColor: '#1d4ed8',
      cursorWidth: 2,
      hideScrollbar: true,
    })

    // Load audio
    wavesurfer.current.load(src)

    // Event listeners
    wavesurfer.current.on('ready', () => {
      setIsLoading(false)
      setDuration(wavesurfer.current?.getDuration() || 0)
    })

    wavesurfer.current.on('play', () => {
      setIsPlaying(true)
      onPlay?.()
    })

    wavesurfer.current.on('pause', () => {
      setIsPlaying(false)
      onPause?.()
    })

    wavesurfer.current.on('audioprocess', () => {
      const time = wavesurfer.current?.getCurrentTime() || 0
      setCurrentTime(time)
      onTimeUpdate?.(time)
    })

    wavesurfer.current.on('seek', () => {
      const time = wavesurfer.current?.getCurrentTime() || 0
      setCurrentTime(time)
      onTimeUpdate?.(time)
    })

    wavesurfer.current.on('error', (error) => {
      onError?.(new Error(`Audio loading failed: ${error}`))
      setIsLoading(false)
    })

    return () => {
      wavesurfer.current?.destroy()
    }
  }, [src, showWaveform, waveformColor, progressColor, onTimeUpdate, onPlay, onPause, onError])

  const togglePlayPause = useCallback(() => {
    if (!wavesurfer.current) return
    wavesurfer.current.playPause()
  }, [])

  const seekTo = useCallback((percentage: number) => {
    if (!wavesurfer.current) return
    wavesurfer.current.seekTo(percentage)
  }, [])

  const skip = useCallback((seconds: number) => {
    if (!wavesurfer.current) return
    const currentTime = wavesurfer.current.getCurrentTime()
    const duration = wavesurfer.current.getDuration()
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    wavesurfer.current.seekTo(newTime / duration)
  }, [])

  const toggleMute = useCallback(() => {
    if (!wavesurfer.current) return
    const newMuted = !isMuted
    setIsMuted(newMuted)
    wavesurfer.current.setVolume(newMuted ? 0 : volume)
  }, [isMuted, volume])

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!wavesurfer.current) return
    setVolume(newVolume)
    if (!isMuted) {
      wavesurfer.current.setVolume(newVolume)
    }
  }, [isMuted])

  if (isLoading) {
    return (
      <div className={cn('w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg', className)}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
        className
      )}
    >
      {/* Waveform */}
      {showWaveform && (
        <div className="p-4 pb-2">
          <div ref={waveformRef} className="w-full" />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center space-x-4 p-4">
        {/* Play/Pause Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayPause}
          className="h-12 w-12 rounded-full"
        >
          {isPlaying ? (
            <PauseIcon className="h-6 w-6" />
          ) : (
            <PlayIcon className="h-6 w-6 ml-0.5" />
          )}
        </Button>

        {/* Skip Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(-10)}
            className="h-8 w-8"
          >
            <BackwardIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(10)}
            className="h-8 w-8"
          >
            <ForwardIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar (when waveform is hidden) */}
        {!showWaveform && (
          <div className="flex-1">
            <Progress
              value={(currentTime / duration) * 100}
              className="cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const percentage = (e.clientX - rect.left) / rect.width
                seekTo(percentage)
              }}
            />
          </div>
        )}

        {/* Time Display */}
        {showTimestamps && (
          <div className="text-sm text-gray-600 dark:text-gray-400 min-w-0 flex-shrink-0">
            <span className="font-mono">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>
        )}

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="h-4 w-4" />
            ) : (
              <SpeakerWaveIcon className="h-4 w-4" />
            )}
          </Button>
          
          <div className="w-20">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value)
                if (newVolume === 0) {
                  setIsMuted(true)
                } else {
                  setIsMuted(false)
                  handleVolumeChange(newVolume)
                }
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
