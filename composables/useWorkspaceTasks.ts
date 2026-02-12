import { ref, readonly } from 'vue'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'

// Cache structure: { workspaceId: { scope: { tasks, loadedAt } } }
interface CacheEntry {
  tasks: Task[]
  loadedAt: number
}

const cache = ref<Record<string, Record<string, CacheEntry>>>({})

export const useWorkspaceTasks = () => {
  const tasks = ref<Task[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadWorkspaceTasks = async (
    workspaceId: string,
    scope: 'all' | 'assigneds',
    userId: string | undefined,
    forceReload = false
  ) => {
    // Check cache first (unless forcing reload)
    if (!forceReload && cache.value[workspaceId]) {
      // If requesting assigneds but we have 'all' cached, filter client-side
      if (scope === 'assigneds' && cache.value[workspaceId]['all'] && userId) {
        const allTasks = cache.value[workspaceId]['all'].tasks
        const filteredTasks = allTasks.filter((t) => t.assigneeIds?.includes(userId))
        tasks.value = filteredTasks

        // Cache the filtered result too for future direct access
        cache.value[workspaceId]['assigneds'] = {
          tasks: filteredTasks,
          loadedAt: Date.now()
        }
        isLoading.value = false
        return
      }

      // If we have exact cache for this scope, use it
      if (cache.value[workspaceId][scope]) {
        const cached = cache.value[workspaceId][scope]
        tasks.value = cached.tasks
        isLoading.value = false
        return
      }
    }

    isLoading.value = true
    error.value = null

    try {
      const { $firestore } = useNuxtApp()
      const projectStore = useProjectStore()

      // Get accessible projects
      const accessibleProjectIds = projectStore.projects.map((p) => p.id)

      if (accessibleProjectIds.length === 0) {
        tasks.value = []
        // Cache empty result
        if (!cache.value[workspaceId]) {
          cache.value[workspaceId] = {}
        }
        cache.value[workspaceId][scope] = {
          tasks: [],
          loadedAt: Date.now()
        }
        return
      }

      // NEW: Single query for all workspace tasks
      const tasksRef = collection($firestore, `workspaces/${workspaceId}/tasks`)

      let q
      if (scope === 'assigneds' && userId) {
        // Query only assigned tasks with ordering
        q = query(
          tasksRef,
          where('assigneeIds', 'array-contains', userId),
          orderBy('updatedAt', 'desc')
        )
      } else {
        // Query all tasks with ordering
        q = query(tasksRef, orderBy('updatedAt', 'desc'))
      }

      const snapshot = await getDocs(q)

      // Filter to only accessible projects (client-side)
      const allTasks: Task[] = snapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            projectId: data.projectId,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            assigneeIds: data.assigneeIds ? (Array.from(data.assigneeIds) as string[]) : undefined
          } as Task
        })
        .filter((task) => accessibleProjectIds.includes(task.projectId))

      tasks.value = allTasks

      // Update cache
      if (!cache.value[workspaceId]) {
        cache.value[workspaceId] = {}
      }
      cache.value[workspaceId][scope] = {
        tasks: allTasks,
        loadedAt: Date.now()
      }
    } catch (e: any) {
      error.value = e.message
      tasks.value = []
    } finally {
      isLoading.value = false
    }
  }

  const clearCache = (workspaceId?: string, scope?: 'all' | 'assigneds') => {
    if (!workspaceId) {
      // Clear all cache
      cache.value = {}
    } else if (!scope) {
      // Clear workspace cache
      delete cache.value[workspaceId]
    } else {
      // Clear specific scope cache
      if (cache.value[workspaceId]) {
        delete cache.value[workspaceId][scope]
      }
    }
  }

  return {
    tasks,
    isLoading: readonly(isLoading),
    error: readonly(error),
    loadWorkspaceTasks,
    clearCache
  }
}
