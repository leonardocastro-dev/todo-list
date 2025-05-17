<script setup lang="ts">
  import { Toaster } from '@/components/ui/sonner'
  import { ref } from 'vue'
  import { Plus } from 'lucide-vue-next'
  import { Button } from '@/components/ui/button'
  import TaskStats from '@/components/TaskStats.vue'
  import TaskList from '@/components/TaskList.vue'
  import TaskFilters from '@/components/TaskFilters.vue'

  const isAddingTask = ref(false)
</script>

<template>
  <ClientOnly>
    <Toaster />
  </ClientOnly>

  <main class="min-h-screen bg-gray-50 p-4 md:p-6">
    <div class="max-w-4xl mx-auto">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-primary mb-2">Task Manager</h1>
        <p class="text-muted-foreground">Organize your tasks efficiently</p>
      </header>

      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold">Your Tasks</h2>
        <Button @click="isAddingTask = true" class="flex items-center gap-1">
          <Plus class="h-5 w-5" />
          <span>Add Task</span>
        </Button>
      </div>

      <TaskStats />
      <TaskFilters />
      <TaskList />

      <TaskForm :is-open="isAddingTask" @close="isAddingTask = false" />
    </div>
  </main>
</template>
