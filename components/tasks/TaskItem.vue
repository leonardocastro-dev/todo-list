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
  Flag,
  ArrowRight,
  Star,
  StarHalf,
  Lock,
  Trash2,
  PenLine
} from 'lucide-vue-next'
import TaskForm from './TaskForm.vue'
import TaskInfos from './TaskInfos.vue'
import { useAuth } from '@/composables/useAuth'
import { useTaskStatusSync } from '@/composables/useTaskStatusSync'
import type { WorkspaceMember } from '@/composables/useMembers'

const props = defineProps<{
  task: Task
  workspaceId?: string
  workspaceMembers?: WorkspaceMember[]
  assignedMemberIds?: string[]
}>()

const taskStore = useTaskStore()
const { user } = useAuth()
const isEditing = ref(false)
const showInfoModal = ref(false)
const canEdit = computed(() => taskStore.canEditTasks)
const canDelete = computed(() => taskStore.canDeleteTasks)
const canToggleStatus = computed(() =>
  taskStore.canToggleTaskStatus(
    props.assignedMemberIds,
    user.value?.uid ?? null
  )
)
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
  if (!props.workspaceMembers || props.workspaceMembers.length === 0) {
    return []
  }
  if (!props.assignedMemberIds || props.assignedMemberIds.length === 0) {
    return []
  }

  return props.workspaceMembers.filter((member) => {
    return props.assignedMemberIds?.includes(member.uid)
  })
})

const displayedMembers = computed(() => taskMembersWithData.value.slice(0, 3))
const extraMembersCount = computed(() =>
  Math.max(0, taskMembersWithData.value.length - 3)
)

const getPriorityIcon = () => {
  switch (props.task.priority) {
    case 'urgent':
      return Flag
    case 'important':
      return Star
    default:
      return StarHalf
  }
}

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
    :class="`mb-3 ${localChecked ? 'opacity-70' : ''} hover:shadow-md transition-shadow cursor-pointer`"
    @click="showInfoModal = true"
  >
    <CardContent class="px-4">
      <div class="flex items-start gap-3">
        <div class="pt-0.5" @click.stop>
          <Checkbox
            :id="`task-${task.id}`"
            :model-value="localChecked"
            :disabled="!canToggleStatus"
            class="mt-1"
            @update:model-value="
              (checked) => canToggleStatus && toggle(!!checked)
            "
          />
        </div>

        <div class="flex-1 overflow-hidden">
          <div class="flex items-center justify-between gap-2 mb-1">
            <div class="flex items-center gap-2 min-w-0">
              <span
                :class="`font-medium text-lg truncate ${localChecked ? 'line-through text-muted-foreground' : ''}`"
              >
                {{ task.title }}
              </span>
              <Badge
                variant="outline"
                :class="`${localChecked ? 'bg-gray-200' : `priority-badge-${task.priority}`}`"
              >
                {{ task.priority }}
              </Badge>
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
                  <ArrowRight class="h-4 w-4" />
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

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <div class="flex items-center">
                <component
                  :is="getPriorityIcon()"
                  class="h-4 w-4"
                  :class="`priority-${task.priority}`"
                />
                <span class="ml-1">{{ task.priority }}</span>
              </div>
              <span>•</span>
              <span v-if="task.dueDate">
                Due: {{ formatDueDate(new Date(task.dueDate)) }}
              </span>
              <span v-else class="text-muted-foreground/70">No due date</span>
              <template v-if="localChecked">
                <span>•</span>
                <span class="flex items-center text-emerald-600">
                  <Check class="h-3 w-3 mr-1" />
                  Completed
                </span>
              </template>
            </div>

            <div
              v-if="taskMembersWithData.length > 0"
              class="flex -space-x-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:ring-2"
            >
              <Avatar
                v-for="member in displayedMembers"
                :key="member.uid"
                class="h-8 w-8"
              >
                <AvatarImage
                  v-if="member.photoURL"
                  :src="member.photoURL"
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
      </div>
    </CardContent>
  </Card>

  <TaskForm
    v-if="isEditing"
    :is-open="isEditing"
    :edit-task="task"
    :user-id="user?.uid"
    :workspace-id="workspaceId"
    :project-id="task.projectId"
    @close="isEditing = false"
  />

  <TaskInfos
    :is-open="showInfoModal"
    :task="task"
    :workspace-members="workspaceMembers"
    :assigned-member-ids="assignedMemberIds"
    @close="showInfoModal = false"
  />
</template>
