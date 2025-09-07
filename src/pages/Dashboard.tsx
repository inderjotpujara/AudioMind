import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  ChartBarIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Button,
  Badge,
  Progress,
  Skeleton
} from '@/components/ui'
// import { AudioPlayer } from '@/components/features/audio-player'
import { useAudioSessionsStore } from '@/stores/audio-sessions'
import { useTasksStore } from '@/stores/tasks'
import { formatRelativeTime, formatDuration } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useUIStore } from '@/stores/ui'

export default function Dashboard() {
  const { sessions, getRecentSessions, getFavoriteSessions } = useAudioSessionsStore()
  const { getTaskStats, getPendingTasks, getOverdueTasks } = useTasksStore()
  const { addNotification } = useUIStore()
  const [isLoading, setIsLoading] = useState(true)

  const recentSessions = getRecentSessions(5)
  const favoriteSessions = getFavoriteSessions().slice(0, 3)
  const taskStats = getTaskStats()
  const pendingTasks = getPendingTasks().slice(0, 5)
  const overdueTasks = getOverdueTasks()

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const stats = [
    {
      name: 'Total Sessions',
      value: sessions.length,
      change: sessions.length > 0 ? '+100%' : '0%',
      changeType: sessions.length > 0 ? 'positive' as const : 'neutral' as const,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Completed Tasks',
      value: taskStats?.completed || 0,
      change: (taskStats?.completed || 0) > 0 ? '+100%' : '0%',
      changeType: (taskStats?.completed || 0) > 0 ? 'positive' as const : 'neutral' as const,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Pending Tasks',
      value: taskStats?.pending || 0,
      change: (taskStats?.pending || 0) > 0 ? '+100%' : '0%',
      changeType: (taskStats?.pending || 0) > 0 ? 'neutral' as const : 'neutral' as const,
      icon: ClockIcon,
      color: 'bg-orange-500',
    },
    {
      name: 'Processing Time',
      value: sessions.length > 0 ? '0.0h' : '0.0h',
      change: '0%',
      changeType: 'neutral' as const,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
    },
  ]

  const quickActions = [
    {
      name: 'Upload Audio',
      description: 'Add new audio files for processing',
      href: '/upload',
      icon: CloudArrowUpIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'View History',
      description: 'Browse your audio sessions',
      href: '/history',
      icon: ClockIcon,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      name: 'Manage Tasks',
      description: 'Review and organize tasks',
      href: '/tasks',
      icon: CheckCircleIcon,
      color: 'bg-green-600 hover:bg-green-700',
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white"
      >
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="text-blue-100 mb-4">
          Transform your audio recordings into structured insights with AI-powered transcription and analysis.
        </p>
        
        {sessions.length === 0 ? (
          <div className="flex space-x-3">
            <Link to="/upload">
              <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                <PlusIcon className="h-4 w-4 mr-2" />
                Upload Your First Audio
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              className="bg-white/10 text-white hover:bg-white/20 border-white/20"
              onClick={() => addNotification({
                type: 'success',
                title: 'Welcome to Audio Journal!',
                message: 'Click the bell icon to see notifications',
                duration: 5000
              })}
            >
              Test Notification
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <Link key={action.name} to={action.href}>
                <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-white/20">
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.name}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {stat.name}
                    </p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <Badge
                        variant={stat.changeType === 'positive' ? 'success' : 'error'}
                        className="ml-2"
                      >
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Sessions</CardTitle>
                  <CardDescription>
                    Your latest audio processing sessions
                  </CardDescription>
                </div>
                <Link to="/history">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <SpeakerWaveIcon className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No sessions yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    Upload your first audio file to get started.
                  </p>
                  <div className="mt-6">
                    <Link to="/upload">
                      <Button>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Upload Audio
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <SpeakerWaveIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {session.fileName}
                          </p>
                          {session.isFavorite && (
                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {formatRelativeTime(session.createdAt)}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDuration(session.duration)}
                          </p>
                          <Badge variant={
                            session.status === 'completed' ? 'success' :
                            session.status === 'failed' ? 'error' :
                            'warning'
                          }>
                            {session.status}
                          </Badge>
                        </div>
                        
                        {session.status !== 'completed' && session.status !== 'failed' && (
                          <div className="mt-2">
                            <Progress value={session.progress} size="sm" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Link to={`/session/${session.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Tasks
                  </CardTitle>
                  <CardDescription>
                    {taskStats.pending} pending, {taskStats.completed} completed
                  </CardDescription>
                </div>
                {overdueTasks.length > 0 && (
                  <Badge variant="error">
                    {overdueTasks.length} overdue
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pendingTasks.length === 0 ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 text-center py-4">
                  No pending tasks
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        onChange={() => {
                          // Handle task completion
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant={
                        task.priority === 'urgent' ? 'error' :
                        task.priority === 'high' ? 'warning' :
                        'default'
                      }>
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Favorite Sessions */}
          {favoriteSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <StarIcon className="h-5 w-5 mr-2 text-yellow-400" />
                  Favorites
                </CardTitle>
                <CardDescription>
                  Your starred audio sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {favoriteSessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/session/${session.id}`}
                      className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {session.fileName}
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        {formatRelativeTime(session.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
