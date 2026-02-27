<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  NestedCheckboxes,
  type NestedItem
} from '@/components/ui/nested-checkboxes'
import { toast } from 'vue-sonner'
import { useAuth } from '@/composables/useAuth'
import { useMembers } from '@/composables/useMembers'

const props = defineProps<{
  projectId: string
  workspaceId: string
}>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  'members-updated': []
}>()

const { user } = useAuth()
const {
  membersForProjects,
  loadWorkspaceMembers,
  loadAllProjectAssignments,
  projectAssignmentsMap,
  projectAssignmentsDataMap,
  invalidateAssignmentsCache,
  hasAccessProjectsPermission
} = useMembers()

const isSaving = ref(false)
const isLoading = ref(false)
const selectedMemberIds = ref<string[]>([])
const initialMemberIds = ref<string[]>([])
const expandedMemberId = ref<string | null>(null)

const toggleExpand = (memberId: string) => {
  expandedMemberId.value = expandedMemberId.value === memberId ? null : memberId
}

// Task permissions state - per member
const memberTaskPermissions = ref<Record<string, Record<string, boolean>>>({})
const initialMemberTaskPermissions = ref<
  Record<string, Record<string, boolean>>
>({})

const getAuthToken = async (): Promise<string | null> => {
  if (!user.value) return null
  return await user.value.getIdToken()
}

