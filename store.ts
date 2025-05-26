import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import { ref as dbRef, set, get, update, remove } from 'firebase/database'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'completed'
  priority: 'normal' | 'important' | 'urgent'
  dueDate?: string
  createdAt: string
}

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [] as Task[],
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
    async loadTasks(userId = null) {
      const { $database } = useNuxtApp()

      try {
        this.isLoading = true

        if (userId) {
          const userTasksRef = dbRef($database, `users/${userId}/tasks`)
          const snapshot = await get(userTasksRef)

          if (snapshot.exists()) {
            const tasksData = snapshot.val()
            this.tasks = Object.values(tasksData) as Task[]
          } else {
            this.tasks = []
          }
        } else {
          const localTasks = localStorage.getItem('localTasks')
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

    async addTask(task: Task, userId = null) {
      const { $database } = useNuxtApp()

      if (!userId) {
        this.tasks.push(task)
        localStorage.setItem('localTasks', JSON.stringify(this.tasks))
        toast.message('Task added successfully', {
          style: { background: '#6ee7b7' },
          duration: 3000
        })
        return
      }

      try {
        const timestamp = Date.now()
        const taskWithTimestamp = {
          ...task,
          id: String(timestamp)
        }

        const taskRef = dbRef($database, `users/${userId}/tasks/${timestamp}`)

        await set(taskRef, taskWithTimestamp)

        this.tasks.push(taskWithTimestamp)

        toast.message('Task added successfully', {
          style: { background: '#6ee7b7' },
          duration: 3000
        })
      } catch (error) {
        console.error('Error adding task:', error)
        toast.error('Failed to add task', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      }
    },

    async updateTask(id: string, updatedTask: Partial<Task>, userId = null) {
      const { $database } = useNuxtApp()

      const index = this.tasks.findIndex((task) => task.id === id)
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...updatedTask }

        if (userId) {
          try {
            const taskRef = dbRef($database, `users/${userId}/tasks/${id}`)
            await update(taskRef, updatedTask)
          } catch (error) {
            console.error('Error updating task:', error)
            toast.error('Failed to update task on server', {
              style: { background: '#fda4af' },
              duration: 3000
            })
            return
          }
        } else {
          localStorage.setItem('localTasks', JSON.stringify(this.tasks))
        }

        toast.message('Task updated successfully', {
          style: { background: '#6ee7b7' },
          duration: 3000
        })
      }
    },

    async deleteTask(id: string, userId = null) {
      const { $database } = useNuxtApp()

      const taskToDelete = this.tasks.find((task) => task.id === id)

      if (taskToDelete) {
        this.tasks = this.tasks.filter((task) => task.id !== id)

        if (userId) {
          try {
            const taskRef = dbRef($database, `users/${userId}/tasks/${id}`)
            await remove(taskRef)
          } catch (error) {
            console.error('Error deleting task:', error)
            toast.error('Failed to delete task on server', {
              style: { background: '#fda4af' },
              duration: 3000
            })
            return
          }
        } else {
          localStorage.setItem('localTasks', JSON.stringify(this.tasks))
        }

        toast.message('Task deleted successfully', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      }
    },

    async toggleTaskStatus(id: string, checked: boolean, userId = null) {
      const status = checked ? 'completed' : 'pending'

      const index = this.tasks.findIndex((task) => task.id === id)
      if (index !== -1) {
        this.tasks[index].status = status

        if (userId) {
          try {
            const { $database } = useNuxtApp()
            const taskRef = dbRef($database, `users/${userId}/tasks/${id}`)
            await update(taskRef, { status })
          } catch (error) {
            console.error('Error updating task status:', error)
            toast.error('Failed to update task status on server', {
              style: { background: '#fda4af' },
              duration: 3000
            })
            return
          }
        } else {
          localStorage.setItem('localTasks', JSON.stringify(this.tasks))
        }

        toast.message(`Task changed to ${status}`, {
          style: { background: checked ? '#6ee7b7' : '#fdba74' },
          duration: 3000
        })
      }
    },

    setSearchQuery(query: string) {
      this.searchQuery = query
    },

    setStatusFilter(status: string) {
      this.statusFilter = status
    },

    setPriorityFilter(priority: string) {
      this.priorityFilter = priority
    }
  }
})
