<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import TaskStats from '@/components/tasks/TaskStats.vue'
import TaskList from '@/components/tasks/TaskList.vue'
import TaskFilters from '@/components/tasks/TaskFilters.vue'
import TaskForm from '@/components/tasks/TaskForm.vue'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const isAddingTask = ref(false)
const taskStore = useTaskStore()
const projectStore = useProjectStore()

const projectId = route.params.id as string
const workspaceId = route.params.workspace as string

const currentProject = computed(() => {
  return projectStore.projects.find(p => p.id === projectId)
})

onMounted(async () => {
  await projectStore.loadProjectsForWorkspace(workspaceId, user.value?.uid)
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
          @click="router.push(`/${workspaceId}/projects`)"
          class="flex items-center gap-1"
        >
          <ArrowLeft class="h-4 w-4" />
          <span>Back to Projects</span>
        </Button>
      </div>

      <div v-if="projectStore.isLoading" class="flex justify-between items-start">
        <div class="flex-1">
          <Skeleton class="h-9 w-64 mb-2" />
          <Skeleton class="h-6 w-96 mb-3" />
          <div class="flex flex-wrap gap-2">
            <Skeleton class="h-5 w-20" />
            <Skeleton class="h-5 w-24" />
            <Skeleton class="h-5 w-16" />
          </div>
        </div>
      </div>

      <div v-else-if="currentProject" class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-primary mb-2">
            {{ currentProject.title }}
          </h1>
          <p v-if="currentProject.description" class="text-muted-foreground mb-3">
            {{ currentProject.description }}
          </p>
          <div v-if="currentProject.tags && currentProject.tags.length > 0" class="flex flex-wrap gap-2">
            <Badge
              v-for="tag in currentProject.tags"
              :key="tag"
              variant="secondary"
            >
              {{ tag }}
            </Badge>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <p class="text-muted-foreground">Project not found</p>
        <Button @click="router.push(`/${workspaceId}/projects`)" class="mt-4">
          Go to Projects
        </Button>
      </div>
    </header>

    <div v-if="currentProject || projectStore.isLoading">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold">Project Tasks</h2>
        <Button @click="isAddingTask = true" class="flex items-center gap-1" :disabled="projectStore.isLoading">
          <Plus class="h-5 w-5" />
          <span>Add Task</span>
        </Button>
      </div>

      <TaskStats />
      <TaskFilters />
      <TaskList />

      <TaskForm
        :is-open="isAddingTask"
        @close="isAddingTask = false"
        :user-id="user?.uid"
        :workspace-id="workspaceId"
      />
    </div>
  </div>
</template>
