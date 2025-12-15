import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Workspace } from '@/types/Workspace'
import { useAuth } from '@/composables/useAuth'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>([])
  const currentWorkspace = ref<Workspace | null>(null)
  const isLoading = ref(false)
  const loaded = ref(false)

  const { user } = useAuth()

  // Computed
  const userWorkspaces = computed(() => workspaces.value)

  // Actions
  const loadWorkspaces = async (userId: string | null = null) => {
    isLoading.value = true
    try {
      if (!userId) {
        const localWorkspaces = localStorage.getItem('localWorkspaces')
        workspaces.value = localWorkspaces ? JSON.parse(localWorkspaces) : []
        loaded.value = true
        return
      }

      const { $firestore } = useNuxtApp()

      // Query workspaces where user is owner or member
      const workspacesRef = collection($firestore, 'workspaces')
      const q = query(
        workspacesRef,
        where('members', 'array-contains', userId)
      )

      const snapshot = await getDocs(q)

      workspaces.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workspace[]
      loaded.value = true
    } catch (error) {
      console.error('Error loading workspaces:', error)
    } finally {
      isLoading.value = false
    }
  }

  const createWorkspace = async (name: string, description?: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const workspaceId = `${slug}-${Date.now()}`
    const workspace: Workspace = {
      id: workspaceId,
      slug,
      name,
      description,
      ownerId: user.value?.uid || 'local',
      members: user.value?.uid ? [user.value.uid] : ['local'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    if (!user.value?.uid) {
      // Modo offline - salvar no localStorage
      workspaces.value.push(workspace)
      localStorage.setItem('localWorkspaces', JSON.stringify(workspaces.value))
      return workspace
    }

    try {
      const { $firestore } = useNuxtApp()

      const workspaceRef = doc($firestore, 'workspaces', workspaceId)
      await setDoc(workspaceRef, workspace)

      workspaces.value.push(workspace)
      return workspace
    } catch (error) {
      console.error('Error creating workspace:', error)
      return null
    }
  }

  const updateWorkspace = async (workspaceId: string, name: string, description?: string) => {
    const workspaceIndex = workspaces.value.findIndex(ws => ws.id === workspaceId)
    if (workspaceIndex === -1) return null

    const updatedWorkspace = {
      ...workspaces.value[workspaceIndex],
      name,
      description,
      updatedAt: Date.now()
    }

    if (!user.value?.uid) {
      // Modo offline
      workspaces.value[workspaceIndex] = updatedWorkspace
      localStorage.setItem('localWorkspaces', JSON.stringify(workspaces.value))
      return updatedWorkspace
    }

    try {
      const { $firestore } = useNuxtApp()

      const workspaceRef = doc($firestore, 'workspaces', workspaceId)
      await updateDoc(workspaceRef, {
        name,
        description,
        updatedAt: Date.now()
      })

      workspaces.value[workspaceIndex] = updatedWorkspace
      return updatedWorkspace
    } catch (error) {
      console.error('Error updating workspace:', error)
      return null
    }
  }

  const setCurrentWorkspace = (workspace: Workspace | null) => {
    currentWorkspace.value = workspace
  }

  const getWorkspaceBySlug = (slug: string) => {
    return workspaces.value.find(ws => ws.slug === slug) || null
  }

  const clearLocalData = () => {
    workspaces.value = []
    currentWorkspace.value = null
    loaded.value = false
    localStorage.removeItem('localWorkspaces')
  }

  const deleteWorkspace = async (workspaceId: string, userId: string | null = null) => {
    workspaces.value = workspaces.value.filter(ws => ws.id !== workspaceId)

    if (!userId) {
      localStorage.setItem('localWorkspaces', JSON.stringify(workspaces.value))
      return
    }

    try {
      const { $firestore } = useNuxtApp()
      const workspaceRef = doc($firestore, 'workspaces', workspaceId)
      await deleteDoc(workspaceRef)
    } catch (error) {
      console.error('Error deleting workspace:', error)
    }
  }

  return {
    // State
    workspaces,
    currentWorkspace,
    isLoading,
    loaded,

    // Computed
    userWorkspaces,

    // Actions
    loadWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setCurrentWorkspace,
    getWorkspaceBySlug,
    clearLocalData
  }
})
