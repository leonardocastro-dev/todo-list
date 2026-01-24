import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import { collection, getDocs } from 'firebase/firestore'
import { useProjectStore } from './projects'
import { useAuth } from '@/composables/useAuth'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    // Cache multi-projeto: Map de projectId → tasks
    tasksByProject: {} as Record<string, Task[]>,
    // Rastreia quais projetos já foram carregados (para evitar re-fetch)
    loadedProjects: {} as Record<
      string,
      { workspaceId: string; loadedAt: number }
    >,
    currentProjectId: null as string | null,
    currentWorkspaceId: null as string | null,
    searchQuery: '',
    statusFilter: 'all',
    priorityFilter: 'all',
    isLoading: true
  }),

  getters: {
    // Getter para obter as tasks do projeto atual
    tasks: (state): Task[] => {
      if (!state.currentProjectId) return []
      return state.tasksByProject[state.currentProjectId] || []
    },
    totalTasks(): number {
      return this.tasks.length
    },
    completedTasks(): number {
      return this.tasks.filter((task: Task) => task.status === 'completed')
        .length
    },
    pendingTasks(): number {
      return this.tasks.filter((task: Task) => task.status === 'pending').length
    },
    urgentTasks(): number {
      return this.tasks.filter(
        (task: Task) => task.priority === 'urgent' && task.status === 'pending'
      ).length
    },
    completionPercentage(): number {
      const total = this.tasks.length
      const completed = this.tasks.filter(
        (task: Task) => task.status === 'completed'
      ).length
      return total > 0 ? Math.round((completed / total) * 100) : 0
    },
    filteredTasks(state): Task[] {
      return this.tasks.filter((task: Task) => {
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
      workspaceId?: string,
      forceReload: boolean = false
    ) {
      this.currentProjectId = projectId
      this.currentWorkspaceId = workspaceId || null

      if (!projectId) {
        return
      }

      // Verifica se o projeto já está no cache (e não é forceReload)
      const cachedProject = this.loadedProjects[projectId]
      if (
        !forceReload &&
        cachedProject &&
        cachedProject.workspaceId === workspaceId
      ) {
        // Projeto já carregado, apenas atualiza isLoading para false
        this.isLoading = false
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

        let loadedTasks: Task[] = []

        if (userId && workspaceId) {
          // Query nested tasks collection
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
            loadedTasks = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            })) as Task[]
          }
        } else {
          // localStorage also separated by project
          const localTasks = localStorage.getItem(`localTasks_${projectId}`)
          loadedTasks = localTasks ? JSON.parse(localTasks) : []
        }

        // Armazena no cache por projectId
        this.tasksByProject[projectId] = loadedTasks

        // Marca o projeto como carregado
        this.loadedProjects[projectId] = {
          workspaceId: workspaceId || '',
          loadedAt: Date.now()
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

    async reloadTasks(userId: string | null = null) {
      if (!this.currentProjectId || !this.currentWorkspaceId) return
      await this.loadTasksForProject(
        this.currentProjectId,
        userId,
        this.currentWorkspaceId
      )
    },

    // Limpa cache de um projeto específico
    clearProjectCache(projectId: string) {
      const { [projectId]: _tasks, ...restTasks } = this.tasksByProject
      const { [projectId]: _loaded, ...restLoaded } = this.loadedProjects
      this.tasksByProject = restTasks
      this.loadedProjects = restLoaded
    },

    // Limpa todo o cache
    clearCache() {
      this.tasksByProject = {}
      this.loadedProjects = {}
      this.currentProjectId = null
      this.currentWorkspaceId = null
    },

    async addTask(
      task: Omit<Task, 'id' | 'projectId' | 'createdAt'>,
      userId: string | null = null,
      workspaceId?: string,
      memberIds?: string[]
    ) {
      if (!this.currentProjectId) {
        toast.error('No project selected')
        return
      }

      const projectId = this.currentProjectId

      // Garante que o array existe
      if (!this.tasksByProject[projectId]) {
        this.tasksByProject[projectId] = []
      }

      if (!userId || !workspaceId) {
        const taskId = crypto.randomUUID()
        const now = new Date().toISOString()
        const taskWithData: Task = {
          ...task,
          id: taskId,
          projectId,
          createdAt: now
        }
        this.tasksByProject[projectId].push(taskWithData)
        localStorage.setItem(
          `localTasks_${projectId}`,
          JSON.stringify(this.tasksByProject[projectId])
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
              projectId,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate,
              memberIds
            }
          }
        )

        if (response.success && response.task) {
          this.tasksByProject[projectId].push(response.task)
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
      userId: string | null = null,
      memberIds?: string[]
    ) {
      if (!this.currentProjectId) return

      const projectId = this.currentProjectId
      const projectTasks = this.tasksByProject[projectId]
      if (!projectTasks) return

      const taskIndex = projectTasks.findIndex((task) => task.id === id)
      if (taskIndex === -1) return

      if (!userId) {
        projectTasks[taskIndex] = { ...projectTasks[taskIndex], ...updatedTask }
        localStorage.setItem(
          `localTasks_${projectId}`,
          JSON.stringify(projectTasks)
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
              projectId,
              ...updatedTask,
              memberIds
            }
          }
        )

        if (response.success) {
          projectTasks[taskIndex] = {
            ...projectTasks[taskIndex],
            ...updatedTask
          }
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

      const projectId = this.currentProjectId

      if (!userId) {
        this.tasksByProject[projectId] = (
          this.tasksByProject[projectId] || []
        ).filter((task) => task.id !== id)
        localStorage.setItem(
          `localTasks_${projectId}`,
          JSON.stringify(this.tasksByProject[projectId])
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
              projectId
            }
          }
        )

        if (response.success) {
          this.tasksByProject[projectId] = (
            this.tasksByProject[projectId] || []
          ).filter((task) => task.id !== id)
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
      if (!this.currentProjectId) return

      const projectId = this.currentProjectId
      const projectTasks = this.tasksByProject[projectId]
      if (!projectTasks) return

      const status = checked ? 'completed' : 'pending'

      const taskIndex = projectTasks.findIndex((task) => task.id === id)
      if (taskIndex === -1) return

      const previousStatus = projectTasks[taskIndex].status
      projectTasks[taskIndex].status = status

      if (userId) {
        try {
          await this.updateTask(id, { status }, userId)
        } catch {
          projectTasks[taskIndex].status = previousStatus
          toast.error('Failed to update task status', {
            style: { background: '#fda4af' },
            duration: 3000
          })
        }
      }
    },

    // Atualiza apenas o estado local (para UI otimista)
    updateLocalTaskStatus(id: string, status: 'pending' | 'completed') {
      if (!this.currentProjectId) return

      const projectId = this.currentProjectId
      const projectTasks = this.tasksByProject[projectId]
      if (!projectTasks) return

      const taskIndex = projectTasks.findIndex((task) => task.id === id)
      if (taskIndex === -1) return

      projectTasks[taskIndex].status = status

      // Atualiza localStorage se necessário
      const localTasks = localStorage.getItem(`localTasks_${projectId}`)
      if (localTasks) {
        localStorage.setItem(
          `localTasks_${projectId}`,
          JSON.stringify(projectTasks)
        )
      }
    },

    // Sincroniza com servidor (chamado com debounce)
    // Lança erro para que o composable possa reverter a UI
    async syncTaskStatusToServer(
      id: string,
      status: 'pending' | 'completed',
      userId: string | null = null
    ) {
      if (!userId) return

      await this.updateTask(id, { status }, userId)
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
