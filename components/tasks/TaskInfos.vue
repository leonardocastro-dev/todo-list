<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
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
  ChevronUp
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

const firstMember = computed(() => taskMembersWithData.value[0] || null)
const otherMembers = computed(() => taskMembersWithData.value.slice(1))
const hasMultipleMembers = computed(() => taskMembersWithData.value.length > 1)

const isCompleted = computed(() => props.task.status === 'completed')

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
      needsExpand.value = descriptionRef.value.scrollHeight > 200
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
  <Dialog
    :open="isOpen"
    @update:open="
      (open) => {
        if (!open) handleClose()
      }
    "
  >
    <DialogContent
      class="sm:max-w-[500px] overflow-y-auto sm:max-h-[85vh] h-full flex flex-col"
    >
      <DialogHeader>
        <DialogTitle class="flex items-start flex-col gap-2">
          <Badge
            v-if="isCompleted"
            variant="outline"
            class="bg-emerald-100 text-emerald-600 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400"
          >
            <Check class="h-3 w-3 mr-1" />
            Completed
          </Badge>
          <Badge v-else variant="outline" class="bg-amber-100 text-amber-600 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400">
            Pending
          </Badge>
          <span class="truncate">{{ task.title }}</span>
        </DialogTitle>
      </DialogHeader>

      <div class="space-y-4 pt-2">
        <!-- Priority -->
        <div class="space-y-1">
          <h4 class="text-sm font-medium text-muted-foreground">Priority</h4>
          <div class="flex items-center gap-2">
            <component
              :is="getPriorityIcon()"
              class="h-4 w-4"
              :class="`priority-${task.priority}`"
            />
            <Badge :class="`priority-badge-${task.priority}`">
              {{ task.priority }}
            </Badge>
          </div>
        </div>

        <!-- Created Date -->
        <div class="space-y-1">
          <h4 class="text-sm font-medium text-muted-foreground">Created</h4>
          <div class="flex items-center gap-2 text-sm">
            <Calendar class="h-4 w-4 text-muted-foreground" />
            <span>{{
              formatDate(new Date(task.createdAt || Date.now()))
            }}</span>
          </div>
        </div>

        <!-- Due Date -->
        <div class="space-y-1">
          <h4 class="text-sm font-medium text-muted-foreground">Due Date</h4>
          <div class="flex items-center gap-2 text-sm">
            <Clock class="h-4 w-4 text-muted-foreground" />
            <span v-if="task.dueDate">{{
              formatDate(new Date(task.dueDate))
            }}</span>
            <span v-else>No due date</span>
          </div>
        </div>

        <!-- Assigned Members -->
        <div class="space-y-1">
          <h4 class="text-sm font-medium text-muted-foreground">
            Assigned Members
          </h4>
          <div class="flex items-center gap-2 text-sm">
            <Users class="h-4 w-4 text-muted-foreground" />
            <div v-if="firstMember" class="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger as-child :disabled="!hasMultipleMembers">
                  <Button
                    variant="outline"
                    :class="{
                      'hover:bg-muted/80 cursor-pointer': hasMultipleMembers,
                      'cursor-default': !hasMultipleMembers
                    }"
                  >
                    <Avatar class="bg-muted h-6 w-6">
                      <AvatarImage
                        v-if="firstMember.avatarUrl"
                        :src="firstMember.avatarUrl"
                        :alt="firstMember.username || ''"
                      />
                      <AvatarFallback class="text-xs">
                        {{
                          firstMember.username?.charAt(0).toUpperCase() || '?'
                        }}
                      </AvatarFallback>
                    </Avatar>
                    <span class="text-sm">{{
                      firstMember.username || firstMember.email
                    }}</span>
                    <template v-if="hasMultipleMembers">
                      <span class="text-xs text-muted-foreground"
                        >+{{ otherMembers.length }}</span
                      >
                      <ChevronDown class="h-3 w-3 text-muted-foreground" />
                    </template>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent v-if="hasMultipleMembers" align="start">
                  <DropdownMenuItem
                    v-for="member in otherMembers"
                    :key="member.uid"
                    class="flex items-center gap-2"
                  >
                    <Avatar class="bg-muted h-6 w-6">
                      <AvatarImage
                        v-if="member.avatarUrl"
                        :src="member.avatarUrl"
                        :alt="member.username || ''"
                      />
                      <AvatarFallback class="text-xs">
                        {{ member.username?.charAt(0).toUpperCase() || '?' }}
                      </AvatarFallback>
                    </Avatar>
                    <span class="text-sm">{{
                      member.username || member.email
                    }}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div v-else class="text-sm">No members assigned</div>
          </div>
        </div>

        <!-- Description -->
        <div>
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
      </div>

      <DialogFooter class="pt-4">
        <Button type="button" variant="outline" @click="handleClose">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
