<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Check,
  MoreHorizontal,
  Lock,
  Trash2,
  PenLine,
  Clock
} from 'lucide-vue-next'
import TaskForm from './TaskForm.vue'
import TaskInfos from './TaskInfos.vue'
import { useAuth } from '@/composables/useAuth'
import { useTaskStatusSync } from '@/composables/useTaskStatusSync'
import type { WorkspaceMember } from '@/composables/useMembers'
import { PERMISSIONS, hasAnyPermission } from '@/constants/permissions'

const props = defineProps<{
  task: Task
  workspaceId?: string
  workspaceMembers?: WorkspaceMember[]
  projectName?: string
  projectPermissions?: Record<string, boolean>
  workspacePermissions?: Record<string, boolean> | null
}>()

const taskStore = useTaskStore()
const { user } = useAuth()
const isEditing = ref(false)
const showInfoModal = ref(false)

const isTransitioning = ref(false)

const handleEditFromInfo = () => {
  isTransitioning.value = true
  document.body.classList.add('sheet-transitioning')
  showInfoModal.value = false
  setTimeout(() => {
    isEditing.value = true
    setTimeout(() => {
      document.body.classList.remove('sheet-transitioning')
      requestAnimationFrame(() => {
        isTransitioning.value = false
      })
    }, 500)
  }, 300)
}

// Use project-specific permissions if provided, otherwise fall back to taskStore
const canEdit = computed(() => {
  if (props.projectPermissions) {
    return hasAnyPermission(props.projectPermissions, [
      PERMISSIONS.MANAGE_TASKS,
      PERMISSIONS.EDIT_TASKS
    ])
  }
  if (props.workspacePermissions) {
    return hasAnyPermission(props.workspacePermissions, [
      PERMISSIONS.MANAGE_TASKS,
      PERMISSIONS.EDIT_TASKS
    ])
  }
  return taskStore.canEditTasks
})

const canDelete = computed(() => {
  if (props.projectPermissions) {
    return hasAnyPermission(props.projectPermissions, [
      PERMISSIONS.MANAGE_TASKS,
      PERMISSIONS.DELETE_TASKS
    ])
  }
  if (props.workspacePermissions) {
    return hasAnyPermission(props.workspacePermissions, [
      PERMISSIONS.MANAGE_TASKS,
      PERMISSIONS.DELETE_TASKS
    ])
  }
  return taskStore.canDeleteTasks
})

const canToggleStatus = computed(() => {
  if (props.projectPermissions) {
    // Users with edit permissions or assigned to task can toggle
    const hasEditPermission = hasAnyPermission(props.projectPermissions, [
      PERMISSIONS.MANAGE_TASKS,
      PERMISSIONS.EDIT_TASKS
    ])
    const isAssigned =
      props.task.assigneeIds?.includes(user.value?.uid ?? '') ?? false
    return hasEditPermission || isAssigned
  }
  if (props.workspacePermissions) {
    const hasEditPermission = hasAnyPermission(props.workspacePermissions, [
      PERMISSIONS.MANAGE_TASKS,
      PERMISSIONS.EDIT_TASKS
    ])
    const isAssigned =
      props.task.assigneeIds?.includes(user.value?.uid ?? '') ?? false
    return hasEditPermission || isAssigned
  }
  return taskStore.canToggleTaskStatus(
    props.task.assigneeIds,
    user.value?.uid ?? null
  )
})

const hasAnyAction = computed(() => canEdit.value || canDelete.value)

const { localChecked, toggle, syncFromExternal } = useTaskStatusSync({
  taskId: props.task.id,
  initialStatus: props.task.status,
  onLocalUpdate: (status) => {
    taskStore.updateLocalTaskStatus(props.task.id, status)
  },
  onServerSync: async (status) => {
    await taskStore.syncTaskStatusToServer(
      props.task.id,
      status,
      user.value?.uid
    )
  }
})

watch(
  () => props.task.status,
  (newStatus) => {
    syncFromExternal(newStatus)
  }
)

const taskMembersWithData = computed(() => {
  if (!props.workspaceMembers?.length) return []
  if (!props.task.assigneeIds?.length) return []
  return props.workspaceMembers.filter((m) =>
    props.task.assigneeIds?.includes(m.uid)
  )
})

const displayedMembers = computed(() => taskMembersWithData.value.slice(0, 3))
const extraMembersCount = computed(() =>
  Math.max(0, taskMembersWithData.value.length - 3)
)


