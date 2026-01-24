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
import { Label } from '@/components/ui/label'
import { Smile } from 'lucide-vue-next'
import data from 'emoji-mart-vue-fast/data/all.json'
import 'emoji-mart-vue-fast/css/emoji-mart.css'
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src'
import { useWorkspace } from '@/composables/useWorkspace'
import {
  validateProjectForm,
  hasValidationErrors,
  type ProjectValidationErrors
} from '@/utils/validation'
import { showErrorToast } from '@/utils/toast'

const emojiIndex = new EmojiIndex(data)

const props = defineProps<{
  isOpen: boolean
  editProject?: Project
  userId?: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { workspaceId } = useWorkspace()

const projectStore = useProjectStore()

const title = ref(props.editProject?.title || '')
const description = ref(props.editProject?.description || '')
const emoji = ref(props.editProject?.emoji || '')
const showEmojiPicker = ref(false)
const currentTag = ref('')
const validationErrors = ref<ProjectValidationErrors>({})
const isSaving = ref(false)

watch(
  () => props.editProject,
  (newProject) => {
    if (newProject) {
      title.value = newProject.title
      description.value = newProject.description || ''
      emoji.value = newProject.emoji || ''
    }
  },
  { immediate: true }
)

const onSelectEmoji = (emojiData: any) => {
  emoji.value = emojiData.native
  showEmojiPicker.value = false
}

const clearEmoji = () => {
  emoji.value = ''
  showEmojiPicker.value = false
}

const handleSubmit = async () => {
  // Validate
  const errors = validateProjectForm({
    title: title.value,
    description: description.value
  })

  if (hasValidationErrors(errors)) {
    validationErrors.value = errors
    return
  }

  validationErrors.value = {}
  isSaving.value = true

  try {
    const now = new Date().toISOString()

    if (props.editProject) {
      await projectStore.updateProject(
        props.editProject.id,
        {
          title: title.value,
          description: description.value,
          emoji: emoji.value || undefined,
          updatedAt: now
        },
        props.userId
      )
    } else {
      await projectStore.addProject(
        {
          id: crypto.randomUUID(),
          title: title.value,
          description: description.value,
          emoji: emoji.value || undefined,
          createdAt: now,
          updatedAt: now,
          members: [],
          workspaceId: workspaceId.value || undefined
        },
        props.userId,
        workspaceId.value || undefined
      )
    }

    resetForm()
    emit('close')
  } catch {
    showErrorToast('Failed to save project. Please try again.')
  } finally {
    isSaving.value = false
  }
}

const resetForm = () => {
  title.value = ''
  description.value = ''
  emoji.value = ''
  showEmojiPicker.value = false
  currentTag.value = ''
  validationErrors.value = {}
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
    <DialogContent class="sm:max-w-[525px]">
      <DialogHeader>
        <div class="flex items-center gap-4">
          <div class="relative">
            <!-- Botão que abre o Picker -->
            <Button
              type="button"
              variant="outline"
              class="w-11 h-11 text-3xl rounded-full"
              @click="showEmojiPicker = !showEmojiPicker"
            >
              <Smile v-if="!emoji" :size="20" />
              <span v-else class="text-xl">{{ emoji }}</span>
            </Button>

            <!-- Picker com botão Clear dentro -->
            <div
              v-if="showEmojiPicker"
              class="absolute z-50 mt-2 bg-white rounded-lg shadow-xl"
            >
              <Picker :data="emojiIndex" set="twitter" @select="onSelectEmoji">
                <!-- Slot CUSTOMIZADO -->
                <template #searchTemplate="{ searchValue, onSearch }">
                  <div class="flex items-center gap-2 p-2 border-b">
                    <input
                      class="flex-1 px-3 py-1 border rounded-md"
                      type="text"
                      :value="searchValue"
                      placeholder="Search emoji..."
                      @input="
                        (e) =>
                          onSearch((e.target as HTMLInputElement)?.value ?? '')
                      "
                    />

                    <button
                      v-if="emoji"
                      class="px-2 py-1 h-full text-sm bg-red-100 text-red-600 rounded-md"
                      @click="clearEmoji"
                    >
                      Clear
                    </button>
                  </div>
                </template>
              </Picker>
            </div>
          </div>

          <DialogTitle>
            {{ editProject ? 'Edit Project' : 'Create New Project' }}
          </DialogTitle>
        </div>
      </DialogHeader>

      <form class="space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="title">Title *</Label>
          <Input
            id="title"
            v-model="title"
            placeholder="Project title"
            :class="validationErrors.title ? 'border-red-700' : ''"
            :disabled="isSaving"
          />
          <p v-if="validationErrors.title" class="text-xs text-red-700">
            {{ validationErrors.title }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="description">Description</Label>
          <Textarea
            id="description"
            v-model="description"
            placeholder="Add a description..."
            rows="4"
            :class="validationErrors.description ? 'border-red-700' : ''"
            :disabled="isSaving"
          />
          <p v-if="validationErrors.description" class="text-xs text-red-700">
            {{ validationErrors.description }}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            :disabled="isSaving"
            @click="handleClose"
          >
            Cancel
          </Button>
          <Button type="submit" :disabled="isSaving">
            {{
              isSaving
                ? 'Saving...'
                : editProject
                  ? 'Update Project'
                  : 'Create Project'
            }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
