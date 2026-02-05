<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useWorkspaceStore } from '@/stores/workspaces'
import { useAuth } from '@/composables/useAuth'
import { useMembers } from '@/composables/useMembers'
import MemberList from '@/components/members/MemberList.vue'

definePageMeta({
  layout: 'workspace'
})

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { user } = useAuth()
const { members, isLoadingMembers, loadWorkspaceMembers, removeMemberLocally } =
  useMembers()

const workspaceId = computed(() => route.params.workspace as string)
const workspace = computed(() =>
  workspaceStore.workspaces.find((ws) => ws.id === workspaceId.value)
)

onMounted(async () => {
  if (!workspaceStore.loaded) {
    await workspaceStore.loadWorkspaces(user.value?.uid)
  }
  await loadWorkspaceMembers(workspaceId.value)
})

const handleMemberRemoved = (memberId: string) => {
  // Remove from cached members
  removeMemberLocally(memberId)

  // Update workspace members in store
  if (workspace.value) {
    const index = workspace.value.members.indexOf(memberId)
    if (index > -1) {
      workspace.value.members.splice(index, 1)
    }
  }
}

const handlePermissionsUpdated = async () => {
  await loadWorkspaceMembers(workspaceId.value, true)
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-primary mb-2">Members</h1>
      <p class="text-muted-foreground">
        Manage workspace members and invitations
      </p>
    </header>

    <MemberList
      v-if="workspace"
      :workspace="workspace"
      :members="members"
      :is-loading-members="isLoadingMembers"
      @member-removed="handleMemberRemoved"
      @permissions-updated="handlePermissionsUpdated"
    />
  </div>
</template>
