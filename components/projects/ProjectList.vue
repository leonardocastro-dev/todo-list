<script setup lang="ts">
import ProjectItem from './ProjectItem.vue'
import { Skeleton } from '@/components/ui/skeleton'

const emit = defineEmits<{
  edit: [project: Project]
}>()

const projectStore = useProjectStore()

// REMOVIDO: onMounted (página já carrega os projetos)
// REMOVIDO: useAuth import
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
        @edit="emit('edit', $event)"
      />
    </div>
  </div>
</template>
