<script setup lang="ts">
import { computed } from 'vue'
import TaskItem from './TaskItem.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import type { WorkspaceMember } from '@/composables/useMembers'

defineProps<{
  workspaceId?: string
  workspaceMembers?: WorkspaceMember[]
  taskAssignmentsMap?: Record<string, string[]>
}>()

const taskStore = useTaskStore()
const filteredTasks = computed(() => {
  return taskStore.filteredTasks
})
</script>

<template>
  <div v-if="taskStore.isLoading" class="space-y-2">
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
          <div class="flex-1">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <Skeleton class="h-6 w-40" />
                <Skeleton class="h-5 w-20 ml-2" />
              </div>
              <Skeleton class="h-8 w-8 rounded-full" />
            </div>
            <Skeleton class="h-4 w-2/3 mb-2" />
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
  <Alert v-else-if="filteredTasks.length === 0">
    <AlertDescription>
      No tasks found. Try adjusting your filters or adding a new task.
    </AlertDescription>
  </Alert>
  <div v-else class="space-y-2">
    <TaskItem
      v-for="task in filteredTasks"
      :key="task.id"
      :task="task"
      :workspace-id="workspaceId"
      :workspace-members="workspaceMembers"
      :assigned-member-ids="taskAssignmentsMap?.[task.id] || []"
    />
  </div>
</template>
