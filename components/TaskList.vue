<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/store'
import TaskItem from './TaskItem.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'

const taskStore = useTaskStore()
const filteredTasks = computed(() => {
  return taskStore.filteredTasks
})
</script>

<template>
  <Alert v-if="filteredTasks.length === 0">
    <AlertDescription>
      No tasks found. Try adjusting your filters or adding a new task.
    </AlertDescription>
  </Alert>

  <div v-else class="space-y-2">
    <TaskItem
      v-for="task in filteredTasks"
      :key="task.id"
      :task="task"
    />
  </div>
</template>
