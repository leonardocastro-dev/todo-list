import { ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { PERMISSIONS } from '@/constants/permissions'

export interface WorkspaceMember {
  uid: string
  email: string
  username: string
  photoURL: string | null
  permissions?: Record<string, boolean>
}

const hasUniversalAccess = (
  permissions: Record<string, boolean> | undefined
): boolean => {
  if (!permissions) return false
  return !!(
    permissions[PERMISSIONS.OWNER] ||
    permissions[PERMISSIONS.ADMIN] ||
    permissions[PERMISSIONS.ACCESS_PROJECTS] ||
    permissions[PERMISSIONS.ALL_PROJECTS]
  )
}

// Singleton state - shared across all component instances
const members = ref<WorkspaceMember[]>([])
const selectedMemberIds = ref<string[]>([])
const isLoadingMembers = ref(false)
const error = ref<string | null>(null)
const loadedWorkspaceId = ref<string | null>(null)

export const useMembers = () => {
  const loadWorkspaceMembers = async (workspaceId: string) => {
    if (!workspaceId) return

    // Skip if already loaded for this workspace
    if (loadedWorkspaceId.value === workspaceId && members.value.length > 0) {
      return
    }

    isLoadingMembers.value = true
    error.value = null

    try {
      const { $firestore } = useNuxtApp()
      const membersRef = collection(
        $firestore,
        'workspaces',
        workspaceId,
        'members'
      )
      const snapshot = await getDocs(membersRef)

      members.value = snapshot.docs
        .map((doc) => ({
          uid: doc.id,
          email: doc.data().email,
          username: doc.data().username,
          photoURL: doc.data().photoURL || null,
          permissions: doc.data().permissions || {}
        }))
        .filter((member) => !hasUniversalAccess(member.permissions))

      loadedWorkspaceId.value = workspaceId
    } catch (e) {
      error.value = 'Failed to load members'
      console.error('Error loading workspace members:', e)
    } finally {
      isLoadingMembers.value = false
    }
  }

  const loadProjectMemberAccess = async (
    workspaceId: string,
    projectId: string
  ) => {
    if (!workspaceId || !projectId) {
      selectedMemberIds.value = []
      return
    }

    isLoadingMembers.value = true

    try {
      const { $firestore } = useNuxtApp()
      const membersRef = collection(
        $firestore,
        'workspaces',
        workspaceId,
        'members'
      )
      const snapshot = await getDocs(membersRef)

      const memberIdsWithAccess: string[] = []
      snapshot.docs.forEach((doc) => {
        const permissions = doc.data().permissions || {}

        if (hasUniversalAccess(permissions)) {
          return
        }

        if (permissions[projectId] === true) {
          memberIdsWithAccess.push(doc.id)
        }
      })

      selectedMemberIds.value = memberIdsWithAccess
    } catch (e) {
      console.error('Error loading project member access:', e)
    } finally {
      isLoadingMembers.value = false
    }
  }

  return {
    members,
    selectedMemberIds,
    isLoadingMembers,
    error,
    loadWorkspaceMembers,
    loadProjectMemberAccess
  }
}
