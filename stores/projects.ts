import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import { collection, doc, getDocs, getDoc } from 'firebase/firestore'
import { useAuth } from '@/composables/useAuth'

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
    isLoading: false,
    memberPermissions: null as Record<string, boolean> | null
  }),

  getters: {
    totalProjects: (state) => state.projects.length,
    sortedProjects: (state) => {
      return [...state.projects].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    },
    // Check if user has access to all projects
    hasAllProjectsAccess: (state) => {
      if (!state.memberPermissions) return false
      return (
        state.memberPermissions['owner'] ||
        state.memberPermissions['admin'] ||
        state.memberPermissions['all-projects']
      )
    },
    // Check if user can create projects
    canCreateProjects: (state) => {
      if (!state.memberPermissions) return false
      return (
        state.memberPermissions['owner'] ||
        state.memberPermissions['admin'] ||
        state.memberPermissions['manage-projects'] ||
        state.memberPermissions['create-projects']
      )
    },
    // Check if user can delete projects
    canDeleteProjects: (state) => {
      if (!state.memberPermissions) return false
      return (
        state.memberPermissions['owner'] ||
        state.memberPermissions['admin'] ||
        state.memberPermissions['manage-projects'] ||
        state.memberPermissions['delete-projects']
      )
    },
    // Check if user can edit projects
    canEditProjects: (state) => {
      if (!state.memberPermissions) return false
      return (
        state.memberPermissions['owner'] ||
        state.memberPermissions['admin'] ||
        state.memberPermissions['manage-projects'] ||
        state.memberPermissions['edit-projects']
      )
    }
  },

  actions: {
    // Helper to get auth token
    async getAuthToken(): Promise<string | null> {
      const { user } = useAuth()
      if (!user.value) return null
      return await user.value.getIdToken()
    },
    // Check if user has access to a specific project
    hasProjectAccess(projectId: string): boolean {
      if (!this.memberPermissions) return false
      return (
        this.memberPermissions['owner'] ||
        this.memberPermissions['admin'] ||
        this.memberPermissions['all-projects'] ||
        this.memberPermissions[projectId]
      )
    },

    async loadProjects(userId: string | null = null) {
      if (!userId) {
        const localProjects = localStorage.getItem('localProjects')
        this.projects = localProjects ? JSON.parse(localProjects) : []
        return
      }

      // Legacy support - now projects are in workspaces subcollections
      this.projects = []
    },

    async loadProjectsForWorkspace(
      workspaceId: string,
      userId: string | null = null
    ) {
      try {
        this.isLoading = true

        if (!userId) {
          const localProjects = localStorage.getItem('localProjects')
          this.projects = localProjects ? JSON.parse(localProjects) : []
          return
        }

        const { $firestore } = useNuxtApp()

        // First, get the member's permissions
        const memberRef = doc(
          $firestore,
          'workspaces',
          workspaceId,
          'members',
          userId
        )
        const memberSnap = await getDoc(memberRef)

        if (memberSnap.exists()) {
          this.memberPermissions = memberSnap.data().permissions || null
        } else {
          this.memberPermissions = null
        }

        if (workspaceId) {
          const projectsRef = collection(
            $firestore,
            'workspaces',
            workspaceId,
            'projects'
          )
          const snapshot = await getDocs(projectsRef)

          if (!snapshot.empty) {
            const allProjects = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            })) as Project[]

            // Filter projects based on permissions
            if (this.hasAllProjectsAccess) {
              // User has access to all projects
              this.projects = allProjects
            } else if (this.memberPermissions) {
              // User has access to specific projects only
              this.projects = allProjects.filter(
                (project) => this.memberPermissions![project.id] === true
              )
            } else {
              // No permissions - no access
              this.projects = []
            }
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

    async addProject(
      project: Project,
      userId: string | null = null,
      workspaceId?: string
    ) {
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
        const token = await this.getAuthToken()
        if (!token) throw new Error('Not authenticated')

        const response = await $fetch<{ success: boolean; project: Project }>(
          '/api/projects',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: {
              workspaceId,
              title: project.title,
              description: project.description
            }
          }
        )

        if (response.success && response.project) {
          this.projects.push({ ...response.project, workspaceId })
        }

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

    async updateProject(
      id: string,
      updatedProject: Partial<Project>,
      userId: string | null = null
    ) {
      const index = this.projects.findIndex((project) => project.id === id)
      if (index === -1) return

      if (!userId) {
        this.projects[index] = {
          ...this.projects[index],
          ...updatedProject,
          updatedAt: new Date().toISOString()
        }
        localStorage.setItem('localProjects', JSON.stringify(this.projects))
        return
      }

      try {
        const project = this.projects[index]
        if (!project.workspaceId) return

        const token = await this.getAuthToken()
        if (!token) throw new Error('Not authenticated')

        const response = await $fetch<{
          success: boolean
          project: Partial<Project>
        }>(`/api/projects/${id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            workspaceId: project.workspaceId,
            ...updatedProject
          }
        })

        if (response.success) {
          this.projects[index] = {
            ...this.projects[index],
            ...response.project
          }
        }
      } catch (error) {
        console.error('Error updating project:', error)
        toast.error('Failed to update project on server', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      }
    },

    async deleteProject(id: string, userId: string | null = null) {
      const projectToDelete = this.projects.find((project) => project.id === id)

      if (!projectToDelete) return

      if (!userId || !projectToDelete.workspaceId) {
        this.projects = this.projects.filter((project) => project.id !== id)
        localStorage.setItem('localProjects', JSON.stringify(this.projects))
        localStorage.removeItem(`localTasks_${id}`)
        toast.message('Project deleted successfully', {
          style: { background: '#fda4af' },
          duration: 3000
        })
        return
      }

      try {
        const token = await this.getAuthToken()
        if (!token) throw new Error('Not authenticated')

        const response = await $fetch<{ success: boolean }>(
          `/api/projects/${id}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            body: { workspaceId: projectToDelete.workspaceId }
          }
        )

        if (response.success) {
          this.projects = this.projects.filter((project) => project.id !== id)
          toast.message('Project deleted successfully', {
            style: { background: '#fda4af' },
            duration: 3000
          })
        }
      } catch (error) {
        console.error('Error deleting project:', error)
        toast.error('Failed to delete project on server', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      }
    },

    async inviteMember(
      projectId: string,
      memberEmail: string,
      userId: string | null = null
    ) {
      const project = this.projects.find((p) => p.id === projectId)
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
