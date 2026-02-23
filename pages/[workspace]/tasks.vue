<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import TaskItem from '@/components/tasks/TaskItem.vue'
import TaskFilters from '@/components/tasks/TaskFilters.vue'
import TaskForm from '@/components/tasks/TaskForm.vue'
import { useAuth } from '@/composables/useAuth'
import { useWorkspace } from '@/composables/useWorkspace'
import { useMembers } from '@/composables/useMembers'
import { useProjectPermissions } from '@/composables/useProjectPermissions'
import { PERMISSIONS, hasAnyPermission } from '@/constants/permissions'

definePageMeta({ layout: 'workspace' })

const { user } = useAuth()
const { workspaceId } = useWorkspace()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const { members, loadWorkspaceMembers } = useMembers()
const { projectPermissionsMap, loadProjectPermissions } =
  useProjectPermissions()

const isInitialLoading = ref(
  !(workspaceId.value && taskStore.loadedWorkspaces[workspaceId.value])
)
const isReloading = ref(false)
const isAddingTask = ref(false)
const projectLinkFilter = ref<'all' | 'with-project' | 'without-project'>('all')

const filteredWorkspaceTasks = computed(() => taskStore.filteredWorkspaceTasks)
const visibleTasks = computed(() => {
  if (projectLinkFilter.value === 'all') return filteredWorkspaceTasks.value
  return filteredWorkspaceTasks.value.filter((task) => {
    const hasProject = Boolean(
      task.projectId && task.projectId.trim().length > 0
    )
    return projectLinkFilter.value === 'with-project' ? hasProject : !hasProject
  })
})

const setProjectLinkFilter = (newFilter: string | number) => {
  const filterValue = String(newFilter)
  if (
    filterValue !== 'all' &&
    filterValue !== 'with-project' &&
    filterValue !== 'without-project'
  ) {
    return
  }
  projectLinkFilter.value = filterValue
}

const canCreateWorkspaceTasks = computed(() => {
  if (projectStore.isGuestMode) return true
  return hasAnyPermission(projectStore.memberPermissions, [
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.CREATE_TASKS
  ])
})

// Get project name for a task
const getProjectName = (projectId?: string) => {
  if (!projectId) return undefined
  const project = projectStore.projects.find((p) => p.id === projectId)
  return project?.title || 'Unknown Project'
}

// Load data on mount and when scope changes
onMounted(async () => {
  if (workspaceId.value) {
    taskStore.currentProjectId = null
    try {
      const loadPromises: Promise<void>[] = [
        projectStore.loadProjectsForWorkspace(
          workspaceId.value,
          user.value?.uid
        )
      ]
      if (user.value?.uid) {
        loadPromises.push(loadWorkspaceMembers(workspaceId.value))
      }
      await Promise.all(loadPromises)
      taskStore.setScopeFilter('assigneds', user.value?.uid)
      // Load tasks via taskStore (will use cache if available)
      await taskStore.loadWorkspaceTasks(
        workspaceId.value,
        'assigneds',
        user.value?.uid
      )

      // Load permissions for all projects
      const projectIds = projectStore.projects.map((p) => p.id)
      if (user.value?.uid && projectIds.length > 0) {
        await loadProjectPermissions(
          workspaceId.value,
          projectIds,
          user.value.uid
        )
      }
    } finally {
      isInitialLoading.value = false
    }
  } else {
    isInitialLoading.value = false
  }
})

// When scope changes, load all tasks if needed (for 'all' or filtering by another member)
watch(
  [() => taskStore.scopeFilter, () => taskStore.scopeUserId],
  async ([newScope, newUserId]) => {
    if (!workspaceId.value) return
    const needsAllData =
      newScope === 'all' ||
      (newScope === 'assigneds' && newUserId && newUserId !== user.value?.uid)
    if (needsAllData) {
      await taskStore.loadWorkspaceTasks(
        workspaceId.value,
        'all',
        user.value?.uid
      )
    }
  }
)

