import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, TaskStatus, TaskPriority } from '@/types'
import { generateId } from '@/lib/utils'

interface TasksState {
  // State
  tasks: Task[]
  isLoading: boolean
  error: string | null

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task
  addTasks: (tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => Task[]
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  clearTasksForSession: (sessionId: string) => void

  // Computed properties
  getTaskById: (id: string) => Task | undefined
  getTasksBySession: (sessionId: string) => Task[]
  getCompletedTasks: () => Task[]
  getPendingTasks: () => Task[]
  getOverdueTasks: () => Task[]
  getTasksByPriority: (priority: TaskPriority) => Task[]
  getTasksByStatus: (status: TaskStatus) => Task[]
  getTasksByTag: (tag: string) => Task[]
  getTaskStats: () => {
    total: number
    completed: number
    pending: number
    overdue: number
  }
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      isLoading: false,
      error: null,

      // Actions
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          completed: false,
          status: TaskStatus.TODO,
          priority: taskData.priority || TaskPriority.MEDIUM,
          tags: taskData.tags || [],
          confidence: taskData.confidence || 0.8,
          customFields: taskData.customFields || {},
        }

        set((state) => ({
          tasks: [...state.tasks, newTask],
          error: null,
        }))

        return newTask
      },

      addTasks: (tasksData) => {
        const newTasks: Task[] = tasksData.map((taskData) => ({
          ...taskData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          completed: false,
          status: TaskStatus.TODO,
          priority: taskData.priority || TaskPriority.MEDIUM,
          tags: taskData.tags || [],
          confidence: taskData.confidence || 0.8,
          customFields: taskData.customFields || {},
        }))

        set((state) => ({
          tasks: [...state.tasks, ...newTasks],
          error: null,
        }))

        return newTasks
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          ),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }))
      },

      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === id) {
              const newCompleted = !task.completed;
              const updatedTask: Task = {
                ...task,
                completed: newCompleted,
                status: newCompleted ? TaskStatus.COMPLETED : TaskStatus.TODO,
                updatedAt: new Date(),
              };
              if (newCompleted) {
                updatedTask.completedAt = new Date();
              }
              return updatedTask;
            }
            return task;
          }),
        }))
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error, isLoading: false })
      },

      clearError: () => {
        set({ error: null })
      },

      clearTasksForSession: (sessionId) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.sessionId !== sessionId),
        }))
      },

      // Computed properties
      getTaskById: (id) => {
        return get().tasks.find((task) => task.id === id)
      },

      getTasksBySession: (sessionId) => {
        return get().tasks.filter((task) => task.sessionId === sessionId)
      },

      getCompletedTasks: () => {
        return get().tasks.filter((task) => task.completed)
      },

      getPendingTasks: () => {
        return get().tasks.filter((task) => !task.completed)
      },

      getOverdueTasks: () => {
        const now = new Date()
        return get().tasks.filter(
          (task) => !task.completed && task.dueDate && task.dueDate < now
        )
      },

      getTasksByPriority: (priority) => {
        return get().tasks.filter((task) => task.priority === priority)
      },

      getTasksByStatus: (status) => {
        return get().tasks.filter((task) => task.status === status)
      },

      getTasksByTag: (tag) => {
        return get().tasks.filter((task) => task.tags.includes(tag))
      },

      getTaskStats: () => {
        const tasks = get().tasks
        const now = new Date()
        
        return {
          total: tasks.length,
          completed: tasks.filter((task) => task.completed).length,
          pending: tasks.filter((task) => !task.completed).length,
          overdue: tasks.filter(
            (task) => !task.completed && task.dueDate && task.dueDate < now
          ).length,
        }
      },
    }),
    {
      name: 'tasks-storage',
      // Only persist tasks, not loading states
      partialize: (state) => ({
        tasks: state.tasks,
      }),
    }
  )
)
