<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWorkspaceStore } from '@/stores/workspaces'
import { useAuth } from '@/composables/useAuth'
import { collection, getDocs } from 'firebase/firestore'
import MemberList from '@/components/members/MemberList.vue'

interface Member {
  uid: string
  email: string
  username: string
  photoURL: string | null
  permissions: Record<string, boolean> | null
  joinedAt: any
}

definePageMeta({
  layout: 'workspace'
})

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { user } = useAuth()

const members = ref<Member[]>([])
const isLoadingMembers = ref(false)
const workspaceId = computed(() => route.params.workspace as string)
const workspace = computed(() =>
  workspaceStore.workspaces.find(ws => ws.id === workspaceId.value)
)

const loadMembers = async () => {
  if (!workspace.value) return

  isLoadingMembers.value = true
  const { $firestore } = useNuxtApp()

  try {
    const membersRef = collection($firestore, 'workspaces', workspaceId.value, 'members')
    const snapshot = await getDocs(membersRef)

    members.value = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as Member[]
  } catch (error) {
    console.error('Error loading members:', error)
  } finally {
    isLoadingMembers.value = false
  }
}

onMounted(async () => {
  if (!workspaceStore.loaded) {
    await workspaceStore.loadWorkspaces(user.value?.uid)
  }
  await loadMembers()
})

const handleMemberRemoved = (memberId: string) => {
  // Remove from local members
  members.value = members.value.filter(m => m.uid !== memberId)

  // Update workspace members in store
  if (workspace.value) {
    const index = workspace.value.members.indexOf(memberId)
    if (index > -1) {
      workspace.value.members.splice(index, 1)
    }
  }
}

const handlePermissionsUpdated = async () => {
  await loadMembers()
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-primary mb-2">Members</h1>
      <p class="text-muted-foreground">Manage workspace members and invitations</p>
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
