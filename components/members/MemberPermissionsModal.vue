<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
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

interface Project {
  id: string
  title: string
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
const projects = ref<Project[]>([])
const isLoadingProjects = ref(false)
const isSaving = ref(false)

const permissionsState = ref<Record<string, boolean>>({})

const getAuthToken = async (): Promise<string | null> => {
  if (!user.value) return null
  return await user.value.getIdToken()
}

watch(open, async (isOpen) => {
  if (isOpen) {
    await loadProjects()
    initializePermissions()
  }
})

const loadProjects = async () => {
  isLoadingProjects.value = true
  const { $firestore } = useNuxtApp()

  try {
    const projectsRef = collection(
      $firestore,
      'workspaces',
      props.workspaceId,
      'projects'
    )
    const snapshot = await getDocs(projectsRef)

    projects.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title
    }))
  } catch (error) {
    console.error('Error loading projects:', error)
  } finally {
    isLoadingProjects.value = false
  }
}

const initializePermissions = () => {
  const memberPermissions = props.member.permissions || {}

  const state: Record<string, boolean> = {}

  // Initialize all nested items from saved permissions
  const initFromItems = (items: NestedItem[]) => {
    for (const item of items) {
      // Check if this item or any parent is in permissions
      state[item.id] = memberPermissions[item.id] || false

      // If parent permission exists, expand to children
      if (memberPermissions[item.id] && item.children) {
        for (const child of item.children) {
          state[child.id] = true
        }
      }

      if (item.children) {
        initFromItems(item.children)
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
      id: 'all-projects',
      name: 'View projects',
      children: projects.value.map((project) => ({
        id: project.id,
        name: project.title
      }))
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
        <div class="space-y-2">
          <div v-if="isLoadingProjects" class="space-y-2 px-6">
            <div class="flex items-center space-x-2">
              <Skeleton class="h-4 w-4" />
              <Skeleton class="h-4 w-32" />
            </div>
            <div class="pl-6 space-y-2">
              <div v-for="i in 3" :key="i" class="flex items-center space-x-2">
                <Skeleton class="h-4 w-4" />
                <Skeleton class="h-4 w-28" />
              </div>
            </div>
          </div>

          <div
            v-else-if="projects.length === 0"
            class="text-sm text-muted-foreground text-center py-4"
          >
            No projects in this workspace
          </div>

          <NestedCheckboxes
            v-else
            v-model="permissionsState"
            class="px-6"
            :items="nestedItems"
            :disabled="isSaving"
          />
        </div>
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