// Force reload when clicking Sync button
const handleReload = async () => {
  if (!workspaceId.value) return
  isReloading.value = true
  try {
    taskStore.clearWorkspaceCache(workspaceId.value)
    await taskStore.loadWorkspaceTasks(
      workspaceId.value,
      taskStore.scopeFilter as 'all' | 'assigneds',
      user.value?.uid,
      true
    )
  } finally {
    isReloading.value = false
  }
}

const emptyStateMessage = computed(() => {
  if (
    filteredWorkspaceTasks.value.length > 0 &&
    visibleTasks.value.length === 0
  ) {
    return 'No tasks match the selected project filter.'
  }
  if (taskStore.workspaceTasks.length > 0) {
    return 'No tasks found. Try adjusting your filters.'
  }
  if (taskStore.scopeFilter === 'assigneds') {
    return 'No tasks assigned to you yet.'
  }
  return 'No tasks in this workspace yet.'
})
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-primary mb-2">Tasks</h1>
      <p class="text-muted-foreground">
        View and manage tasks across all projects
      </p>
    </header>

    <div class="space-y-4 mb-6">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h2 class="text-xl font-semibold">Workspace Tasks</h2>
          <p class="text-sm text-muted-foreground mt-1">
            {{ visibleTasks.length }}
            {{ visibleTasks.length === 1 ? 'task' : 'tasks' }}
            <span v-if="taskStore.urgentTasks > 0" class="text-red-600 font-medium">
              &middot; {{ taskStore.urgentTasks }} urgent pending
            </span>
          </p>
        </div>

        <div
          class="flex sm:flex-row mt-3 sm:mt-0 flex-row-reverse justify-end gap-2"
        >
          <Button
            variant="ghost"
            size="sm"
            :disabled="taskStore.isLoading || isReloading"
            @click="handleReload"
          >
            <RefreshCw
              class="h-4 w-4 mr-2"
              :class="{ 'animate-spin': isReloading }"
            />
            Sync
          </Button>

          <Button
            v-if="canCreateWorkspaceTasks"
            class="flex items-center gap-1"
            :disabled="projectStore.isLoading"
            @click="isAddingTask = true"
          >
            <Plus class="h-5 w-5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

    </div>

    <TaskFilters
      :project-link-filter="projectLinkFilter"
      @update:project-link-filter="setProjectLinkFilter"
    />

    <!-- Loading State -->
    <div v-if="isInitialLoading || taskStore.isLoading" class="space-y-2">
      <Card
        v-for="i in 6"
        :key="`skeleton-${i}`"
        class="mb-3 hover:shadow-md transition-shadow"
      >
        <CardContent class="px-4">
          <div class="flex items-start gap-3">
            <div class="pt-0.5">
              <Skeleton class="h-5 w-5 rounded-full" />
            </div>
            <div class="w-full">
              <div class="flex items-center justify-between gap-2 mb-2">
                <div class="flex items-center w-full gap-2">
                  <Skeleton class="h-6 w-full max-w-40" />
                  <Skeleton class="h-5 min-w-16" />
                </div>
                <Skeleton class="min-h-8 min-w-8 rounded-full" />
              </div>
              <div class="flex items-center gap-2">
                <Skeleton class="h-4 w-16" />
                <Skeleton class="h-4 w-4 rounded-full" />
                <Skeleton class="h-4 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <Alert v-else-if="visibleTasks.length === 0">
      <AlertDescription>{{ emptyStateMessage }}</AlertDescription>
    </Alert>

    <!-- Task List -->
    <div v-else class="space-y-2">
      <TaskItem
        v-for="task in visibleTasks"
        :key="task.id"
        :task="task"
        :workspace-id="workspaceId || undefined"
        :workspace-members="members"
        :project-name="getProjectName(task.projectId)"
        :project-permissions="
          task.projectId ? projectPermissionsMap[task.projectId] : undefined
        "
        :workspace-permissions="projectStore.memberPermissions"
      />
    </div>

    <TaskForm
      :is-open="isAddingTask"
      :user-id="user?.uid"
      :workspace-id="workspaceId || undefined"
      @close="isAddingTask = false"
    />
  </div>
</template>
