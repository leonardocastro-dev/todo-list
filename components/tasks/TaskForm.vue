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

type Priority = 'normal' | 'important' | 'urgent'

const props = defineProps<{
  isOpen: boolean
  editTask?: Task
  userId?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const taskStore = useTaskStore()

const title = ref(props.editTask?.title || '')
const description = ref(props.editTask?.description || '')
const priority = ref<Priority>(
  (props.editTask?.priority as Priority) || 'normal'
)
const titleError = ref('')

watch(
  () => props.editTask,
  (newTask) => {
    if (newTask) {
      title.value = newTask.title
      description.value = newTask.description || ''
      priority.value = newTask.priority as Priority
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
      props.userId
    )
  } else {
    taskStore.addTask(
      {
        id: crypto.randomUUID(),
        projectId: taskStore.currentProjectId || '',
        title: title.value,
        description: description.value,
        priority: priority.value,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      props.userId
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
      <form @submit.prevent="handleSubmit" class="space-y-4 pt-4">
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
            v-model="priority"
            id="priority"
            class="flex flex-col sm:flex-row space-x-4"
          >
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="urgent" id="urgent" />
              <Label for="urgent" class="flex items-center cursor-pointer">
                <span class="h-3 w-3 rounded-full bg-red-700 mr-2"></span>
                <span>Urgent</span>
              </Label>
            </div>

            <div class="flex items-center space-x-2">
              <RadioGroupItem value="important" id="important" />
              <Label for="important" class="flex items-center cursor-pointer">
                <span class="h-3 w-3 rounded-full bg-yellow-600 mr-2"></span>
                <span>Important</span>
              </Label>
            </div>

            <div class="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="normal" />
              <Label for="normal" class="flex items-center cursor-pointer">
                <span class="h-3 w-3 rounded-full bg-emerald-600 mr-2"></span>
                <span>Normal</span>
              </Label>
            </div>
          </RadioGroup>
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
