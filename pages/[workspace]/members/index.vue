<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWorkspaceStore } from '@/stores/workspaces'
import { useAuth } from '@/composables/useAuth'
import { doc, getDoc } from 'firebase/firestore'
import MemberList from '@/components/members/MemberList.vue'

definePageMeta({
  layout: 'workspace'
})

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { user } = useAuth()

const memberNames = ref<Record<string, string>>({})
const isLoadingMembers = ref(false)
const workspaceId = computed(() => route.params.workspace as string)
const workspace = computed(() =>
  workspaceStore.workspaces.find(ws => ws.id === workspaceId.value)
)

const loadMemberNames = async () => {
  if (!workspace.value?.members) return

  isLoadingMembers.value = true
  const { $firestore } = useNuxtApp()

  for (const memberId of workspace.value.members) {
    try {
      const userRef = doc($firestore, 'users', memberId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        memberNames.value[memberId] = userData.username
      } else {
        memberNames.value[memberId] = memberId
      }
    } catch (error) {
      console.error(`Error loading user ${memberId}:`, error)
      memberNames.value[memberId] = memberId
    }
  }

  isLoadingMembers.value = false
}

onMounted(async () => {
  if (!workspaceStore.loaded) {
    await workspaceStore.loadWorkspaces(user.value?.uid)
  }
  await loadMemberNames()
})
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
      :member-names="memberNames"
      :is-loading-members="isLoadingMembers"
    />
  </div>
</template>
