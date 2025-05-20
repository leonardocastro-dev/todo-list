<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Check, Flag, ArrowRight, Star, StarHalf } from 'lucide-vue-next'
import TaskForm from './TaskForm.vue'
import { useTaskStore } from '@/store'
import type { Task } from '@/store'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  task: Task
}>()

const taskStore = useTaskStore()
const { user } = useAuth()
const isEditing = ref(false)

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
</script>

<template>
  <Card
    :class="`mb-3 ${task.status === 'completed' ? 'opacity-70' : ''} hover:shadow-md transition-shadow`"
  >
    <CardContent class="px-4">
      <div class="flex items-start gap-3">
        <div class="pt-0.5">
          <Checkbox
            :model-value="task.status === 'completed'"
            @update:model-value="
              (checked) => taskStore.toggleTaskStatus(task.id, checked, user?.uid)
            "
            :id="`task-${task.id}`"
            class="mt-1"
          />
        </div>

        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2">
              <label
                :for="`task-${task.id}`"
                :class="`font-medium text-lg cursor-pointer ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`"
              >
                {{ task.title }}
              </label>
              <Badge
                variant="outline"
                :class="`ml-2 ${task.status === 'completed' ? 'bg-gray-200' : `priority-badge-${task.priority}`}`"
              >
                {{ task.priority }}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                  <span class="sr-only">Open menu</span>
                  <ArrowRight class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="isEditing = true">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  class="text-destructive focus:text-destructive"
                  @click="taskStore.deleteTask(task.id, user?.uid)"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p
            v-if="task.description"
            :class="`text-sm mb-2 ${task.status === 'completed' ? 'text-muted-foreground' : ''}`"
          >
            {{ task.description }}
          </p>

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
            <span>{{
              formatDate(new Date(task.createdAt || Date.now()))
            }}</span>
            <template v-if="task.status === 'completed'">
              <span>•</span>
              <span class="flex items-center text-emerald-600">
                <Check class="h-3 w-3 mr-1" />
                Completed
              </span>
            </template>
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
    @close="isEditing = false"
  />
</template>
