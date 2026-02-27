import { ref } from 'vue'
import { doc, getDoc } from 'firebase/firestore'

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

      // Workspace-level granular permissions
      const workspacePerms = projectStore.memberPermissions || {}

      // Load project-specific permissions for each project
      const permPromises = projectIds.map(async (projectId) => {
        const assignmentRef = doc(
          $firestore,
          `workspaces/${workspaceId}/projectAssignments/${projectId}/users/${userId}`
        )
        const snap = await getDoc(assignmentRef)

        const projectPerms = snap.exists() ? snap.data()?.permissions || {} : {}

        // Merge workspace + project permissions
        projectPermissionsMap.value[projectId] = {
          ...workspacePerms,
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
