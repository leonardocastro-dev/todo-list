import { defineStore } from 'pinia'
import { showErrorToast } from '@/utils/toast'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { useProjectStore } from './projects'
import { useAuth } from '@/composables/useAuth'
import { PERMISSIONS, hasAnyPermission } from '@/constants/permissions'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    // Cache multi-projeto: Map de projectId → tasks
    tasksByProject: {} as Record<string, Task[]>,
    // Cache de permissões por projeto
    permissionsByProject: {} as Record<string, Record<string, boolean> | null>,
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
    dueDateFilter: 'all',
    isLoading: true,
    isGuestMode: false
  }),

  getters: {
    // Getter para obter as tasks do projeto atual
    tasks: (state): Task[] => {
      if (!state.currentProjectId) return []
      return state.tasksByProject[state.currentProjectId] || []
    },
    // Getter para obter as permissões do projeto atual
    memberPermissions: (state): Record<string, boolean> | null => {
      if (!state.currentProjectId) return null
      return state.permissionsByProject[state.currentProjectId] ?? null
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
    // Check if user can create tasks
    canCreateTasks(state): boolean {
      // Guest mode: can always create local tasks
      if (state.isGuestMode) return true
      if (!this.memberPermissions) return false
      return hasAnyPermission(this.memberPermissions, [
        PERMISSIONS.MANAGE_TASKS,
        PERMISSIONS.CREATE_TASKS
      ])
    },
    // Check if user can delete tasks
    canDeleteTasks(state): boolean {
      // Guest mode: can always delete local tasks
      if (state.isGuestMode) return true
      if (!this.memberPermissions) return false
      return hasAnyPermission(this.memberPermissions, [
        PERMISSIONS.MANAGE_TASKS,
        PERMISSIONS.DELETE_TASKS
      ])
    },
    // Check if user can edit tasks
    canEditTasks(state): boolean {
      // Guest mode: can always edit local tasks
      if (state.isGuestMode) return true
      if (!this.memberPermissions) return false
      return hasAnyPermission(this.memberPermissions, [
        PERMISSIONS.MANAGE_TASKS,
        PERMISSIONS.EDIT_TASKS
      ])
    },
    // Check if user can manage tasks (all task permissions)
    canManageTasks(state): boolean {
      // Guest mode: can always manage local tasks
      if (state.isGuestMode) return true
      if (!this.memberPermissions) return false
      return hasAnyPermission(this.memberPermissions, [
        PERMISSIONS.MANAGE_TASKS
      ])
    },
    // Check if user can toggle task status (complete/uncomplete)
    // This is separate from canEditTasks because assigned members can toggle status
    canToggleTaskStatus(state) {
      return (
        assignedMemberIds: string[] | undefined,
        userId: string | null
      ): boolean => {
        // Guest mode: can always toggle local tasks
        if (state.isGuestMode) return true
        // If user has edit permissions, allow toggle
        if (this.canEditTasks) return true
        // If user is assigned to the task, allow toggle
        if (userId && assignedMemberIds?.includes(userId)) return true
        return false
      }
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

        if (state.dueDateFilter !== 'all') {
          if (state.dueDateFilter === 'no-date') {
            if (task.dueDate) return false
          } else {
            if (!task.dueDate) return false
            const now = new Date()
            now.setHours(0, 0, 0, 0)
            const due = new Date(task.dueDate)
            due.setHours(0, 0, 0, 0)
            if (state.dueDateFilter === 'overdue' && due >= now) return false
            if (state.dueDateFilter === 'on-time' && due < now) return false
          }
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
          this.isGuestMode = false

          // Load workspace member permissions (for OWNER/ADMIN)
          const projectStore = useProjectStore()
          const workspacePermissions = projectStore.memberPermissions || {}

          // Load task-specific permissions from projectAssignments
          const userAssignmentRef = doc(
            $firestore,
            'workspaces',
            workspaceId,
            'projectAssignments',
            projectId,
            'users',
            userId
          )
          const userAssignmentSnap = await getDoc(userAssignmentRef)
          const taskPermissions = userAssignmentSnap.exists()
            ? userAssignmentSnap.data().permissions || {}
            : {}

          // Merge permissions (workspace + task-specific) e cacheia por projeto
          this.permissionsByProject[projectId] = {
            ...workspacePermissions,
            ...taskPermissions
          }

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
          // Guest mode for localStorage
          this.isGuestMode = true
          this.permissionsByProject[projectId] = null
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
        showErrorToast('Failed to load tasks')
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
      const { [projectId]: _perms, ...restPerms } = this.permissionsByProject
      this.tasksByProject = restTasks
      this.loadedProjects = restLoaded
      this.permissionsByProject = restPerms
    },

    // Limpa todo o cache
    clearCache() {
      this.tasksByProject = {}
      this.loadedProjects = {}
      this.permissionsByProject = {}
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
        showErrorToast('No project selected')
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
        return
      }

      // Optimistic: create task with temporary ID and push immediately
      const tempId = crypto.randomUUID()
      const now = new Date().toISOString()
      const optimisticTask: Task = {
        ...task,
        id: tempId,
        projectId,
        createdAt: now
      }
      this.tasksByProject[projectId].push(optimisticTask)

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

        // Replace optimistic task with server task (real ID)
        if (response.success && response.task) {
          const idx = this.tasksByProject[projectId].findIndex(
            (t) => t.id === tempId
          )
          if (idx !== -1) {
            this.tasksByProject[projectId][idx] = response.task
          }
        }
      } catch (error) {
        console.error('Error adding task:', error)
        // Rollback: remove the optimistic task
        this.tasksByProject[projectId] = this.tasksByProject[projectId].filter(
          (t) => t.id !== tempId
        )
        showErrorToast('Failed to add task')
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

      // Optimistic: snapshot + apply immediately
      const snapshot = { ...projectTasks[taskIndex] }
      projectTasks[taskIndex] = { ...projectTasks[taskIndex], ...updatedTask }

      try {
        const workspaceId = this.getWorkspaceId()
        if (!workspaceId) return

        const token = await this.getAuthToken()
        if (!token) throw new Error('Not authenticated')

        await $fetch<{ success: boolean }>(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            workspaceId,
            projectId,
            ...updatedTask,
            memberIds
          }
        })
      } catch (error) {
        console.error('Error updating task:', error)
        // Rollback: restore snapshot
        const currentIndex = projectTasks.findIndex((t) => t.id === id)
        if (currentIndex !== -1) {
          projectTasks[currentIndex] = snapshot
        }
        showErrorToast('Failed to update task')
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
        return
      }

      // Optimistic: save task + position, remove immediately
      const projectTasks = this.tasksByProject[projectId] || []
      const deletedIndex = projectTasks.findIndex((task) => task.id === id)
      if (deletedIndex === -1) return
      const deletedTask = { ...projectTasks[deletedIndex] }
      this.tasksByProject[projectId] = projectTasks.filter(
        (task) => task.id !== id
      )

      try {
        const workspaceId = this.getWorkspaceId()
        if (!workspaceId) return

        const token = await this.getAuthToken()
        if (!token) throw new Error('Not authenticated')

        await $fetch<{ success: boolean }>(`/api/tasks/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            workspaceId,
            projectId
          }
        })
      } catch (error) {
        console.error('Error deleting task:', error)
        // Rollback: re-insert at original position
        const currentTasks = this.tasksByProject[projectId] || []
        const insertIndex = Math.min(deletedIndex, currentTasks.length)
        currentTasks.splice(insertIndex, 0, deletedTask)
        this.tasksByProject[projectId] = currentTasks
        showErrorToast('Failed to delete task')
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
          showErrorToast('Failed to update task status')
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
    },

    setDueDateFilter(filter: string | null) {
      this.dueDateFilter = filter || 'all'
    }
  }
})
