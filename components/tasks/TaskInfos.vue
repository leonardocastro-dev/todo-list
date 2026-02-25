<script setup lang="ts">
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Flag,
  Star,
  StarHalf,
  Check,
  Calendar,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  CircleDashed
} from 'lucide-vue-next'
import type { WorkspaceMember } from '@/composables/useMembers'

const props = defineProps<{
  isOpen: boolean
  task: Task
  workspaceMembers?: WorkspaceMember[]
  assignedMemberIds?: string[]
}>()

const emit = defineEmits<{
  close: []
}>()

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

const isCompleted = computed(() => props.task.status === 'completed')

const isOverdue = computed(() => {
  if (!props.task.dueDate || isCompleted.value) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(props.task.dueDate)
  due.setHours(0, 0, 0, 0)
  return due < now
})

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

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
}

const descriptionExpanded = ref(false)
const descriptionRef = ref<HTMLElement | null>(null)
const needsExpand = ref(false)

const checkOverflow = () => {
  nextTick(() => {
    if (descriptionRef.value) {
      needsExpand.value = descriptionRef.value.scrollHeight > 160
    }
  })
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      descriptionExpanded.value = false
      checkOverflow()
    }
  }
)

watch(
  () => props.task.description,
  () => {
    checkOverflow()
  }
)

const toggleDescription = () => {
  descriptionExpanded.value = !descriptionExpanded.value
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Sheet
    :open="isOpen"
    @update:open="
      (open) => {
        if (!open) handleClose()
      }
    "
  >
    <SheetContent
      side="right"
      class="sm:max-w-[480px] w-full p-0 flex flex-col overflow-hidden"
    >
      <!-- Title -->
      <SheetHeader>
        <SheetTitle class="text-xl leading-tight">
          {{ task.title }}
        </SheetTitle>
        <SheetDescription class="sr-only">
          Task details for {{ task.title }}
        </SheetDescription>
      </SheetHeader>

      <!-- Metadata rows -->
      <div class="p-5 space-y-4">
      <!-- Status -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground flex items-center gap-2">
          <CircleDashed class="h-4 w-4 text-muted-foreground/70" />
          Status
        </span>
        <Badge
          v-if="isCompleted"
          variant="outline"
          class="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
        >
          <Check class="h-3 w-3 mr-1" />
          Completed
        </Badge>
        <Badge
          v-else
          variant="outline"
          class="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
        >
          <CircleDashed class="h-3 w-3 mr-1" />
          Pending
        </Badge>
      </div>

      <!-- Priority -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground flex items-center gap-2">
          <component
            :is="getPriorityIcon()"
            class="h-4 w-4 text-muted-foreground/70"
          />
          Priority
        </span>
        <Badge :class="`priority-badge-${task.priority}`">
          {{ task.priority }}
        </Badge>
      </div>

      <!-- Due Date -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground flex items-center gap-2">
          <Clock class="h-4 w-4 text-muted-foreground/70" />
          Due Date
        </span>
        <span
          v-if="task.dueDate"
          class="text-sm font-medium"
          :class="isOverdue ? 'text-red-500' : ''"
        >
          {{ isOverdue ? 'Overdue — ' : '' }}{{ formatDate(new Date(task.dueDate)) }}
        </span>
        <span v-else class="text-sm text-muted-foreground italic">
          No due date
        </span>
      </div>

      <!-- Created -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar class="h-4 w-4 text-muted-foreground/70" />
          Created
        </span>
        <span class="text-sm font-medium">
          {{ formatDateTime(new Date(task.createdAt || Date.now())) }}
        </span>
      </div>

      <!-- Assignees -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground flex items-center gap-2">
          <Users class="h-4 w-4 text-muted-foreground/70" />
          Assignees
        </span>
        <div
          v-if="taskMembersWithData.length > 0"
          class="flex -space-x-1.5 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:ring-2"
        >
          <Avatar
            v-for="member in taskMembersWithData"
            :key="member.uid"
            :uid="member.uid"
            class="h-7 w-7"
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
        </div>
        <span v-else class="text-sm text-muted-foreground italic">
          Unassigned
        </span>
      </div>
    </div>

    <!-- Assignee names (expanded list below metadata) -->
    <div
      v-if="taskMembersWithData.length > 0"
      class="px-6 pb-4"
    >
      <div class="flex flex-wrap gap-2">
        <div
          v-for="member in taskMembersWithData"
          :key="member.uid"
          class="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5"
        >
          <Avatar :uid="member.uid" class="h-5 w-5">
            <AvatarImage
              v-if="member.avatarUrl"
              :src="member.avatarUrl"
              :alt="member.username || ''"
            />
            <AvatarFallback class="text-[10px]">
              {{ member.username?.charAt(0).toUpperCase() || '?' }}
            </AvatarFallback>
          </Avatar>
          <span class="text-xs font-medium">
            {{ member.username || member.email }}
          </span>
        </div>
      </div>
    </div>

    <!-- Description -->
    <div class="px-6">
      <hr class="border-muted" />
      <div v-if="task.description" class="relative">
        <div
          ref="descriptionRef"
          class="text-sm overflow-hidden transition-all duration-300 pt-4 break-all whitespace-pre-wrap"
          :style="{ maxHeight: descriptionExpanded ? 'none' : '200px' }"
        >
          {{ task.description }}
        </div>
        <div
          v-if="needsExpand && !descriptionExpanded"
          class="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"
        />
      </div>
      <p v-else class="text-sm text-muted-foreground italic pt-4">
        - No description provided
      </p>
      <hr class="border-muted mt-4" />
      <div
        v-if="task.description && needsExpand"
        class="flex justify-center pt-2"
      >
        <Button
          variant="ghost"
          size="sm"
          class="text-xs text-muted-foreground gap-1"
          @click="toggleDescription"
        >
          <ChevronDown v-if="!descriptionExpanded" class="h-3 w-3" />
          <ChevronUp v-else class="h-3 w-3" />
          {{ descriptionExpanded ? 'Recolher' : 'Expandir' }}
        </Button>
      </div>
    </div>
    </SheetContent>
  </Sheet>
</template>
