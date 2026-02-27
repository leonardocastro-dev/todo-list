import { ref } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { WORKSPACE_PERMISSION_SET } from '@/constants/permissions'

export const useProjectPermissions = () => {
  const projectPermissionsMap = ref<Record<string, Record<string, boolean>>>({})
  const isLoading = ref(false)

  const loadProjectPermissions = async (
    workspaceId: string,
    projectIds: string[],
    userId: string
  ) => {
    isLoading.value = true

    try {
      const { $firestore } = useNuxtApp()
      const projectStore = useProjectStore()

      // Filter to only workspace-scoped permissions (exclude task permissions)
      const workspacePerms = projectStore.memberPermissions || {}
      const filteredWorkspacePerms: Record<string, boolean> = {}
      for (const [key, val] of Object.entries(workspacePerms)) {
        if (WORKSPACE_PERMISSION_SET.has(key)) {
          filteredWorkspacePerms[key] = val
        }
      }

      // Load project-specific permissions for each project
      const permPromises = projectIds.map(async (projectId) => {
        const assignmentRef = doc(
          $firestore,
          `workspaces/${workspaceId}/projectAssignments/${projectId}/users/${userId}`
        )
        const snap = await getDoc(assignmentRef)

        const projectPerms = snap.exists() ? snap.data()?.permissions || {} : {}

        // Merge filtered workspace + project permissions
        projectPermissionsMap.value[projectId] = {
          ...filteredWorkspacePerms,
          ...projectPerms
        }
      })

      await Promise.all(permPromises)
    } finally {
      isLoading.value = false
    }
  }

  return {
    projectPermissionsMap,
    isLoading,
    loadProjectPermissions
  }
}
