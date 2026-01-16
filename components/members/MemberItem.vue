<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Mail,
  Crown,
  Shield,
  Lock,
  Trash2
} from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { toast } from 'vue-sonner'
import MemberPermissionsModal from './MemberPermissionsModal.vue'

interface Member {
  uid: string
  email: string
  username: string
  photoURL: string | null
  permissions: Record<string, boolean> | null
  joinedAt: any
}

const props = defineProps<{
  member: Member
  workspaceId: string
  currentUserPermissions: Record<string, boolean> | null
}>()

const emit = defineEmits<{
  'member-removed': [memberId: string]
  'permissions-updated': []
}>()

const { user } = useAuth()
const isRemoving = ref(false)
const isPermissionsOpen = ref(false)

const isOwner = computed(() => props.member.permissions?.['owner'] === true)
const isAdmin = computed(() => props.member.permissions?.['admin'] === true)
const isCurrentUserOwner = computed(
  () => props.currentUserPermissions?.['owner'] === true
)
const isCurrentUserAdmin = computed(
  () => props.currentUserPermissions?.['admin'] === true
)
const isCurrentUser = computed(() => props.member.uid === user.value?.uid)

const canManagePermissions = computed(() => {
  if (isOwner.value) return false
  if (isCurrentUser.value) return false
  return isCurrentUserOwner.value || isCurrentUserAdmin.value
})

const canRemoveMember = computed(() => {
  if (isOwner.value) return false
  if (isCurrentUser.value) return false
  if (isCurrentUserOwner.value) return true
  return (
    isCurrentUserAdmin.value ||
    props.currentUserPermissions?.['manage-members'] === true ||
    props.currentUserPermissions?.['remove-members'] === true
  )
})

const showDropdown = computed(
  () => canManagePermissions.value || canRemoveMember.value
)

const getAuthToken = async (): Promise<string | null> => {
  if (!user.value) return null
  return await user.value.getIdToken()
}

const removeMember = async () => {
  if (isRemoving.value) return

  try {
    isRemoving.value = true

    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await $fetch<{ success: boolean }>(
      `/api/members/${props.member.uid}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        body: { workspaceId: props.workspaceId }
      }
    )

    if (response.success) {
      emit('member-removed', props.member.uid)
      toast.success('Member removed successfully', {
        style: { background: '#6ee7b7' },
        duration: 3000
      })
    }
  } catch (error: any) {
    console.error('Error removing member:', error)
    toast.error(error.data?.message || 'Failed to remove member', {
      style: { background: '#fda4af' },
      duration: 3000
    })
  } finally {
    isRemoving.value = false
  }
}

const handlePermissionsUpdated = () => {
  emit('permissions-updated')
}
</script>

<template>
  <div
    class="flex items-center justify-between p-4 border rounded-lg transition-colors"
  >
    <div class="flex items-center gap-3">
      <div
        class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden"
      >
        <img
          v-if="member.photoURL"
          :src="member.photoURL"
          :alt="member.username"
          class="h-full w-full object-cover"
        />
        <Mail v-else class="h-5 w-5 text-primary" />
      </div>
      <div>
        <p class="font-medium text-foreground">
          {{ member.username || member.email }}
        </p>
        <p class="text-sm text-muted-foreground">{{ member.email }}</p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Badge v-if="isOwner" variant="secondary" class="gap-1">
        <Crown class="h-3 w-3" />
        Owner
      </Badge>
      <Badge v-else-if="isAdmin" variant="outline" class="gap-1">
        <Shield class="h-3 w-3" />
        Admin
      </Badge>

      <DropdownMenu v-if="showDropdown">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
            <span class="sr-only">Open menu</span>
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            v-if="canManagePermissions"
            @click="isPermissionsOpen = true"
          >
            <Shield class="h-4 w-4" />
            Permissions
          </DropdownMenuItem>
          <DropdownMenuItem
            v-else
            disabled
            class="flex items-center gap-2 opacity-50 cursor-not-allowed"
          >
            <Lock class="h-4 w-4" />
            Permissions
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            v-if="canRemoveMember"
            class="flex items-center gap-2 text-destructive focus:text-destructive"
            @click="removeMember"
          >
            <Trash2 class="h-4 w-4 text-destructive/50" />
            Remove Member
          </DropdownMenuItem>
          <DropdownMenuItem
            v-else
            disabled
            class="flex items-center gap-2 opacity-50 cursor-not-allowed text-destructive/50"
          >
            <Lock class="h-4 w-4 text-destructive/50" />
            Remove Member
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>

  <MemberPermissionsModal
    v-model:open="isPermissionsOpen"
    :member="member"
    :workspace-id="workspaceId"
    @permissions-updated="handlePermissionsUpdated"
  />
</template>
