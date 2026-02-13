<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import TaskItem from '@/components/tasks/TaskItem.vue'
import TaskFilters from '@/components/tasks/TaskFilters.vue'
import { useAuth } from '@/composables/useAuth'
import { useWorkspace } from '@/composables/useWorkspace'
import { useMembers } from '@/composables/useMembers'
import { useProjectPermissions } from '@/composables/useProjectPermissions'

definePageMeta({ layout: 'workspace' })

const route = useRoute()
const router = useRouter()
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

const scope = computed<'all' | 'assigneds'>(() =>
  route.query.scope === 'all' ? 'all' : 'assigneds'
)
const isAllScope = computed(() => scope.value === 'all')
const filteredWorkspaceTasks = computed(() => taskStore.filteredWorkspaceTasks)

const setScope = (newScope: string | number) => {
  const scopeValue = String(newScope)
  if (scopeValue !== 'assigneds' && scopeValue !== 'all') return
  if (scopeValue === scope.value) return
  router.push({ query: { ...route.query, scope: scopeValue } })
}

const setScopeFromToggle = (checked: boolean) => {
  setScope(checked ? 'all' : 'assigneds')
}

// Get project name for a task
const getProjectName = (projectId: string) => {
  const project = projectStore.projects.find((p) => p.id === projectId)
  return project?.title || 'Unknown Project'
}

// Load data on mount and when scope changes
onMounted(async () => {
  if (workspaceId.value) {
    try {
      await Promise.all([
        projectStore.loadProjectsForWorkspace(
          workspaceId.value,
          user.value?.uid
        ),
        loadWorkspaceMembers(workspaceId.value)
      ])
      // Load tasks via taskStore (will use cache if available)
      await taskStore.loadWorkspaceTasks(
        workspaceId.value,
        scope.value as 'all' | 'assigneds',
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

// When scope changes, update taskStore
watch(scope, async () => {
  if (workspaceId.value) {
    await taskStore.loadWorkspaceTasks(
      workspaceId.value,
      scope.value as 'all' | 'assigneds',
      user.value?.uid
    )
  }
})

// Force reload when clicking Sync button
const handleReload = async () => {
  if (!workspaceId.value) return
  isReloading.value = true
  try {
    taskStore.clearWorkspaceCache(workspaceId.value)
    await taskStore.loadWorkspaceTasks(
      workspaceId.value,
      scope.value as 'all' | 'assigneds',
      user.value?.uid,
      true
    )
  } finally {
    isReloading.value = false
  }
}

const emptyStateMessage = computed(() => {
  if (taskStore.workspaceTasks.length > 0) {
    return 'No tasks found. Try adjusting your filters.'
  }
  if (scope.value === 'assigneds') {
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

    <div
      class="flex sm:justify-between flex-col sm:flex-row sm:items-center justify-center mb-6"
    >
      <div>
        <h2 class="text-xl font-semibold">Workspace Tasks</h2>
        <p class="text-sm text-muted-foreground mt-1">
          {{ filteredWorkspaceTasks.length }}
          {{ filteredWorkspaceTasks.length === 1 ? 'task' : 'tasks' }}
          <span
            v-if="
              filteredWorkspaceTasks.length !== taskStore.workspaceTasks.length
            "
          >
            of {{ taskStore.workspaceTasks.length }}
          </span>
        </p>
      </div>
      <div class="flex sm:flex-row mt-3 sm:mt-0 items-center gap-3">
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

        <div
          class="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5"
        >
          <span
            class="text-xs font-medium uppercase tracking-wide transition-colors"
            :class="isAllScope ? 'text-muted-foreground' : 'text-foreground'"
          >
            Assigned
          </span>
          <Switch
            aria-label="Toggle task scope"
            :model-value="isAllScope"
            @update:model-value="setScopeFromToggle"
          />
          <span
            class="text-xs font-medium uppercase tracking-wide transition-colors"
            :class="isAllScope ? 'text-foreground' : 'text-muted-foreground'"
          >
            All
          </span>
        </div>
      </div>
    </div>

    <TaskFilters />

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
    <Alert v-else-if="filteredWorkspaceTasks.length === 0">
      <AlertDescription>{{ emptyStateMessage }}</AlertDescription>
    </Alert>

    <!-- Task List -->
    <div v-else class="space-y-2">
      <TaskItem
        v-for="task in filteredWorkspaceTasks"
        :key="task.id"
        :task="task"
        :workspace-id="workspaceId || undefined"
        :workspace-members="members"
        :project-name="getProjectName(task.projectId)"
        :project-permissions="projectPermissionsMap[task.projectId]"
      />
    </div>
  </div>
</template>
