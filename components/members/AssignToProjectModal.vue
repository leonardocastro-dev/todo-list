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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  NestedCheckboxes,
  type NestedItem
} from '@/components/ui/nested-checkboxes'
import { toast } from 'vue-sonner'
import { useAuth } from '@/composables/useAuth'
import { useMembers } from '@/composables/useMembers'

interface Member {
  uid: string
  email: string
  username: string
  photoURL: string | null
  permissions?: Record<string, boolean> | null
  joinedAt?: any
}

const props = defineProps<{
  member: Member
  workspaceId: string
}>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  'project-assigned': []
}>()

const { user } = useAuth()
const {
  loadAllProjectAssignments,
  projectAssignmentsMap,
  projectAssignmentsDataMap
} = useMembers()
const projectStore = useProjectStore()

const isSaving = ref(false)
const isLoading = ref(false)
const selectedProjectIds = ref<string[]>([])
const initialProjectIds = ref<string[]>([])

// Task permissions state - per project
const projectTaskPermissions = ref<Record<string, Record<string, boolean>>>({})
const initialProjectTaskPermissions = ref<
  Record<string, Record<string, boolean>>
>({})

const getAuthToken = async (): Promise<string | null> => {
  if (!user.value) return null
  return await user.value.getIdToken()
}

const projects = computed(() => projectStore.projects)

