import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  TrashIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  SpeakerWaveIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import {
  Card,
  // CardHeader,
  // CardTitle,
  // CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
  DropdownMenu,
  // Skeleton,
  Modal,
  toast,
} from '@/components/ui'
import { useAudioSessionsStore } from '@/stores/audio-sessions'
import { useUIStore } from '@/stores/ui'
import { formatRelativeTime, formatDuration, formatFileSize } from '@/lib/utils'
import { ProcessingStatus } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

export default function History() {
  const { sessions, updateSession, deleteSession } = useAudioSessionsStore()
  const { searchQuery, setSearchQuery } = useUIStore()
  
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'duration' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<ProcessingStatus | 'all'>('all')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions.filter(session => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!session.fileName.toLowerCase().includes(query) &&
            !session.transcription?.transcript.toLowerCase().includes(query) &&
            !session.tags.some(tag => tag.toLowerCase().includes(query))) {
          return false
        }
      }

      // Status filter
      if (filterStatus !== 'all' && session.status !== filterStatus) {
        return false
      }

      // Favorites filter
      if (filterFavorites && !session.isFavorite) {
        return false
      }

      return true
    })

    // Sort sessions
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName)
          break
        case 'duration':
          comparison = a.duration - b.duration
          break
        case 'size':
          comparison = a.fileSize - b.fileSize
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [sessions, searchQuery, sortBy, sortOrder, filterStatus, filterFavorites])

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedSessions.length === filteredSessions.length) {
      setSelectedSessions([])
    } else {
      setSelectedSessions(filteredSessions.map(s => s.id))
    }
  }

  const handleToggleFavorite = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      updateSession(sessionId, { isFavorite: !session.isFavorite })
      toast.success(session.isFavorite ? 'Removed from favorites' : 'Added to favorites')
    }
  }

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete)
      toast.success('Session deleted successfully')
      setDeleteModalOpen(false)
      setSessionToDelete(null)
    }
  }

  const handleBulkDelete = () => {
    selectedSessions.forEach(sessionId => {
      deleteSession(sessionId)
    })
    toast.success(`Deleted ${selectedSessions.length} session(s)`)
    setSelectedSessions([])
  }

  const handleExportSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      // Create export data
      const exportData = {
        session,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${session.fileName}-export.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Session exported successfully')
    }
  }

  const getSessionActions = (session: any) => [
    {
      label: session.isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      onClick: () => handleToggleFavorite(session.id),
      icon: session.isFavorite ? <StarIconSolid className="h-4 w-4" /> : <StarIcon className="h-4 w-4" />
    },
    {
      label: 'Export Session',
      onClick: () => handleExportSession(session.id),
      icon: <DocumentArrowDownIcon className="h-4 w-4" />
    },
    {
      label: 'Share',
      onClick: () => toast.info('Share functionality coming soon'),
      icon: <ShareIcon className="h-4 w-4" />
    },
    {
      label: 'Delete',
      onClick: () => handleDeleteSession(session.id),
      icon: <TrashIcon className="h-4 w-4" />,
      destructive: true
    }
  ]

  const statusColors = {
    [ProcessingStatus.COMPLETED]: 'success',
    [ProcessingStatus.FAILED]: 'error',
    [ProcessingStatus.TRANSCRIBING]: 'warning',
    [ProcessingStatus.SUMMARIZING]: 'warning',
    [ProcessingStatus.EXTRACTING_TASKS]: 'warning',
    [ProcessingStatus.UPLOADING]: 'default',
    [ProcessingStatus.UPLOADED]: 'default',
    [ProcessingStatus.VALIDATING]: 'default',
    [ProcessingStatus.CANCELLED]: 'error',
  } as const

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <SpeakerWaveIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No audio sessions yet
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload your first audio file to get started.
        </p>
        <div className="mt-6">
          <Link to="/upload">
            <Button>
              <SpeakerWaveIcon className="h-4 w-4 mr-2" />
              Upload Audio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audio History
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filteredSessions.length} of {sessions.length} sessions
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          {selectedSessions.length > 0 && (
            <Button
              variant="outline"
              onClick={handleBulkDelete}
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete ({selectedSessions.length})
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search sessions, transcriptions, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="duration">Sort by Duration</option>
                <option value="size">Sort by Size</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value={ProcessingStatus.COMPLETED}>Completed</option>
                      <option value={ProcessingStatus.TRANSCRIBING}>Processing</option>
                      <option value={ProcessingStatus.FAILED}>Failed</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filterFavorites}
                        onChange={(e) => setFilterFavorites(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Favorites only
                      </span>
                    </label>
                  </div>
                  
                  <div className="flex items-end justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterStatus('all')
                        setFilterFavorites(false)
                        setSearchQuery('')
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {selectedSessions.length} session(s) selected
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedSessions([])}>
                    Clear Selection
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {/* Select All */}
        {filteredSessions.length > 0 && (
          <div className="flex items-center space-x-2 px-4">
            <input
              type="checkbox"
              checked={selectedSessions.length === filteredSessions.length}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Select all
            </span>
          </div>
        )}

        {filteredSessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedSessions.includes(session.id)}
                    onChange={() => handleSelectSession(session.id)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  {/* Session Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/session/${session.id}`}
                            className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
                          >
                            {session.fileName}
                          </Link>
                          {session.isFavorite && (
                            <StarIconSolid className="h-4 w-4 text-yellow-400" />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {formatRelativeTime(session.createdAt)}
                          </span>
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatDuration(session.duration)}
                          </span>
                          <span>{formatFileSize(session.fileSize)}</span>
                        </div>

                        {/* Tags */}
                        {session.tags.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            <TagIcon className="h-4 w-4 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {session.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Transcription Preview */}
                        {session.transcription?.transcript && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {session.transcription.transcript.substring(0, 200)}...
                          </p>
                        )}
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge variant={statusColors[session.status] as any}>
                          {session.status}
                        </Badge>
                        
                        <DropdownMenu
                          trigger={
                            <Button variant="ghost" size="sm">
                              •••
                            </Button>
                          }
                          items={getSessionActions(session)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No sessions found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Session"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this session? This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
