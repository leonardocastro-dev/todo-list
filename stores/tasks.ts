import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import { collection, getDocs } from 'firebase/firestore'
import { useProjectStore } from './projects'
import { useAuth } from '@/composables/useAuth'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [] as Task[],
    currentProjectId: null as string | null,
    searchQuery: '',
    statusFilter: 'all',
    priorityFilter: 'all',
    isLoading: true
  }),

  getters: {
    totalTasks: (state) => state.tasks.length,
    completedTasks: (state) =>
      state.tasks.filter((task) => task.status === 'completed').length,
    pendingTasks: (state) =>
      state.tasks.filter((task) => task.status === 'pending').length,
    urgentTasks: (state) =>
      state.tasks.filter(
        (task) => task.priority === 'urgent' && task.status === 'pending'
      ).length,
    completionPercentage: (state) => {
      const total = state.tasks.length
      const completed = state.tasks.filter(
        (task) => task.status === 'completed'
      ).length
      return total > 0 ? Math.round((completed / total) * 100) : 0
    },
    filteredTasks: (state) => {
      return state.tasks.filter((task) => {
        if (
          state.statusFilter !== 'all' &&
          task.status !== state.statusFilter
        ) {
          return false
        }

        if (
          state.priorityFilter !== 'all' &&
          task.priority !== state.priorityFilter
        ) {
          return false
        }

        if (state.searchQuery.trim() !== '') {
          const query = state.searchQuery.toLowerCase()
          return (
            task.title.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query) ||
            false
          )
        }

        return true
      })
    }
  },

  actions: {
    // Helper to get auth token
    async getAuthToken(): Promise<string | null> {
      const { user } = useAuth()
      if (!user.value) return null
      return await user.value.getIdToken()
    },

    // Helper to get workspaceId from current project
    getWorkspaceId(): string | undefined {
      const projectStore = useProjectStore()
      const project = projectStore.projects.find(
        (p) => p.id === this.currentProjectId
      )
      return project?.workspaceId
    },

    async setCurrentProject(
      projectId: string | null,
      userId: string | null = null,
      workspaceId?: string
    ) {
      this.currentProjectId = projectId

      if (!projectId) {
        this.tasks = []
        return
      }

      await this.loadTasksForProject(projectId, userId, workspaceId)
    },

    async loadTasksForProject(
      projectId: string,
      userId: string | null = null,
      workspaceId?: string
    ) {
      const { $firestore } = useNuxtApp()

      try {
        this.isLoading = true

        if (userId && workspaceId) {
          const tasksRef = collection(
            $firestore,
            'workspaces',
            workspaceId,
            'projects',
            projectId,
            'tasks'
          )
          const snapshot = await getDocs(tasksRef)

          if (!snapshot.empty) {
            this.tasks = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            })) as Task[]
          } else {
            this.tasks = []
          }
        } else {
          // localStorage também separado por projeto
          const localTasks = localStorage.getItem(`localTasks_${projectId}`)
          this.tasks = localTasks ? JSON.parse(localTasks) : []
        }
      } catch (error) {
        console.error('Error loading tasks:', error)
        toast.error('Failed to load tasks', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      } finally {
        this.isLoading = false
      }
    },

    async addTask(
      task: Omit<Task, 'id' | 'projectId' | 'createdAt'>,
      userId: string | null = null,
      workspaceId?: string
    ) {
      if (!this.currentProjectId) {
        toast.error('No project selected')
        return
      }

      if (!userId || !workspaceId) {
        const taskId = crypto.randomUUID()
        const now = new Date().toISOString()
        const taskWithData: Task = {
          ...task,
          id: taskId,
          projectId: this.currentProjectId,
          createdAt: now
        }
        this.tasks.push(taskWithData)
        localStorage.setItem(
          `localTasks_${this.currentProjectId}`,
          JSON.stringify(this.tasks)
        )
        toast.message('Task added successfully', {
          style: { background: '#6ee7b7' }
        })
        return
      }

      try {
        const token = await this.getAuthToken()
        if (!token) throw new Error('Not authenticated')

        const response = await $fetch<{ success: boolean; task: Task }>(
          '/api/tasks',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: {
              workspaceId,
              projectId: this.currentProjectId,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate
            }
          }
        )

        if (response.success && response.task) {
          this.tasks.push(response.task)
        }

        toast.message('Task added successfully', {
          style: { background: '#6ee7b7' }
        })
      } catch (error) {
        console.error('Error adding task:', error)
        toast.error('Failed to add task')
      }
    },

    async updateTask(
      id: string,
      updatedTask: Partial<Task>,
      userId: string | null = null
    ) {
      if (!this.currentProjectId) return

      const taskIndex = this.tasks.findIndex((task) => task.id === id)
      if (taskIndex === -1) return

      if (!userId) {
        this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updatedTask }
        localStorage.setItem(
          `localTasks_${this.currentProjectId}`,
          JSON.stringify(this.tasks)
        )
        return
      }

      try {
        const workspaceId = this.getWorkspaceId()
        if (!workspaceId) return

        const token = await this.getAuthToken()
        if (!token) throw new Error('Not authenticated')

        const response = await $fetch<{ success: boolean }>(
          `/api/tasks/${id}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: {
              workspaceId,
              projectId: this.currentProjectId,
              ...updatedTask
            }
          }
        )

        if (response.success) {
          this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updatedTask }
        }
      } catch (error) {
        console.error('Error updating task:', error)
        toast.error('Failed to update task', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      }
    },

    async deleteTask(id: string, userId: string | null = null) {
      if (!this.currentProjectId) return

      if (!userId) {
        this.tasks = this.tasks.filter((task) => task.id !== id)
        localStorage.setItem(
          `localTasks_${this.currentProjectId}`,
          JSON.stringify(this.tasks)
        )
        toast.message('Task deleted successfully', {
          style: { background: '#fda4af' },
          duration: 3000
        })
        return
      }

      try {
        const workspaceId = this.getWorkspaceId()
        if (!workspaceId) return

        const token = await this.getAuthToken()
        if (!token) throw new Error('Not authenticated')

        const response = await $fetch<{ success: boolean }>(
          `/api/tasks/${id}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            body: {
              workspaceId,
              projectId: this.currentProjectId
            }
          }
        )

        if (response.success) {
          this.tasks = this.tasks.filter((task) => task.id !== id)
          toast.message('Task deleted successfully', {
            style: { background: '#fda4af' },
            duration: 3000
          })
        }
      } catch (error) {
        console.error('Error deleting task:', error)
        toast.error('Failed to delete task', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      }
    },

    async toggleTaskStatus(
      id: string,
      checked: boolean,
      userId: string | null = null
    ) {
      const status = checked ? 'completed' : 'pending'

      const taskIndex = this.tasks.findIndex((task) => task.id === id)
      if (taskIndex === -1) return

      const previousStatus = this.tasks[taskIndex].status
      this.tasks[taskIndex].status = status

      toast.message(`Task changed to ${status}`, {
        style: { background: checked ? '#6ee7b7' : '#fdba74' },
        duration: 3000
      })

      if (userId) {
        try {
          await this.updateTask(id, { status }, userId)
        } catch {
          this.tasks[taskIndex].status = previousStatus
          toast.error('Failed to update task status', {
            style: { background: '#fda4af' },
            duration: 3000
          })
        }
      }
    },

    setSearchQuery(query: string | null) {
      this.searchQuery = query || ''
    },

    setStatusFilter(status: string | null) {
      this.statusFilter = status || 'all'
    },

    setPriorityFilter(priority: string | null) {
      this.priorityFilter = priority || 'all'
    }
  }
})