// Task permissions nested items
const taskPermissionItems = computed<NestedItem[]>(() => {
  return [
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

// Initialize task permissions for a project from assignment data
const initializeProjectTaskPermissions = (projectId: string) => {
  const assignmentData =
    projectAssignmentsDataMap.value[projectId]?.[props.member.uid]
  const savedPermissions = assignmentData?.permissions || {}

  const state: Record<string, boolean> = {}

  const initFromItems = (items: NestedItem[], parentIsChecked = false) => {
    for (const item of items) {
      // Item is checked if: saved in DB, OR parent is checked (inherited)
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
    const projectIds = projects.value.map((p) => p.id)
    await loadAllProjectAssignments(props.workspaceId, projectIds)

    // Find which projects the member is assigned to
    const assignedProjects: string[] = []
    const taskPerms: Record<string, Record<string, boolean>> = {}

    for (const [projectId, memberIds] of Object.entries(
      projectAssignmentsMap.value
    )) {
      if (memberIds.includes(props.member.uid)) {
        assignedProjects.push(projectId)
        taskPerms[projectId] = initializeProjectTaskPermissions(projectId)
      }
    }

    selectedProjectIds.value = [...assignedProjects]
    initialProjectIds.value = [...assignedProjects]
    projectTaskPermissions.value = JSON.parse(JSON.stringify(taskPerms))
    initialProjectTaskPermissions.value = JSON.parse(JSON.stringify(taskPerms))
  } catch (error) {
    console.error('Error loading project assignments:', error)
    toast.error('Failed to load project assignments', {
      style: { background: '#fda4af' },
      duration: 3000
    })
  } finally {
    isLoading.value = false
  }
}

const toggleProject = (projectId: string) => {
  const index = selectedProjectIds.value.indexOf(projectId)
  if (index > -1) {
    selectedProjectIds.value.splice(index, 1)
    // Remove task permissions for this project
    const { [projectId]: _, ...rest } = projectTaskPermissions.value
    projectTaskPermissions.value = rest
  } else {
    selectedProjectIds.value.push(projectId)
    // Initialize empty task permissions for this project
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
    projectTaskPermissions.value[projectId] = state
  }
}

const updateProjectPermissions = (
  projectId: string,
  newState: Record<string, boolean>
) => {
  projectTaskPermissions.value[projectId] = { ...newState }
}

const hasChanges = computed(() => {
  // Check project selection changes
  if (selectedProjectIds.value.length !== initialProjectIds.value.length) {
    return true
  }
  if (
    !selectedProjectIds.value.every((id) =>
      initialProjectIds.value.includes(id)
    )
  ) {
    return true
  }

  // Check task permission changes per project
  for (const projectId of selectedProjectIds.value) {
    const current = projectTaskPermissions.value[projectId] || {}
    const initial = initialProjectTaskPermissions.value[projectId] || {}

    const currentKeys = Object.keys(current)
    const initialKeys = Object.keys(initial)

    if (currentKeys.length !== initialKeys.length) return true

    for (const key of currentKeys) {
      if (current[key] !== initial[key]) return true
    }
  }

  return false
})

const saveAssignments = async () => {
  if (!hasChanges.value) {
    open.value = false
    return
  }

  isSaving.value = true

  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const updatePromises: Promise<any>[] = []

    // Projects to add (newly selected)
    const addedProjects = selectedProjectIds.value.filter(
      (id) => !initialProjectIds.value.includes(id)
    )
    // Projects to remove (deselected)
    const removedProjects = initialProjectIds.value.filter(
      (id) => !selectedProjectIds.value.includes(id)
    )
    // Projects that remain selected (may have permission changes)
    const remainingProjects = selectedProjectIds.value.filter((id) =>
      initialProjectIds.value.includes(id)
    )

    // Add member to new projects with permissions
    for (const projectId of addedProjects) {
      const currentMembers = projectAssignmentsMap.value[projectId] || []
      const newMembers = [...currentMembers, props.member.uid]

      // First add the member
      updatePromises.push(
        $fetch<{ success: boolean }>(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            workspaceId: props.workspaceId,
            memberIds: newMembers
          }
        }).then(() => {
          // Then update their permissions
          const perms = getOptimizedPermissions(
            projectTaskPermissions.value[projectId] || {}
          )
          if (Object.keys(perms).length > 0) {
            return $fetch<{ success: boolean }>(
              `/api/projects/${projectId}/assignments/${props.member.uid}`,
              {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
                body: {
                  workspaceId: props.workspaceId,
                  permissions: perms
                }
              }
            )
          }
        })
      )
    }

    // Remove member from deselected projects
    for (const projectId of removedProjects) {
      const currentMembers = projectAssignmentsMap.value[projectId] || []
      const newMembers = currentMembers.filter((id) => id !== props.member.uid)

      updatePromises.push(
        $fetch<{ success: boolean }>(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            workspaceId: props.workspaceId,
            memberIds: newMembers
          }
        })
      )
    }

    // Update permissions for remaining projects if changed
    for (const projectId of remainingProjects) {
      const current = projectTaskPermissions.value[projectId] || {}
      const initial = initialProjectTaskPermissions.value[projectId] || {}

      // Check if permissions changed for this project
      let changed = false
      const currentKeys = Object.keys(current)
      const initialKeys = Object.keys(initial)

      if (currentKeys.length !== initialKeys.length) {
        changed = true
      } else {
        for (const key of currentKeys) {
          if (current[key] !== initial[key]) {
            changed = true
            break
          }
        }
      }

      if (changed) {
        const perms = getOptimizedPermissions(current)
        updatePromises.push(
          $fetch<{ success: boolean }>(
            `/api/projects/${projectId}/assignments/${props.member.uid}`,
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

    await Promise.all(updatePromises)

    toast.success('Project assignments updated successfully', {
      style: { background: '#6ee7b7' },
      duration: 3000
    })
    emit('project-assigned')
    open.value = false
  } catch (error: any) {
    console.error('Error saving assignments:', error)
    toast.error(error.data?.message || 'Failed to update assignments', {
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
        <DialogTitle>Assign to Projects</DialogTitle>
        <DialogDescription>
          {{ member.username || member.email }}
        </DialogDescription>
      </DialogHeader>

      <hr />

      <div class="flex-1 overflow-y-auto px-6 py-4">
        <template v-if="isLoading">
          <div v-for="i in 3" :key="i" class="flex items-center space-x-3 py-2">
            <Skeleton class="h-4 w-4" />
            <Skeleton class="h-4 w-40" />
          </div>
        </template>

        <template v-else-if="projects.length === 0">
          <p class="text-sm text-muted-foreground text-center py-4">
            No projects in this workspace
          </p>
        </template>

        <template v-else>
          <div class="space-y-4">
            <div
              v-for="project in projects"
              :key="project.id"
              class="border rounded-lg p-3"
            >
              <!-- Project Checkbox -->
              <div class="flex items-center space-x-3">
                <Checkbox
                  :id="`project-${project.id}`"
                  :model-value="selectedProjectIds.includes(project.id)"
                  :disabled="isSaving"
                  @update:model-value="toggleProject(project.id)"
                />
                <Label
                  :for="`project-${project.id}`"
                  class="cursor-pointer flex-1 font-medium flex items-center gap-2"
                >
                  <span v-if="project.emoji" class="text-base">{{
                    project.emoji
                  }}</span>
                  {{ project.title }}
                </Label>
              </div>

              <!-- Task Permissions (shown when project is selected) -->
              <div
                v-if="selectedProjectIds.includes(project.id)"
                class="mt-3 pl-7 border-l-2 border-muted ml-2"
              >
                <Label class="text-xs text-muted-foreground mb-2 block">
                  Task Permissions
                </Label>
                <NestedCheckboxes
                  :model-value="projectTaskPermissions[project.id] || {}"
                  :items="taskPermissionItems"
                  :disabled="isSaving"
                  @update:model-value="
                    (v) => updateProjectPermissions(project.id, v)
                  "
                />
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
        <Button :disabled="isSaving || !hasChanges" @click="saveAssignments">
          {{ isSaving ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
