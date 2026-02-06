import { ref, computed } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { PERMISSIONS } from '@/constants/permissions'

export interface WorkspaceMember {
  uid: string
  email: string
  username: string
  avatarUrl: string | null
  permissions?: Record<string, boolean>
  joinedAt?: any
}

const isOwnerOrAdmin = (
  permissions: Record<string, boolean> | undefined
): boolean => {
  if (!permissions) return false
  return !!(permissions[PERMISSIONS.OWNER] || permissions[PERMISSIONS.ADMIN])
}

// Singleton state - shared across all component instances
const allMembers = ref<WorkspaceMember[]>([])
const selectedMemberIds = ref<string[]>([])

// Filtered members for project access (excludes owners/admins/access-projects)
const membersForProjects = computed(() =>
  allMembers.value.filter(
    (member) =>
      !isOwnerOrAdmin(member.permissions) &&
      !member.permissions?.[PERMISSIONS.ACCESS_PROJECTS]
  )
)
const projectAssignmentsMap = ref<Record<string, string[]>>({})
const projectAssignmentsDataMap = ref<
  Record<string, Record<string, ProjectAssignment>>
>({})
const taskAssignmentsMap = ref<Record<string, string[]>>({})
const isLoadingMembers = ref(false)
const error = ref<string | null>(null)
const loadedWorkspaceId = ref<string | null>(null)

export const useMembers = () => {
  const loadWorkspaceMembers = async (
    workspaceId: string,
    forceReload = false
  ) => {
    if (!workspaceId) return

    // Skip if already loaded for this workspace (unless forcing reload)
    if (
      !forceReload &&
      loadedWorkspaceId.value === workspaceId &&
      allMembers.value.length > 0
    ) {
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

      allMembers.value = snapshot.docs.map((doc) => ({
        uid: doc.id,
        email: doc.data().email,
        username: doc.data().username,
        avatarUrl: doc.data().avatarUrl || null,
        permissions: doc.data().permissions || {},
        joinedAt: doc.data().joinedAt
      }))

      loadedWorkspaceId.value = workspaceId
    } catch (e) {
      error.value = 'Failed to load members'
      console.error('Error loading workspace members:', e)
    } finally {
      isLoadingMembers.value = false
    }
  }

  const loadProjectMembers = async (workspaceId: string, projectId: string) => {
    if (!workspaceId || !projectId) {
      selectedMemberIds.value = []
      return
    }

    isLoadingMembers.value = true

    try {
      const { $firestore } = useNuxtApp()
      // Query projectAssignments collection for assigned members
      const assignmentsRef = collection(
        $firestore,
        'workspaces',
        workspaceId,
        'projectAssignments',
        projectId,
        'users'
      )
      const snapshot = await getDocs(assignmentsRef)

      selectedMemberIds.value = snapshot.docs.map((doc) => doc.id)
    } catch (e) {
      console.error('Error loading project members:', e)
      selectedMemberIds.value = []
    } finally {
      isLoadingMembers.value = false
    }
  }

  const loadAllProjectAssignments = async (
    workspaceId: string,
    projectIds: string[]
  ) => {
    if (!workspaceId || projectIds.length === 0) {
      projectAssignmentsMap.value = {}
      projectAssignmentsDataMap.value = {}
      return
    }

    try {
      const { $firestore } = useNuxtApp()
      const assignments: Record<string, string[]> = {}
      const assignmentsData: Record<
        string,
        Record<string, ProjectAssignment>
      > = {}

      await Promise.all(
        projectIds.map(async (projectId) => {
          const assignmentsRef = collection(
            $firestore,
            'workspaces',
            workspaceId,
            'projectAssignments',
            projectId,
            'users'
          )
          const snapshot = await getDocs(assignmentsRef)
          assignments[projectId] = snapshot.docs.map((doc) => doc.id)
          assignmentsData[projectId] = {}
          snapshot.docs.forEach((doc) => {
            assignmentsData[projectId][doc.id] = doc.data() as ProjectAssignment
          })
        })
      )

      projectAssignmentsMap.value = assignments
      projectAssignmentsDataMap.value = assignmentsData
    } catch (e) {
      console.error('Error loading project assignments:', e)
      projectAssignmentsMap.value = {}
      projectAssignmentsDataMap.value = {}
    }
  }

  const loadTaskAssignees = async (
    workspaceId: string,
    projectId: string,
    taskId: string
  ) => {
    if (!workspaceId || !projectId || !taskId) {
      selectedMemberIds.value = []
      return
    }

    isLoadingMembers.value = true

    try {
      const { $firestore } = useNuxtApp()
      const assignmentsRef = collection(
        $firestore,
        'workspaces',
        workspaceId,
        'projects',
        projectId,
        'taskAssignments',
        taskId,
        'users'
      )
      const snapshot = await getDocs(assignmentsRef)

      selectedMemberIds.value = snapshot.docs.map((doc) => doc.id)
    } catch (e) {
      console.error('Error loading task assignees:', e)
      selectedMemberIds.value = []
    } finally {
      isLoadingMembers.value = false
    }
  }

  const loadAllTaskAssignments = async (
    workspaceId: string,
    projectId: string,
    taskIds: string[]
  ) => {
    if (!workspaceId || !projectId || taskIds.length === 0) {
      taskAssignmentsMap.value = {}
      return
    }

    try {
      const { $firestore } = useNuxtApp()
      const assignments: Record<string, string[]> = {}

      await Promise.all(
        taskIds.map(async (taskId) => {
          const assignmentsRef = collection(
            $firestore,
            'workspaces',
            workspaceId,
            'projects',
            projectId,
            'taskAssignments',
            taskId,
            'users'
          )
          const snapshot = await getDocs(assignmentsRef)
          assignments[taskId] = snapshot.docs.map((doc) => doc.id)
        })
      )

      taskAssignmentsMap.value = assignments
    } catch (e) {
      console.error('Error loading task assignments:', e)
      taskAssignmentsMap.value = {}
    }
  }

  const removeMemberLocally = (memberId: string) => {
    allMembers.value = allMembers.value.filter((m) => m.uid !== memberId)
  }

  return {
    members: allMembers,
    membersForProjects,
    selectedMemberIds,
    projectAssignmentsMap,
    projectAssignmentsDataMap,
    taskAssignmentsMap,
    isLoadingMembers,
    error,
    loadWorkspaceMembers,
    loadProjectMembers,
    loadAllProjectAssignments,
    loadTaskAssignees,
    loadAllTaskAssignments,
    removeMemberLocally
  }
}
