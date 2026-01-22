<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-vue-next'
import { useMembers } from '@/composables/useMembers'

type Priority = 'normal' | 'important' | 'urgent'

const props = defineProps<{
  isOpen: boolean
  editTask?: Task
  userId?: string
  workspaceId?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const taskStore = useTaskStore()
const {
  members,
  selectedMemberIds,
  isLoadingMembers,
  loadWorkspaceMembers,
  loadTaskAssignees
} = useMembers()

const title = ref(props.editTask?.title || '')
const description = ref(props.editTask?.description || '')
const priority = ref<Priority>(
  (props.editTask?.priority as Priority) || 'normal'
)
const titleError = ref('')

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.workspaceId) {
      await loadWorkspaceMembers(props.workspaceId)
      if (props.editTask) {
        await loadTaskAssignees(props.workspaceId, props.editTask.id)
      } else {
        selectedMemberIds.value = []
      }
    }
  }
)

watch(
  () => props.editTask,
  async (newTask) => {
    if (newTask) {
      title.value = newTask.title
      description.value = newTask.description || ''
      priority.value = newTask.priority as Priority

      if (props.isOpen && props.workspaceId) {
        await loadTaskAssignees(props.workspaceId, newTask.id)
      }
    }
  },
  { immediate: true }
)

const handleSubmit = () => {
  if (!title.value.trim()) {
    titleError.value = 'Title is required'
    return
  }

  if (props.editTask) {
    taskStore.updateTask(
      props.editTask.id,
      {
        title: title.value,
        description: description.value,
        priority: priority.value
      },
      props.userId,
      selectedMemberIds.value
    )
  } else {
    taskStore.addTask(
      {
        title: title.value,
        description: description.value,
        priority: priority.value,
        status: 'pending'
      },
      props.userId,
      props.workspaceId,
      selectedMemberIds.value
    )
  }

  resetForm()
  emit('close')
}

const resetForm = () => {
  title.value = ''
  description.value = ''
  priority.value = 'normal'
  titleError.value = ''
  selectedMemberIds.value = []
}

const handleClose = () => {
  resetForm()
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
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ editTask ? 'Edit Task' : 'Add New Task' }}</DialogTitle>
      </DialogHeader>
      <form class="space-y-4 pt-4" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="title" class="font-medium"> Title </Label>
          <Input
            id="title"
            v-model="title"
            placeholder="Task title"
            :class="titleError ? 'border-red-700' : ''"
            @update:model-value="
              (val) => {
                if (String(val).trim()) titleError = ''
              }
            "
          />
          <p v-if="titleError" class="text-sm text-red-700">{{ titleError }}</p>
        </div>

        <div class="space-y-2">
          <Label for="description" class="font-medium">
            Description (optional)
          </Label>
          <Textarea
            id="description"
            v-model="description"
            placeholder="Add details about your task"
            class="min-h-[100px]"
          />
        </div>

        <div class="space-y-2">
          <Label for="priority" class="font-medium">Priority</Label>
          <RadioGroup
            id="priority"
            v-model="priority"
            class="flex flex-col sm:flex-row space-x-4"
          >
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="urgent" value="urgent" />
              <Label for="urgent" class="flex items-center cursor-pointer">
                <span class="h-3 w-3 rounded-full bg-red-700 mr-2" />
                <span>Urgent</span>
              </Label>
            </div>

            <div class="flex items-center space-x-2">
              <RadioGroupItem id="important" value="important" />
              <Label for="important" class="flex items-center cursor-pointer">
                <span class="h-3 w-3 rounded-full bg-yellow-600 mr-2" />
                <span>Important</span>
              </Label>
            </div>

            <div class="flex items-center space-x-2">
              <RadioGroupItem id="normal" value="normal" />
              <Label for="normal" class="flex items-center cursor-pointer">
                <span class="h-3 w-3 rounded-full bg-emerald-600 mr-2" />
                <span>Normal</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <!-- Assign Members Section -->
        <div v-if="workspaceId && userId" class="space-y-2">
          <Label class="flex items-center gap-2 font-medium">
            <Users class="h-4 w-4" />
            Assign Members
          </Label>
          <p class="text-sm text-muted-foreground">
            Select members to assign to this task.
          </p>

          <div class="max-h-[140px] overflow-y-auto rounded-md border p-4">
            <div class="space-y-3">
              <template v-if="isLoadingMembers">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="flex items-center space-x-2"
                >
                  <Skeleton class="h-4 w-4" />
                  <Skeleton class="h-4 w-32" />
                </div>
              </template>
              <template v-else>
                <div
                  v-for="member in members"
                  :key="member.uid"
                  class="flex items-center space-x-2"
                >
                  <Checkbox
                    :id="`task-member-${member.uid}`"
                    :model-value="selectedMemberIds.includes(member.uid)"
                    @update:model-value="
                      (checked) => {
                        if (checked) {
                          selectedMemberIds.push(member.uid)
                        } else {
                          const index = selectedMemberIds.indexOf(member.uid)
                          if (index > -1) selectedMemberIds.splice(index, 1)
                        }
                      }
                    "
                  />
                  <Label
                    :for="`task-member-${member.uid}`"
                    class="cursor-pointer flex-1 font-normal"
                  >
                    {{ member.username || member.email }}
                  </Label>
                </div>

                <p
                  v-if="members.length === 0"
                  class="text-sm text-muted-foreground text-center py-4"
                >
                  No members in this workspace
                </p>
              </template>
            </div>
          </div>
        </div>

        <DialogFooter class="pt-4">
          <Button type="button" variant="outline" @click="handleClose">
            Cancel
          </Button>
          <Button type="submit">
            {{ editTask ? 'Update Task' : 'Add Task' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
