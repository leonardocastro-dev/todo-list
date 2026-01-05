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
      if (!userId) {
        const localProjects = localStorage.getItem('localProjects')
        this.projects = localProjects ? JSON.parse(localProjects) : []
        return
      }

      // Legacy support - now projects are in workspaces subcollections
      this.projects = []
    },

    async loadProjectsForWorkspace(workspaceId: string, userId: string | null = null) {
      try {
        this.isLoading = true

        if (!userId) {
          const localProjects = localStorage.getItem('localProjects')
          this.projects = localProjects ? JSON.parse(localProjects) : []
          return
        }

        const { $firestore } = useNuxtApp()
        if (workspaceId) {
          const projectsRef = collection($firestore, 'workspaces', workspaceId, 'projects')
          const snapshot = await getDocs(projectsRef)

          if (!snapshot.empty) {
            this.projects = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Project[]
          } else {
            this.projects = []
          }
        } else {
          this.projects = []
        }
      } catch (error) {
        console.error('Error loading workspace projects:', error)
        toast.error('Failed to load workspace projects', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      } finally {
        this.isLoading = false
      }
    },

    async addProject(project: Project, userId: string | null = null, workspaceId?: string) {
      const { $firestore } = useNuxtApp()

      const timestamp = Date.now()
      const projectId = String(timestamp)
      const projectWithTimestamp = {
        ...project,
        id: projectId,
        workspaceId: workspaceId || undefined
      }

      if (!userId || !workspaceId) {
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

        // Save to workspace subcollection
        const projectRef = doc($firestore, 'workspaces', workspaceId, 'projects', projectId)
        await setDoc(projectRef, cleanProject)

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
      const { $firestore } = useNuxtApp()

      const index = this.projects.findIndex((project) => project.id === id)
      if (index !== -1) {
        this.projects[index] = {
          ...this.projects[index],
          ...updatedProject,
          updatedAt: new Date().toISOString()
        }

        if (userId) {
          try {
            const project = this.projects[index]
            if (!project.workspaceId) return

            const cleanUpdate = JSON.parse(
              JSON.stringify({ ...updatedProject, updatedAt: new Date().toISOString() })
            )

            const projectRef = doc($firestore, 'workspaces', project.workspaceId, 'projects', id)
            await updateDoc(projectRef, cleanUpdate)
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
      const { $firestore } = useNuxtApp()

      const projectToDelete = this.projects.find((project) => project.id === id)

      if (projectToDelete) {
        this.projects = this.projects.filter((project) => project.id !== id)

        if (userId && projectToDelete.workspaceId) {
          try {
            // Remove todas as tasks do projeto primeiro
            const tasksRef = collection($firestore, 'workspaces', projectToDelete.workspaceId, 'projects', id, 'tasks')
            const tasksSnapshot = await getDocs(tasksRef)

            const deletePromises = tasksSnapshot.docs.map(taskDoc =>
              deleteDoc(doc($firestore, 'workspaces', projectToDelete.workspaceId!, 'projects', id, 'tasks', taskDoc.id))
            )
            await Promise.all(deletePromises)

            // Remove o projeto
            const projectRef = doc($firestore, 'workspaces', projectToDelete.workspaceId, 'projects', id)
            await deleteDoc(projectRef)
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
