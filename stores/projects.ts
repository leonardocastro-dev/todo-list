import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import { ref as dbRef, set, get, update, remove } from 'firebase/database'

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
    isLoading: false
  }),

  getters: {
    totalProjects: (state) => state.projects.length,
    sortedProjects: (state) => {
      return [...state.projects].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    }
  },

  actions: {
    async loadProjects(userId: string | null = null) {
      const { $database } = useNuxtApp()
      try {
        this.isLoading = true

        if (userId) {
          const userProjectsRef = dbRef($database, `users/${userId}/projects`)
          const snapshot = await get(userProjectsRef)

          if (snapshot.exists()) {
            const projectsData = snapshot.val()
            this.projects = Object.values(projectsData) as Project[]
          } else {
            this.projects = []
          }
        } else {
          const localProjects = localStorage.getItem('localProjects')
          this.projects = localProjects ? JSON.parse(localProjects) : []
        }
      } catch (error) {
        console.error('Error loading projects:', error)
        toast.error('Failed to load projects', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      } finally {
        this.isLoading = false
      }
    },

    async addProject(project: Project, userId: string | null = null) {
      const { $database } = useNuxtApp()

      const timestamp = Date.now()
      const projectWithTimestamp = {
        ...project,
        id: String(timestamp)
      }

      if (!userId) {
        this.projects.push(projectWithTimestamp)
        localStorage.setItem('localProjects', JSON.stringify(this.projects))
        toast.message('Project added successfully', {
          style: { background: '#6ee7b7' },
          duration: 3000
        })
        return
      }

      try {
        const cleanProject = JSON.parse(JSON.stringify(projectWithTimestamp)) as Project
        const projectRef = dbRef($database, `users/${userId}/projects/${timestamp}`)
        await set(projectRef, cleanProject)

        this.projects.push(projectWithTimestamp)

        toast.message('Project added successfully', {
          style: { background: '#6ee7b7' },
          duration: 3000
        })
      } catch (error) {
        console.error('Error adding project:', error)
        toast.error('Failed to add project', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      }
    },

    async updateProject(id: string, updatedProject: Partial<Project>, userId: string | null = null) {
      const { $database } = useNuxtApp()

      const index = this.projects.findIndex((project) => project.id === id)
      if (index !== -1) {
        this.projects[index] = {
          ...this.projects[index],
          ...updatedProject,
          updatedAt: new Date().toISOString()
        }

        if (userId) {
          try {
            // Remove campos undefined antes de salvar no Firebase usando JSON.parse/stringify
            const cleanUpdate = JSON.parse(
              JSON.stringify({ ...updatedProject, updatedAt: new Date().toISOString() })
            )

            const projectRef = dbRef($database, `users/${userId}/projects/${id}`)
            await update(projectRef, cleanUpdate)
          } catch (error) {
            console.error('Error updating project:', error)
            toast.error('Failed to update project on server', {
              style: { background: '#fda4af' },
              duration: 3000
            })
            return
          }
        } else {
          localStorage.setItem('localProjects', JSON.stringify(this.projects))
        }
      }
    },

    async deleteProject(id: string, userId: string | null = null) {
      const { $database } = useNuxtApp()

      const projectToDelete = this.projects.find((project) => project.id === id)

      if (projectToDelete) {
        this.projects = this.projects.filter((project) => project.id !== id)

        if (userId) {
          try {
            // Remove o projeto
            const projectRef = dbRef($database, `users/${userId}/projects/${id}`)
            await remove(projectRef)

            // Remove todas as tasks do projeto
            const tasksRef = dbRef($database, `users/${userId}/tasks/${id}`)
            await remove(tasksRef)
          } catch (error) {
            console.error('Error deleting project:', error)
            toast.error('Failed to delete project on server', {
              style: { background: '#fda4af' },
              duration: 3000
            })
            return
          }
        } else {
          localStorage.setItem('localProjects', JSON.stringify(this.projects))
          localStorage.removeItem(`localTasks_${id}`)
        }

        toast.message('Project deleted successfully', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      }
    },

    async inviteMember(projectId: string, memberEmail: string, userId: string | null = null) {
      const project = this.projects.find(p => p.id === projectId)
      if (!project) return

      if (!project.members) {
        project.members = []
      }

      if (project.members.includes(memberEmail)) {
        toast.message('Member already in project', {
          style: { background: '#fdba74' },
          duration: 3000
        })
        return
      }

      project.members.push(memberEmail)
      await this.updateProject(projectId, { members: project.members }, userId)

      toast.message(`Invited ${memberEmail} to project`, {
        style: { background: '#6ee7b7' },
        duration: 3000
      })
    }
  }
})
