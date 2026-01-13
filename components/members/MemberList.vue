<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
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
import { UserPlus } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { toast } from 'vue-sonner'
import { Skeleton } from '@/components/ui/skeleton'
import MemberItem from './MemberItem.vue'

interface Member {
  uid: string
  email: string
  username: string
  photoURL: string | null
  permissions: Record<string, boolean> | null
  joinedAt: any
}

const props = defineProps<{
  workspace: any
  members: Member[]
  isLoadingMembers: boolean
}>()

const { user } = useAuth()
const isInviting = ref(false)
const isSending = ref(false)
const memberEmail = ref('')

// Get current user's permissions from the members list
const currentUserPermissions = computed(() => {
  if (!user.value) return null
  const currentMember = props.members.find(m => m.uid === user.value?.uid)
  return currentMember?.permissions || null
})

// Check if current user can invite members
const canInviteMembers = computed(() => {
  if (!user.value) return false
  // Check permissions (owner, admin, or specific permission)
  return currentUserPermissions.value?.['owner'] === true ||
    currentUserPermissions.value?.['admin'] === true ||
    currentUserPermissions.value?.['manage-members'] === true ||
    currentUserPermissions.value?.['add-members'] === true
})

const handleInvite = async () => {
  if (!memberEmail.value) {
    toast.error('Please enter an email address', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  if (!props.workspace || !user.value) {
    toast.error('Unable to send invitation', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  try {
    isSending.value = true
    const idToken = await user.value.getIdToken()

    await $fetch('/api/invite/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      body: {
        to: memberEmail.value,
        workspaceId: props.workspace.id
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
  } finally {
    isSending.value = false
  }
}

const emit = defineEmits<{
  inviteMember: [email: string]
  'member-removed': [memberId: string]
  'permissions-updated': []
}>()

const handleMemberRemoved = (memberId: string) => {
  emit('member-removed', memberId)
}

const handlePermissionsUpdated = () => {
  emit('permissions-updated')
}
</script>

<template>
  <div class="flex justify-between items-center mb-6">
    <div>
      <h2 class="text-xl font-semibold">Workspace Members</h2>
      <p class="text-sm text-muted-foreground mt-1">
        {{ members.length || 0 }} {{ members.length === 1 ? 'member' : 'members' }}
      </p>
    </div>
    <Button
      v-if="canInviteMembers"
      @click="isInviting = true"
      class="flex items-center gap-1"
    >
      <UserPlus class="h-5 w-5" />
      <span>Invite Member</span>
    </Button>
  </div>

  <Card>
    <CardContent>
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
        <MemberItem
          v-for="member in members"
          :key="member.uid"
          :member="member"
          :workspace-id="workspace.id"
          :current-user-permissions="currentUserPermissions"
          @member-removed="handleMemberRemoved"
          @permissions-updated="handlePermissionsUpdated"
        />
      </div>
    </CardContent>
  </Card>

  <!-- Invite Member Dialog -->
  <Dialog v-model:open="isInviting">
    <DialogContent :can-close="!isSending" @interact-outside="(e) => { if (isSending) e.preventDefault() }">
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
            :disabled="isSending"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isInviting = false" :disabled="isSending">
          Cancel
        </Button>
        <Button @click="handleInvite" :disabled="isSending">
          {{ isSending ? 'Sending...' : 'Send Invitation' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
