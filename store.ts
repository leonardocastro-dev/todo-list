import { defineStore } from 'pinia'

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
        // Filtrar por status
        if (state.statusFilter !== 'all' && task.status !== state.statusFilter) {
          return false
        }

        // Filtrar por prioridade
        if (state.priorityFilter !== 'all' && task.priority !== state.priorityFilter) {
          return false
        }

        // Filtrar por busca
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
      console.log('addTask', task)
      this.tasks.push(task)
    },
    updateTask(id: string, updatedTask: Partial<Task>) {
      const index = this.tasks.findIndex(task => task.id === id)
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...updatedTask }
      }
    },
    deleteTask(id: string) {
      this.tasks = this.tasks.filter(task => task.id !== id)
    },
    toggleTaskStatus(id: string, checked: boolean) {
      console.log('toggleTaskStatus', id, checked)
      const index = this.tasks.findIndex(task => task.id === id)
      if (index !== -1) {
        this.tasks[index].status = checked ? 'completed' : 'pending'
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
