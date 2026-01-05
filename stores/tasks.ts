import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import { useProjectStore } from './projects'

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
    async setCurrentProject(projectId: string | null, userId: string | null = null, workspaceId?: string) {
      this.currentProjectId = projectId

      if (!projectId) {
        this.tasks = []
        return
      }

      await this.loadTasks(projectId, userId, workspaceId)
    },

    async loadTasks(projectId: string, userId: string | null = null, workspaceId?: string) {
      await this.loadTasksForProject(projectId, userId, workspaceId)
    },

    async loadTasksForProject(projectId: string, userId: string | null = null, workspaceId?: string) {
      const { $firestore } = useNuxtApp()

      try {
        this.isLoading = true

        if (userId && workspaceId) {
          const tasksRef = collection($firestore, 'workspaces', workspaceId, 'projects', projectId, 'tasks')
          const snapshot = await getDocs(tasksRef)

          if (!snapshot.empty) {
            this.tasks = snapshot.docs.map(doc => ({
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

      const taskId = crypto.randomUUID()
      const now = new Date().toISOString()

      const taskWithData: Task = {
        ...task,
        id: taskId,
        projectId: this.currentProjectId,
        createdAt: now
      }

      if (!userId || !workspaceId) {
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
        const { $firestore } = useNuxtApp()
        const taskRef = doc(
          $firestore,
          'workspaces',
          workspaceId,
          'projects',
          this.currentProjectId,
          'tasks',
          taskId
        )

        await setDoc(taskRef, taskWithData)

        this.tasks.push(taskWithData)

        const projectStore = useProjectStore()
        await projectStore.updateProject(
          this.currentProjectId,
          { updatedAt: now },
          userId
        )

        toast.message('Task added successfully', {
          style: { background: '#6ee7b7' }
        })
      } catch (error) {
        console.error('Error adding task:', error)
        toast.error('Failed to add task')
      }
    },

    async updateTask(id: string, updatedTask: Partial<Task>, userId: string | null = null) {
      const { $firestore } = useNuxtApp()

      if (!this.currentProjectId) return

      const taskIndex = this.tasks.findIndex((task) => task.id === id)
      if (taskIndex === -1) return

      this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updatedTask }

      if (userId) {
        try {
          // Find workspaceId from project
          const projectStore = useProjectStore()
          const project = projectStore.projects.find(p => p.id === this.currentProjectId)
          const workspaceId = project?.workspaceId

          if (!workspaceId) return

          const taskRef = doc($firestore, 'workspaces', workspaceId, 'projects', this.currentProjectId, 'tasks', id)
          await updateDoc(taskRef, JSON.parse(JSON.stringify(updatedTask)))

          // Atualiza timestamp do projeto
          await projectStore.updateProject(
            this.currentProjectId,
            { updatedAt: new Date().toISOString() },
            userId
          )
        } catch (error) {
          console.error('Error updating task:', error)
          toast.error('Failed to update task', {
            style: { background: '#fda4af' },
            duration: 3000
          })
          return
        }
      } else {
        localStorage.setItem(
          `localTasks_${this.currentProjectId}`,
          JSON.stringify(this.tasks)
        )
      }
    },

    async deleteTask(id: string, userId: string | null = null) {
      const { $firestore } = useNuxtApp()

      if (!this.currentProjectId) return

      this.tasks = this.tasks.filter((task) => task.id !== id)

      if (userId) {
        try {
          // Find workspaceId from project
          const projectStore = useProjectStore()
          const project = projectStore.projects.find(p => p.id === this.currentProjectId)
          const workspaceId = project?.workspaceId

          if (!workspaceId) return

          const taskRef = doc($firestore, 'workspaces', workspaceId, 'projects', this.currentProjectId, 'tasks', id)
          await deleteDoc(taskRef)

          // Atualiza timestamp do projeto
          await projectStore.updateProject(
            this.currentProjectId,
            { updatedAt: new Date().toISOString() },
            userId
          )
        } catch (error) {
          console.error('Error deleting task:', error)
          toast.error('Failed to delete task', {
            style: { background: '#fda4af' },
            duration: 3000
          })
          return
        }
      } else {
        localStorage.setItem(
          `localTasks_${this.currentProjectId}`,
          JSON.stringify(this.tasks)
        )
      }

      toast.message('Task deleted successfully', {
        style: { background: '#fda4af' },
        duration: 3000
      })
    },

    async toggleTaskStatus(id: string, checked: boolean, userId: string | null = null) {
      const status = checked ? 'completed' : 'pending'
      await this.updateTask(id, { status }, userId)

      toast.message(`Task changed to ${status}`, {
        style: { background: checked ? '#6ee7b7' : '#fdba74' },
        duration: 3000
      })
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
