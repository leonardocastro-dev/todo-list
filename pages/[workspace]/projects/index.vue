<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import ProjectList from '@/components/projects/ProjectList.vue'
import ProjectForm from '@/components/projects/ProjectForm.vue'
import { useAuth } from '@/composables/useAuth'
import { useWorkspace } from '@/composables/useWorkspace'

const { user } = useAuth()
const { workspaceId } = useWorkspace()
const projectStore = useProjectStore()

const isAddingProject = ref(false)
const editingProject = ref<Project | undefined>()

const handleEdit = (project: Project) => {
  editingProject.value = project
}

const closeForm = () => {
  isAddingProject.value = false
  editingProject.value = undefined
}

onMounted(async () => {
  if (workspaceId.value) {
    await projectStore.loadProjectsForWorkspace(workspaceId.value, user.value?.uid)
  }
})
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
          {{ projectStore.totalProjects }}
          {{ projectStore.totalProjects === 1 ? 'project' : 'projects' }}
        </p>
      </div>
      <Button
        v-if="projectStore.canCreateProjects"
        class="flex items-center gap-1"
        @click="isAddingProject = true"
      >
        <Plus class="h-5 w-5" />
        <span>New Project</span>
      </Button>
    </div>

    <ProjectList @edit="handleEdit" />

    <ProjectForm
      :is-open="isAddingProject || !!editingProject"
      :edit-project="editingProject"
      :workspace-id="workspaceId || undefined"
      :user-id="user?.uid"
      @close="closeForm"
    />
  </div>
</template>
