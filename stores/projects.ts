import { defineStore } from 'pinia'
import { collection, doc, getDocs, getDoc } from 'firebase/firestore'
import { useAuth } from '@/composables/useAuth'
import { showSuccessToast, showErrorToast } from '@/utils/toast'
import { PERMISSIONS, hasAnyPermission } from '@/constants/permissions'

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
    isLoading: false,
    error: null as string | null,
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
      return hasAnyPermission(state.memberPermissions, [
        PERMISSIONS.OWNER,
        PERMISSIONS.ADMIN,
        PERMISSIONS.ACCESS_PROJECTS,
        PERMISSIONS.ALL_PROJECTS
      ])
    },
    // Check if user can create projects
    canCreateProjects: (state) => {
      if (!state.memberPermissions) return false
      return hasAnyPermission(state.memberPermissions, [
        PERMISSIONS.OWNER,
        PERMISSIONS.ADMIN,
        PERMISSIONS.MANAGE_PROJECTS,
        PERMISSIONS.CREATE_PROJECTS
      ])
    },
    // Check if user can delete projects
    canDeleteProjects: (state) => {
      if (!state.memberPermissions) return false
      return hasAnyPermission(state.memberPermissions, [
        PERMISSIONS.OWNER,
        PERMISSIONS.ADMIN,
        PERMISSIONS.MANAGE_PROJECTS,
        PERMISSIONS.DELETE_PROJECTS
      ])
    },
    // Check if user can edit projects
    canEditProjects: (state) => {
      if (!state.memberPermissions) return false
      return hasAnyPermission(state.memberPermissions, [
        PERMISSIONS.OWNER,
        PERMISSIONS.ADMIN,
        PERMISSIONS.MANAGE_PROJECTS,
        PERMISSIONS.EDIT_PROJECTS
      ])
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
        hasAnyPermission(this.memberPermissions, [
          PERMISSIONS.OWNER,
          PERMISSIONS.ADMIN,
          PERMISSIONS.ACCESS_PROJECTS,
          PERMISSIONS.ALL_PROJECTS
        ]) || this.memberPermissions[projectId] === true
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
        this.error = null

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
        this.error = 'Failed to load projects'
        showErrorToast('Failed to load workspace projects')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async addProject(
      project: Project,
      userId: string | null = null,
      workspaceId?: string,
      memberIds?: string[]
    ) {
      const projectWithTimestamp = {
        ...project,
        workspaceId: workspaceId || undefined
      }

      // Optimistic: Add immediately
      this.projects.push(projectWithTimestamp)

      if (!userId || !workspaceId) {
        localStorage.setItem('localProjects', JSON.stringify(this.projects))
        showSuccessToast('Project added successfully')
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
              description: project.description,
              emoji: project.emoji,
              memberIds
            }
          }
        )

        if (response.success && response.project) {
          // Update with server response
          const index = this.projects.findIndex((p) => p.id === project.id)
          if (index !== -1) {
            this.projects[index] = { ...response.project, workspaceId }
          }
        }

        showSuccessToast('Project added successfully')
      } catch (error) {
        // Rollback: Remove from state
        this.projects = this.projects.filter((p) => p.id !== project.id)
        console.error('Error adding project:', error)
        showErrorToast('Failed to add project')
        throw error
      }
    },

    async updateProject(
      id: string,
      updatedProject: Partial<Project>,
      userId: string | null = null,
      memberIds?: string[]
    ) {
      const index = this.projects.findIndex((project) => project.id === id)
      if (index === -1) return

      // Backup for rollback
      const backup = { ...this.projects[index] }

      // Optimistic: Update immediately
      this.projects[index] = {
        ...this.projects[index],
        ...updatedProject,
        updatedAt: new Date().toISOString()
      }

      if (!userId) {
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
            ...updatedProject,
            memberIds
          }
        })

        if (response.success) {
          this.projects[index] = {
            ...this.projects[index],
            ...response.project
          }
        }
      } catch (error) {
        // Rollback: Restore backup
        this.projects[index] = backup
        console.error('Error updating project:', error)
        showErrorToast('Failed to update project')
        throw error
      }
    },

    async deleteProject(id: string, userId: string | null = null) {
      const projectToDelete = this.projects.find((project) => project.id === id)
      if (!projectToDelete) return

      // Backup for rollback
      const backup = [...this.projects]

      // Optimistic: Remove immediately
      this.projects = this.projects.filter((project) => project.id !== id)

      if (!userId || !projectToDelete.workspaceId) {
        localStorage.setItem('localProjects', JSON.stringify(this.projects))
        localStorage.removeItem(`localTasks_${id}`)
        showSuccessToast('Project deleted successfully')
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
          showSuccessToast('Project deleted successfully')
        }
      } catch (error) {
        // Rollback: Restore projects
        this.projects = backup
        console.error('Error deleting project:', error)
        showErrorToast('Failed to delete project')
        throw error
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
        showErrorToast('Member already in project')
        return
      }

      project.members.push(memberEmail)
      await this.updateProject(projectId, { members: project.members }, userId)

      showSuccessToast(`Invited ${memberEmail} to project`)
    }
  }
})
