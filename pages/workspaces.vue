<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useWorkspaceStore } from '@/stores/workspaces'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import WorkspaceForm from '@/components/workspaces/WorkspaceForm.vue'
import WorkspaceItem from '@/components/workspaces/WorkspaceItem.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

const { user, loading } = useAuth()
const workspaceStore = useWorkspaceStore()
const isCreatingWorkspace = ref(false)

watch(
  () => user.value,
  async (newUser) => {
    if (newUser?.uid && !loading.value) {
      await workspaceStore.loadWorkspaces(newUser.uid)
    }
  },
  { immediate: true }
)

onMounted(async () => {
  if (user.value?.uid && !loading.value) {
    await workspaceStore.loadWorkspaces(user.value.uid)
  }
})
</script>

<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>

  <div v-else class="min-h-screen p-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground">Workspaces</h1>
      <p class="text-muted-foreground mt-2">Manage your workspaces and organize your projects</p>
    </div>

    <div v-if="workspaceStore.isLoading" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
      <Skeleton class="h-[250px] rounded-lg" />
      <Skeleton class="h-[250px] rounded-lg" />
      <Skeleton class="h-[250px] rounded-lg" />
    </div>

    <div v-else-if="workspaceStore.userWorkspaces.length === 0" class="text-center py-12">
      <div class="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-foreground mb-2">No workspaces yet</h3>
      <p class="text-muted-foreground mb-6">Create your first workspace to get started organizing your projects</p>
      <Button @click="isCreatingWorkspace = true">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Create Workspace
      </Button>
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
      <div
        class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer"
        @click="isCreatingWorkspace = true"
      >
        <div class="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
          <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-foreground mb-2">Create Workspace</h3>
          <p class="text-sm text-muted-foreground">Start a new workspace to organize your projects</p>
        </div>
      </div>

      <WorkspaceItem
        v-for="workspace in workspaceStore.userWorkspaces"
        :key="workspace.id"
        :workspace="workspace"
      />
    </div>

    <WorkspaceForm
      :is-open="isCreatingWorkspace"
      @close="isCreatingWorkspace = false"
    />
  </div>
</template>
