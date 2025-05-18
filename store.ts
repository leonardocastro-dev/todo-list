import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'

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
    priorityFilter: 'all'
  }),

  getters: {
    totalTasks: (state) => state.tasks.length,
    completedTasks: (state) => state.tasks.filter(task => task.status === 'completed').length,
    pendingTasks: (state) => state.tasks.filter(task => task.status === 'pending').length,
    urgentTasks: (state) => state.tasks.filter(task => task.priority === 'urgent' && task.status === 'pending').length,
    completionPercentage: (state) => {
      const total = state.tasks.length
      const completed = state.tasks.filter(task => task.status === 'completed').length
      return total > 0 ? Math.round((completed / total) * 100) : 0
    },
    filteredTasks: (state) => {
      return state.tasks.filter(task => {
        if (state.statusFilter !== 'all' && task.status !== state.statusFilter) {
          return false
        }

        if (state.priorityFilter !== 'all' && task.priority !== state.priorityFilter) {
          return false
        }

        if (state.searchQuery.trim() !== '') {
          const query = state.searchQuery.toLowerCase()
          return (
            task.title.toLowerCase().includes(query) ||
            (task.description?.toLowerCase().includes(query) || false)
          )
        }

        return true
      })
    }
  },

  actions: {
    addTask(task: Task) {
      this.tasks.push(task)

      toast.message('Task added successfully', {
        style: { background: '#6ee7b7' },
        duration: 3000
      })
    },
    updateTask(id: string, updatedTask: Partial<Task>) {
      const index = this.tasks.findIndex(task => task.id === id)
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...updatedTask }

        toast.message('Task updated successfully', {
          style: { background: '#6ee7b7' },
          duration: 3000
        })
      }
    },
    deleteTask(id: string) {
      const taskToDelete = this.tasks.find(task => task.id === id)
      if (taskToDelete) {
        this.tasks = this.tasks.filter(task => task.id !== id)

        toast.message('Task deleted successfully', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      }
    },
    toggleTaskStatus(id: string, checked: boolean) {
      const index = this.tasks.findIndex(task => task.id === id)
      if (index !== -1) {
        this.tasks[index].status = checked ? 'completed' : 'pending'

        const status = checked ? 'completed' : 'pending'
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