// Task permissions nested items
const taskPermissionItems = computed<NestedItem[]>(() => {
  return [
    {
      id: 'toggle-status',
      name: 'Toggle task status'
    },
    {
      id: 'manage-tasks',
      name: 'Manage tasks',
      children: [
        {
          id: 'create-tasks',
          name: 'Create tasks'
        },
        {
          id: 'edit-tasks',
          name: 'Edit tasks'
        },
        {
          id: 'delete-tasks',
          name: 'Delete tasks'
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

// Get optimized permissions for saving (only save parent if all children selected)
const getOptimizedPermissions = (
  state: Record<string, boolean>
): Record<string, boolean> => {
  const selectedIds = Object.entries(state)
    .filter(([_, isChecked]) => isChecked)
    .map(([id]) => id)

  let optimizedIds = [...selectedIds]

  const checkAndOptimizeParent = (item: NestedItem) => {
    if (!item.children || item.children.length === 0) return

    const childIds = getAllChildIds(item)
    const allChildrenSelected =
      childIds.length > 0 && childIds.every((id) => optimizedIds.includes(id))

    if (allChildrenSelected && !optimizedIds.includes(item.id)) {
      optimizedIds = optimizedIds
        .filter((id) => !childIds.includes(id))
        .concat(item.id)
    }

    if (optimizedIds.includes(item.id)) {
      optimizedIds = optimizedIds.filter((id) => !childIds.includes(id))
    }

    if (item.children) {
      for (const child of item.children) {
        checkAndOptimizeParent(child)
      }
    }
  }

  for (const item of taskPermissionItems.value) {
    checkAndOptimizeParent(item)
  }

  const result: Record<string, boolean> = {}
  for (const id of optimizedIds) {
    result[id] = true
  }
  return result
}

// Initialize task permissions for a member from assignment data
const initializeMemberTaskPermissions = (memberId: string) => {
  const assignmentData =
    projectAssignmentsDataMap.value[props.projectId]?.[memberId]
  const savedPermissions = assignmentData?.permissions || {}

  const state: Record<string, boolean> = {}

  const initFromItems = (items: NestedItem[], parentIsChecked = false) => {
    for (const item of items) {
      const isChecked = savedPermissions[item.id] === true || parentIsChecked
      state[item.id] = isChecked

      if (item.children) {
        initFromItems(item.children, isChecked)
      }
    }
  }

  initFromItems(taskPermissionItems.value)
  return state
}

watch(open, async (isOpen) => {
  if (isOpen) {
    await loadData()
  }
})

const loadData = async () => {
  isLoading.value = true
  try {
    await loadWorkspaceMembers(props.workspaceId)
    await loadAllProjectAssignments(props.workspaceId, [props.projectId], true)

    const assigned = projectAssignmentsMap.value[props.projectId] || []
    const taskPerms: Record<string, Record<string, boolean>> = {}

    // Include access-projects members even without an existing assignment
    const accessProjectsIds = membersForProjects.value
      .filter((m) => hasAccessProjectsPermission(m))
      .map((m) => m.uid)
    const allSelectedIds = [...new Set([...assigned, ...accessProjectsIds])]

    for (const memberId of allSelectedIds) {
      taskPerms[memberId] = initializeMemberTaskPermissions(memberId)
    }

    selectedMemberIds.value = [...allSelectedIds]
    initialMemberIds.value = [...allSelectedIds]
    memberTaskPermissions.value = JSON.parse(JSON.stringify(taskPerms))
    initialMemberTaskPermissions.value = JSON.parse(JSON.stringify(taskPerms))
  } catch (error) {
    console.error('Error loading data:', error)
    toast.error('Failed to load project members', {
      style: { background: '#fda4af' },
      duration: 3000
    })
  } finally {
    isLoading.value = false
  }
}

const toggleMember = (memberId: string) => {
  const member = membersForProjects.value.find((m) => m.uid === memberId)
  if (member && hasAccessProjectsPermission(member)) return

  const index = selectedMemberIds.value.indexOf(memberId)
  if (index > -1) {
    selectedMemberIds.value.splice(index, 1)
    const { [memberId]: _, ...rest } = memberTaskPermissions.value
    memberTaskPermissions.value = rest
    if (expandedMemberId.value === memberId) {
      expandedMemberId.value = null
    }
  } else {
    selectedMemberIds.value.push(memberId)
    // Initialize empty task permissions for this member
    const state: Record<string, boolean> = {}
    const initFromItems = (items: NestedItem[]) => {
      for (const item of items) {
        state[item.id] = false
        if (item.children) {
          initFromItems(item.children)
        }
      }
    }
    initFromItems(taskPermissionItems.value)
    memberTaskPermissions.value[memberId] = state
    expandedMemberId.value = memberId
  }
}

const updateMemberPermissions = (
  memberId: string,
  newState: Record<string, boolean>
) => {
  memberTaskPermissions.value[memberId] = { ...newState }
}

const hasChanges = computed(() => {
  // Check member selection changes
  if (selectedMemberIds.value.length !== initialMemberIds.value.length) {
    return true
  }
  if (
    !selectedMemberIds.value.every((id) => initialMemberIds.value.includes(id))
  ) {
    return true
  }

  // Check task permission changes per member
  for (const memberId of selectedMemberIds.value) {
    const current = memberTaskPermissions.value[memberId] || {}
    const initial = initialMemberTaskPermissions.value[memberId] || {}

    const currentKeys = Object.keys(current)
    const initialKeys = Object.keys(initial)

    if (currentKeys.length !== initialKeys.length) return true

    for (const key of currentKeys) {
      if (current[key] !== initial[key]) return true
    }
  }

  return false
})

const hasPermissionChanges = (
  current: Record<string, boolean>,
  initial: Record<string, boolean>
): boolean => {
  const currentKeys = Object.keys(current)
  const initialKeys = Object.keys(initial)

  if (currentKeys.length !== initialKeys.length) return true

  for (const key of currentKeys) {
    if (current[key] !== initial[key]) return true
  }
  return false
}

const save = async () => {
  if (!hasChanges.value) {
    open.value = false
    return
  }

  isSaving.value = true

  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    // Step 1: Update the member list (single call)
    await $fetch<{ success: boolean }>(`/api/projects/${props.projectId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        workspaceId: props.workspaceId,
        memberIds: selectedMemberIds.value
      }
    })

    // Step 2: Update permissions for each member that has changes
    const permissionPromises: Promise<any>[] = []
    for (const memberId of selectedMemberIds.value) {
      const current = memberTaskPermissions.value[memberId] || {}
      const initial = initialMemberTaskPermissions.value[memberId] || {}

      if (hasPermissionChanges(current, initial)) {
        const perms = getOptimizedPermissions(current)
        permissionPromises.push(
          $fetch<{ success: boolean }>(
            `/api/projects/${props.projectId}/assignments/${memberId}`,
            {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}` },
              body: {
                workspaceId: props.workspaceId,
                permissions: Object.keys(perms).length > 0 ? perms : null
              }
            }
          )
        )
      }
    }

    await Promise.all(permissionPromises)
    invalidateAssignmentsCache()

    toast.success('Project members updated successfully', {
      style: { background: '#6ee7b7' },
      duration: 3000
    })
    emit('members-updated')
    open.value = false
  } catch (error: any) {
    console.error('Error saving members:', error)
    toast.error(error.data?.message || 'Failed to update members', {
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
      class="p-0 sm:w-[480px] sm:max-h-[90vh] overflow-hidden flex flex-col"
      :can-close="!isSaving"
      @interact-outside="
        (e) => {
          if (isSaving) e.preventDefault()
        }
      "
    >
      <DialogHeader class="pt-6 px-6 flex-shrink-0">
        <DialogTitle>Project Members</DialogTitle>
        <DialogDescription>
          Manage members and their task permissions
        </DialogDescription>
      </DialogHeader>

      <hr />

      <div class="flex-1 overflow-y-auto px-6 py-4">
        <template v-if="isLoading">
          <div v-for="i in 3" :key="i" class="flex items-center space-x-3 py-2">
            <Skeleton class="h-4 w-4" />
            <Skeleton class="h-8 w-8 rounded-full" />
            <Skeleton class="h-4 w-32" />
          </div>
        </template>

        <template v-else-if="membersForProjects.length === 0">
          <p class="text-sm text-muted-foreground text-center py-4">
            No eligible members in this workspace
          </p>
        </template>

        <template v-else>
          <div class="space-y-4">
            <div
              v-for="member in membersForProjects"
              :key="member.uid"
              class="border rounded-lg p-3"
            >
              <!-- Member Checkbox -->
              <div
                class="flex items-center space-x-3"
                :class="
                  hasAccessProjectsPermission(member)
                    ? 'cursor-default'
                    : 'cursor-pointer'
                "
                @click="
                  !hasAccessProjectsPermission(member) &&
                  toggleMember(member.uid)
                "
              >
                <Checkbox
                  :model-value="
                    hasAccessProjectsPermission(member) ||
                    selectedMemberIds.includes(member.uid)
                  "
                  :disabled="isSaving || hasAccessProjectsPermission(member)"
                  @click.stop
                  @update:model-value="
                    !hasAccessProjectsPermission(member) &&
                    toggleMember(member.uid)
                  "
                />
                <Avatar :uid="member.uid" class="h-8 w-8 shrink-0">
                  <AvatarImage
                    v-if="member.avatarUrl"
                    :src="member.avatarUrl"
                    :alt="member.username || ''"
                  />
                  <AvatarFallback class="text-xs">
                    {{ member.username?.charAt(0).toUpperCase() || '?' }}
                  </AvatarFallback>
                </Avatar>
                <Label
                  :class="
                    hasAccessProjectsPermission(member)
                      ? 'cursor-default'
                      : 'cursor-pointer'
                  "
                  class="flex-1 font-medium"
                >
                  {{ member.username || member.email }}
                </Label>
                <span
                  v-if="hasAccessProjectsPermission(member)"
                  class="text-xs text-muted-foreground"
                >
                  All projects
                </span>
                <button
                  v-if="
                    hasAccessProjectsPermission(member) ||
                    selectedMemberIds.includes(member.uid)
                  "
                  class="p-1 rounded-md hover:bg-muted transition-colors"
                  @click.stop="toggleExpand(member.uid)"
                >
                  <ChevronDown
                    class="h-4 w-4 text-muted-foreground transition-transform duration-200"
                    :class="{
                      'rotate-180': expandedMemberId === member.uid
                    }"
                  />
                </button>
              </div>

              <!-- Task Permissions (shown when expanded) -->
              <div
                class="grid transition-all duration-300 ease-in-out"
                :class="
                  expandedMemberId === member.uid &&
                  (hasAccessProjectsPermission(member) ||
                    selectedMemberIds.includes(member.uid))
                    ? 'grid-rows-[1fr] opacity-100 mt-3'
                    : 'grid-rows-[0fr] opacity-0'
                "
              >
                <div class="overflow-hidden pl-7 border-l-2 border-muted ml-2">
                  <Label class="text-xs text-muted-foreground mb-2 block">
                    Task Permissions
                  </Label>
                  <NestedCheckboxes
                    :model-value="memberTaskPermissions[member.uid] || {}"
                    :items="taskPermissionItems"
                    :disabled="isSaving"
                    @update:model-value="
                      (v) => updateMemberPermissions(member.uid, v)
                    "
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <hr />

      <DialogFooter class="pb-6 px-6 flex-shrink-0">
        <Button variant="outline" :disabled="isSaving" @click="open = false">
          Cancel
        </Button>
        <Button :disabled="isSaving || !hasChanges" @click="save">
          {{ isSaving ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
