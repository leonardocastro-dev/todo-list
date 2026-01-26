<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  NestedCheckboxes,
  type NestedItem
} from '@/components/ui/nested-checkboxes'
import { toast } from 'vue-sonner'
import { useAuth } from '@/composables/useAuth'

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
}>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  'permissions-updated': []
}>()

const { user } = useAuth()
const isSaving = ref(false)

const permissionsState = ref<Record<string, boolean>>({})

const getAuthToken = async (): Promise<string | null> => {
  if (!user.value) return null
  return await user.value.getIdToken()
}

watch(open, async (isOpen) => {
  if (isOpen) {
    initializePermissions()
  }
})

// Watch for changes in permissions to handle admin logic
watch(
  permissionsState,
  (newState, oldState) => {
    // Avoid infinite loops
    if (!oldState || Object.keys(oldState).length === 0) return

    // Get all non-admin permission IDs
    const getAllNonAdminIds = (): string[] => {
      const ids: string[] = []
      const collectIds = (items: NestedItem[]) => {
        for (const item of items) {
          if (item.id !== 'admin') {
            ids.push(item.id)
            if (item.children) {
              collectIds(item.children)
            }
          }
        }
      }
      collectIds(nestedItems.value)
      return ids
    }

    const allNonAdminIds = getAllNonAdminIds()

    // If admin was just checked, check all other permissions
    if (newState['admin'] && !oldState['admin']) {
      const updatedState = { ...newState }
      for (const id of allNonAdminIds) {
        updatedState[id] = true
      }
      permissionsState.value = updatedState
      return
    }

    // If admin was just unchecked, uncheck all other permissions
    if (!newState['admin'] && oldState['admin']) {
      const updatedState = { ...newState }
      for (const id of allNonAdminIds) {
        updatedState[id] = false
      }
      permissionsState.value = updatedState
      return
    }

    // If admin is checked and any other permission is unchecked, uncheck admin
    if (newState['admin']) {
      for (const id of allNonAdminIds) {
        if (!newState[id] && oldState[id]) {
          permissionsState.value = { ...newState, admin: false }
          return
        }
      }
    }
  },
  { deep: true }
)

const initializePermissions = () => {
  const memberPermissions = props.member.permissions || {}

  const state: Record<string, boolean> = {}

  // Check if admin permission exists
  const hasAdminPermission = memberPermissions['admin'] === true

  // Initialize all nested items from saved permissions
  const initFromItems = (items: NestedItem[], parentIsChecked = false) => {
    for (const item of items) {
      // If admin is checked, all items should be checked
      // Otherwise, item is checked if: saved in DB, OR parent is checked (inherited)
      const isChecked = hasAdminPermission || memberPermissions[item.id] === true || parentIsChecked
      state[item.id] = isChecked

      if (item.children) {
        initFromItems(item.children, isChecked)
      }
    }
  }

  initFromItems(nestedItems.value)
  permissionsState.value = state
}

const nestedItems = computed<NestedItem[]>(() => {
  return [
    {
      id: 'admin',
      name: 'Admin'
    },
    {
      id: 'access-projects',
      name: 'Access projects'
    },
    {
      id: 'manage-projects',
      name: 'Manage projects',
      children: [
        {
          id: 'create-projects',
          name: 'Create projects'
        },
        {
          id: 'delete-projects',
          name: 'Delete projects'
        },
        {
          id: 'edit-projects',
          name: 'Edit projects'
        }
      ]
    },
    {
      id: 'manage-members',
      name: 'Manage members',
      children: [
        {
          id: 'add-members',
          name: 'Add members'
        },
        {
          id: 'remove-members',
          name: 'Remove members'
        },
        {
          id: 'assign-project',
          name: 'Assign to project'
        }
      ]
    }
  ]
})

// Helper to get all child IDs from a nested item
const getAllChildIds = (item: NestedItem): string[] => {
  if (!item.children) return []
  const ids: string[] = []
  for (const child of item.children) {
    ids.push(child.id)
    ids.push(...getAllChildIds(child))
  }
  return ids
}

// Computed: get selected permissions as array with optimization
const selectedPermissions = computed(() => {
  // If admin is selected, only save admin
  if (permissionsState.value['admin']) {
    return ['admin']
  }

  const selectedIds = Object.entries(permissionsState.value)
    .filter(([_, isChecked]) => isChecked)
    .map(([id]) => id)

  let optimizedIds = [...selectedIds]

  // For each parent item in nestedItems, check if all children are selected
  const checkAndOptimizeParent = (item: NestedItem) => {
    if (!item.children || item.children.length === 0) return

    const childIds = getAllChildIds(item)
    const allChildrenSelected =
      childIds.length > 0 && childIds.every((id) => optimizedIds.includes(id))

    if (allChildrenSelected && !optimizedIds.includes(item.id)) {
      // Remove all child IDs and add parent ID
      optimizedIds = optimizedIds
        .filter((id) => !childIds.includes(id))
        .concat(item.id)
    }

    // If parent is selected, remove individual child IDs
    if (optimizedIds.includes(item.id)) {
      optimizedIds = optimizedIds.filter((id) => !childIds.includes(id))
    }

    // Recursively check children
    if (item.children) {
      for (const child of item.children) {
        checkAndOptimizeParent(child)
      }
    }
  }

  // Apply optimization for all items
  for (const item of nestedItems.value) {
    checkAndOptimizeParent(item)
  }

  return optimizedIds
})

const savePermissions = async () => {
  isSaving.value = true

  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    // Build permissions object from optimized selected permissions
    const permissionsData: Record<string, boolean> = {}
    for (const id of selectedPermissions.value) {
      permissionsData[id] = true
    }

    const response = await $fetch<{ success: boolean }>(
      `/api/members/${props.member.uid}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          workspaceId: props.workspaceId,
          permissions: permissionsData
        }
      }
    )

    if (response.success) {
      toast.success('Permissions updated successfully', {
        style: { background: '#6ee7b7' },
        duration: 3000
      })
      emit('permissions-updated')
      open.value = false
    }
  } catch (error: any) {
    console.error('Error saving permissions:', error)
    toast.error(error.data?.message || 'Failed to update permissions', {
      style: { background: '#fda4af' },
      duration: 3000
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="p-0 w-[380px]"
      :can-close="!isSaving"
      @interact-outside="
        (e) => {
          if (isSaving) e.preventDefault()
        }
      "
    >
      <DialogHeader class="pt-6 px-6">
        <DialogTitle>Permissions</DialogTitle>
        <DialogDescription>
          {{ member.username || member.email }}
        </DialogDescription>
      </DialogHeader>

      <hr />

      <div class="space-y-4">
        <NestedCheckboxes
          v-model="permissionsState"
          class="px-6"
          :items="nestedItems"
          :disabled="isSaving"
        />
      </div>

      <hr />

      <DialogFooter class="pb-6 px-6">
        <Button variant="outline" :disabled="isSaving" @click="open = false">
          Cancel
        </Button>
        <Button :disabled="isSaving" @click="savePermissions">
          {{ isSaving ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
