<script setup lang="ts">
import ProjectItem from './ProjectItem.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { useMembers } from '@/composables/useMembers'
import { useWorkspace } from '@/composables/useWorkspace'

const emit = defineEmits<{
  edit: [project: Project]
}>()

const projectStore = useProjectStore()
const { workspaceId } = useWorkspace()
const { members, loadWorkspaceMembers } = useMembers()

onMounted(async () => {
  if (workspaceId.value) {
    await loadWorkspaceMembers(workspaceId.value)
  }
})

watch(workspaceId, async (newId) => {
  if (newId) {
    await loadWorkspaceMembers(newId)
  }
})
</script>

<template>
  <div>
    <div
      v-if="projectStore.isLoading"
      class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4"
    >
      <Skeleton class="aspect-[1.55] w-full rounded-xl" />
      <Skeleton class="aspect-[1.55] w-full rounded-xl" />
      <Skeleton class="aspect-[1.55] w-full rounded-xl" />
      <Skeleton class="aspect-[1.55] w-full rounded-xl" />
      <Skeleton class="aspect-[1.55] w-full rounded-xl" />
      <Skeleton class="aspect-[1.55] w-full rounded-xl" />
    </div>

    <div
      v-else-if="projectStore.projects.length === 0"
      class="text-center py-12"
    >
      <p class="text-muted-foreground text-lg">No projects yet</p>
      <p class="text-sm text-muted-foreground mt-2">
        Create your first project to get started
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4"
    >
      <ProjectItem
        v-for="project in projectStore.sortedProjects"
        :key="project.id"
        :project="project"
        :workspace-members="members"
        @edit="emit('edit', $event)"
      />
    </div>
  </div>
</template>