const isOverdue = computed(() => {
  if (!props.task.dueDate || localChecked.value) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(props.task.dueDate)
  due.setHours(0, 0, 0, 0)
  return due < now
})

const formatDueDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}
</script>

<template>
  <Card
    class="mb-3 hover:shadow-md transition-shadow cursor-pointer"
    @click="showInfoModal = true"
  >
    <CardContent class="px-4">
      <div class="flex items-start gap-3">
        <div @click.stop>
          <Checkbox
            :id="`task-${task.id}`"
            :model-value="localChecked"
            :disabled="!canToggleStatus"
            class="mt-0.5 rounded-full data-[state=unchecked]:border-2 data-[state=unchecked]:border-muted-foreground"
            @update:model-value="
              (checked) => canToggleStatus && toggle(!!checked)
            "
          >
            <Check class="size-2.5" />
          </Checkbox>
        </div>

        <div class="flex-1 overflow-hidden">
          <div class="flex items-center gap-2 min-w-0 mb-1">
            <span
              :class="`font-medium text-sm truncate ${localChecked ? 'line-through text-muted-foreground opacity-70' : ''}`"
            >
              {{ task.title }}
            </span>
            <Badge :class="`priority-badge-${task.priority}`"
            >
              {{ task.priority }}
            </Badge>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <template v-if="projectName">
                <span class="text-xs text-muted-foreground">
                  {{ projectName }}
                </span>
                <span>•</span>
              </template>
              <span
                v-if="task.dueDate"
                class="flex items-center gap-1"
                :class="isOverdue ? 'text-red-500' : ''"
              >
                <Clock class="h-3.5 w-3.5" />
                {{ isOverdue ? 'Overdue' : 'Due' }} {{ formatDueDate(new Date(task.dueDate)) }}
              </span>
              <span v-else>No due date</span>
            </div>

            <div
              v-if="taskMembersWithData.length > 0"
              class="flex -space-x-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:ring-2"
            >
              <Avatar
                v-for="member in displayedMembers"
                :key="member.uid"
                :uid="member.uid"
                class="h-6 w-6"
              >
                <AvatarImage
                  v-if="member.avatarUrl"
                  :src="member.avatarUrl"
                  :alt="member.username || ''"
                />
                <AvatarFallback class="text-xs">
                  {{ member.username?.charAt(0).toUpperCase() || '?' }}
                </AvatarFallback>
              </Avatar>
              <Avatar v-if="extraMembersCount > 0" class="h-8 w-8">
                <AvatarFallback class="text-xs bg-muted">
                  +{{ extraMembersCount }}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        <DropdownMenu v-if="hasAnyAction">
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              @click.stop
            >
              <span class="sr-only">Open menu</span>
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-if="canEdit"
              class="flex items-center gap-2"
              @click="isEditing = true"
            >
              <PenLine class="h-3 w-3" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem
              v-else
              disabled
              class="flex items-center gap-2 opacity-50 cursor-not-allowed"
            >
              <Lock class="h-3 w-3" />
              Edit Task
            </DropdownMenuItem>

            <DropdownMenuItem
              v-if="canDelete"
              class="flex items-center gap-2 text-destructive focus:text-destructive"
              @click="taskStore.deleteTask(task.id, user?.uid)"
            >
              <Trash2 class="h-3 w-3 text-destructive/50" />
              Delete Task
            </DropdownMenuItem>
            <DropdownMenuItem
              v-else
              disabled
              class="flex items-center gap-2 opacity-50 cursor-not-allowed text-destructive/50"
            >
              <Lock class="h-3 w-3 text-destructive/50" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardContent>
  </Card>

  <Teleport to="body">
    <div
      v-if="isTransitioning"
      class="fixed inset-0 z-50 bg-black/80"
    />
  </Teleport>

  <TaskForm
    :is-open="isEditing"
    :edit-task="task"
    :user-id="user?.uid"
    :workspace-id="workspaceId"
    :project-id="task.projectId || undefined"
    @close="isEditing = false"
  />

  <TaskInfos
    :is-open="showInfoModal"
    :task="task"
    :workspace-members="workspaceMembers"
    :assigned-member-ids="task.assigneeIds || []"
    :can-edit="canEdit"
    :can-delete="canDelete"
    @close="showInfoModal = false"
    @edit="handleEditFromInfo"
    @delete="showInfoModal = false; taskStore.deleteTask(task.id, user?.uid)"
  />
</template>
