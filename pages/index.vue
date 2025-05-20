<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Plus, LogIn, LogOut, UserPlus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import TaskStats from '@/components/TaskStats.vue'
import TaskList from '@/components/TaskList.vue'
import TaskFilters from '@/components/TaskFilters.vue'
import TaskForm from '@/components/TaskForm.vue'
import { useAuth } from '@/composables/useAuth'
import { useTaskStore } from '@/store'

const isAddingTask = ref(false)
const { user, logout } = useAuth()
const taskStore = useTaskStore()

onMounted(async () => {
  if (user.value) {
    await taskStore.loadTasks(user.value.uid)
  }
})

watch(() => user.value, async (newUser) => {
  if (newUser) {
    await taskStore.loadTasks(newUser.uid)
  } else {
    taskStore.$reset()
  }
})
</script>

<template>
  <main class="min-h-screen bg-gray-50 p-4 md:p-6">
    <div class="max-w-4xl mx-auto">
      <header class="mb-8 flex justify-between">
        <div>
          <h1 class="text-3xl font-bold text-primary mb-2">Task Manager</h1>
          <p class="text-muted-foreground">Organize your tasks efficiently</p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <div class="flex gap-2" v-if="!user">
            <Button
              variant="default"
              @click="navigateTo('/register')"
              class="flex items-center gap-1 w-fit"
            >
              <UserPlus class="h-4 w-4" />
              <span>Register</span>
            </Button>
            <Button
              variant="outline"
              @click="navigateTo('/login')"
              class="flex items-center gap-1 w-fit"
            >
              <LogIn class="h-4 w-4" />
              <span>Login</span>
            </Button>
          </div>
          <Button
            v-else
            variant="outline"
            @click="logout"
            class="flex items-center gap-1 w-fit"
          >
            <LogOut class="h-4 w-4" />
            <span>Logout</span>
          </Button>
          <span v-if="user" class="text-sm text-muted-foreground">
            {{ user.email }}
          </span>
        </div>
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

      <TaskForm :is-open="isAddingTask" @close="isAddingTask = false" :user-id="user?.uid" />
    </div>
  </main>
</template>
