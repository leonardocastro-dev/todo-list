<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Plus, ArrowLeft, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import TaskStats from '@/components/tasks/TaskStats.vue'
import TaskList from '@/components/tasks/TaskList.vue'
import TaskFilters from '@/components/tasks/TaskFilters.vue'
import TaskForm from '@/components/tasks/TaskForm.vue'
import { useAuth } from '@/composables/useAuth'
import { useMembers } from '@/composables/useMembers'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const {
  members,
  taskAssignmentsMap,
  loadWorkspaceMembers,
  loadAllTaskAssignments
} = useMembers()

const isAddingTask = ref(false)
const isReloading = ref(false)
const taskStore = useTaskStore()
const projectStore = useProjectStore()

const handleReload = async () => {
  isReloading.value = true
  try {
    await taskStore.reloadTasks(user.value?.uid)
    if (taskStore.tasks.length > 0) {
      const taskIds = taskStore.tasks.map((t) => t.id)
      await loadAllTaskAssignments(workspaceId, projectId, taskIds)
    }
  } finally {
    isReloading.value = false
  }
}

const projectId = route.params.id as string
const workspaceId = route.params.workspace as string

const currentProject = computed(() => {
  return projectStore.projects.find((p) => p.id === projectId)
})

// Load task assignments when tasks change
watch(
  () => taskStore.tasks,
  async (tasks) => {
    if (tasks.length > 0 && workspaceId && projectId) {
      const taskIds = tasks.map((t) => t.id)
      await loadAllTaskAssignments(workspaceId, projectId, taskIds)
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await projectStore.loadProjectsForWorkspace(workspaceId, user.value?.uid)
  await loadWorkspaceMembers(workspaceId)
  taskStore.setCurrentProject(projectId, user.value?.uid, workspaceId)
})
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <header class="mb-8">
      <div class="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          class="flex items-center gap-1"
          @click="router.push(`/${workspaceId}/projects`)"
        >
          <ArrowLeft class="h-4 w-4" />
          <span>Back to Projects</span>
        </Button>
      </div>

      <div
        v-if="projectStore.isLoading"
        class="flex justify-between items-start"
      >
        <div class="flex-1">
          <Skeleton class="h-9 max-w-64 mb-2" />
          <Skeleton class="h-6 max-w-96 mb-3" />
        </div>
      </div>

      <div v-else-if="currentProject">
        <h1 class="text-3xl font-bold text-primary mb-2">
          {{ currentProject.title }}
        </h1>
        <p v-if="currentProject.description" class="text-muted-foreground mb-3">
          {{ currentProject.description }}
        </p>
      </div>

      <div v-else class="text-center py-8">
        <p class="text-muted-foreground">Project not found</p>
        <Button class="mt-4" @click="router.push(`/${workspaceId}/projects`)">
          Go to Projects
        </Button>
      </div>
    </header>

    <div v-if="currentProject || projectStore.isLoading">
      <div class="flex sm:justify-between flex-col sm:flex-row sm:items-center justify-center mb-6">
        <h2 class="text-xl font-semibold">Project Tasks</h2>
        <div class="flex sm:flex-row mt-3 sm:mt-0 flex-row-reverse justify-end gap-2">
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
            v-if="taskStore.canCreateTasks"
            class="flex items-center gap-1"
            :disabled="projectStore.isLoading"
            @click="isAddingTask = true"
          >
            <Plus class="h-5 w-5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      <TaskStats />
      <TaskFilters />
      <TaskList
        :workspace-id="workspaceId"
        :workspace-members="members"
        :task-assignments-map="taskAssignmentsMap"
      />

      <TaskForm
        :is-open="isAddingTask"
        :user-id="user?.uid"
        :workspace-id="workspaceId"
        :project-id="projectId"
        @close="isAddingTask = false"
      />
    </div>
  </div>
</template>
