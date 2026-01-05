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

const props = defineProps<{
  workspace: any
  memberNames: Record<string, string>
  isLoadingMembers: boolean
}>()

const { user } = useAuth()
const isInviting = ref(false)
const memberEmail = ref('')

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
  }
}

const emit = defineEmits<{
  inviteMember: [email: string]
}>()
</script>

<template>
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

  <Card>
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
        <MemberItem
          v-for="memberId in workspace.members"
          :key="memberId"
          :member-id="memberId"
          :member-name="memberNames[memberId]"
          :workspace-owner-id="workspace.ownerId"
          :workspace-id="workspace.id"
        />
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
</template>
