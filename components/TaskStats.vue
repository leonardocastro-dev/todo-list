<script setup lang="ts">
import { useTaskStore } from '@/store'
import { Card, CardContent } from '@/components/ui/card'

const taskStore = useTaskStore()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <Card>
      <CardContent class="p-4 flex flex-col items-center">
        <p class="text-sm text-muted-foreground mb-1">Total Tasks</p>
        <p class="text-2xl font-bold">{{ taskStore.totalTasks }}</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-4 flex flex-col items-center">
        <p class="text-sm text-muted-foreground mb-1">Pending</p>
        <p class="text-2xl font-bold">{{ taskStore.pendingTasks }}</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-4 flex flex-col items-center">
        <p class="text-sm text-muted-foreground mb-1">Completed</p>
        <p class="text-2xl font-bold">{{ taskStore.completedTasks }}</p>
      </CardContent>
    </Card>

    <Card :class="taskStore.urgentTasks > 0 ? 'border-red-300 bg-red-50' : ''">
      <CardContent class="p-4 flex flex-col items-center">
        <p class="text-sm text-muted-foreground mb-1">Urgent Pending</p>
        <p
          :class="`text-2xl font-bold ${taskStore.urgentTasks > 0 ? 'text-red-700' : ''}`"
        >
          {{ taskStore.urgentTasks }}
        </p>
      </CardContent>
    </Card>
  </div>
</template>
