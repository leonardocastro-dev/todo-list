<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Mail, Crown, X } from 'lucide-vue-next'
import { useWorkspaceStore } from '@/stores/workspaces'
import { useAuth } from '@/composables/useAuth'
import { toast } from 'vue-sonner'
import { doc, getDoc } from 'firebase/firestore'
import { Skeleton } from '@/components/ui/skeleton'

definePageMeta({
  layout: 'workspace'
})

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { user } = useAuth()

const isInviting = ref(false)
const memberEmail = ref('')
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
        memberNames.value[memberId] = userData.name || userData.email || memberId
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

const handleInvite = async () => {
  if (!memberEmail.value) {
    toast.error('Please enter an email address', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  if (!workspace.value || !user.value) {
    toast.error('Unable to send invitation', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  try {
    const idToken = await user.value.getIdToken()

    await $fetch('/api/invite/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      body: {
        to: memberEmail.value,
        workspaceId: workspace.value.id
      }
    })

    toast.success(`Invitation sent to ${memberEmail.value}`, {
      style: { background: '#6ee7b7' },
      duration: 3000
    })

    memberEmail.value = ''
    isInviting.value = false
  } catch (error: any) {
    console.error('Error sending invitation:', error)
    const errorMessage = error.data?.message || 'Failed to send invitation'
    toast.error(errorMessage, {
      style: { background: '#fda4af' },
      duration: 3000
    })
  }
}

const removeMember = async (memberId: string) => {
  // TODO: Implement remove member logic
  toast.success('Member removed', {
    style: { background: '#fda4af' },
    duration: 3000
  })
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-primary mb-2">Members</h1>
      <p class="text-muted-foreground">Manage workspace members and invitations</p>
    </header>

    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-xl font-semibold">Workspace Members</h2>
        <p class="text-sm text-muted-foreground mt-1">
          {{ workspace?.members.length || 0 }} {{ workspace?.members.length === 1 ? 'member' : 'members' }}
        </p>
      </div>
      <Button @click="isInviting = true" class="flex items-center gap-1">
        <UserPlus class="h-5 w-5" />
        <span>Invite Member</span>
      </Button>
    </div>

    <Card v-if="workspace">
      <CardContent class="pt-6">
        <!-- Loading Skeletons -->
        <div v-if="isLoadingMembers" class="space-y-4">
          <div v-for="i in 3" :key="i" class="flex items-center justify-between p-4 border rounded-lg">
            <div class="flex items-center gap-3">
              <Skeleton class="h-10 w-10 rounded-full" />
              <div class="space-y-2">
                <Skeleton class="h-5 w-32" />
                <Skeleton class="h-4 w-24" />
              </div>
            </div>
            <Skeleton class="h-6 w-16" />
          </div>
        </div>

        <!-- Members List -->
        <div v-else class="space-y-4">
          <div
            v-for="memberId in workspace.members"
            :key="memberId"
            class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail class="h-5 w-5 text-primary" />
              </div>
              <div>
                <p class="font-medium text-foreground">
                  {{ memberNames[memberId] }}
                </p>
                <p class="text-sm text-muted-foreground">Member</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <Badge v-if="workspace.ownerId === memberId" variant="secondary" class="gap-1">
                <Crown class="h-3 w-3" />
                Owner
              </Badge>

              <Button
                v-if="workspace.ownerId !== memberId && workspace.ownerId === user?.uid"
                variant="ghost"
                size="sm"
                @click="removeMember(memberId)"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Invite Member Dialog -->
    <Dialog v-model:open="isInviting">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join this workspace
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="member-email">Email Address</Label>
            <Input
              id="member-email"
              v-model="memberEmail"
              type="email"
              placeholder="colleague@example.com"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isInviting = false">
            Cancel
          </Button>
          <Button @click="handleInvite">
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
