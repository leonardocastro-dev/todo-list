<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import ProjectList from '@/components/projects/ProjectList.vue'
import ProjectForm from '@/components/projects/ProjectForm.vue'
import { useAuth } from '@/composables/useAuth'

const isAddingProject = ref(false)
const { user } = useAuth()
const projectStore = useProjectStore()
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-primary mb-2">Projects</h1>
      <p class="text-muted-foreground">Manage your projects and tasks</p>
    </header>

    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-xl font-semibold">Your Projects</h2>
        <p class="text-sm text-muted-foreground mt-1">
          {{ projectStore.totalProjects }} {{ projectStore.totalProjects === 1 ? 'project' : 'projects' }}
        </p>
      </div>
      <Button @click="isAddingProject = true" class="flex items-center gap-1">
        <Plus class="h-5 w-5" />
        <span>New Project</span>
      </Button>
    </div>

    <ProjectList />

    <ProjectForm
      :is-open="isAddingProject"
      @close="isAddingProject = false"
      :user-id="user?.uid"
    />
  </div>
</template>
