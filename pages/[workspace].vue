<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useWorkspaceStore } from '@/stores/workspaces'

definePageMeta({
  layout: 'workspace'
})

const route = useRoute()
const { user, loading } = useAuth()
const workspaceStore = useWorkspaceStore()
const workspaceExists = ref(true)

const workspaceSlug = route.params.workspace as string

if (!/^.+-\d+$/.test(workspaceSlug)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Workspace not found'
  })
}

onMounted(async () => {
  if (!loading.value) {
    await workspaceStore.loadWorkspaces(user.value?.uid || null)

    const workspace = workspaceStore.workspaces.find(w => w.id === workspaceSlug)
    if (!workspace) {
      workspaceExists.value = false
      throw createError({
        statusCode: 404,
        statusMessage: 'Workspace not found'
      })
    }
  }
})
</script>

<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>

  <NuxtPage v-else-if="workspaceExists" />
</template>
