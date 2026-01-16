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
import { Badge } from '@/components/ui/badge'
import { X, Smile } from 'lucide-vue-next'
import data from 'emoji-mart-vue-fast/data/all.json'
import 'emoji-mart-vue-fast/css/emoji-mart.css'
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src'

const emojiIndex = new EmojiIndex(data)

const props = defineProps<{
  isOpen: boolean
  editProject?: Project
  userId?: string | null
  workspaceId?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const projectStore = useProjectStore()

const title = ref(props.editProject?.title || '')
const description = ref(props.editProject?.description || '')
const tags = ref<string[]>(props.editProject?.tags || [])
const emoji = ref(props.editProject?.emoji || '')
const showEmojiPicker = ref(false)
const currentTag = ref('')
const titleError = ref('')

watch(
  () => props.editProject,
  (newProject) => {
    if (newProject) {
      title.value = newProject.title
      description.value = newProject.description || ''
      tags.value = [...(newProject.tags || [])]
      emoji.value = newProject.emoji || ''
    }
  },
  { immediate: true }
)

const addTag = () => {
  const tag = currentTag.value.trim()
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
    currentTag.value = ''
  }
}

const removeTag = (tagToRemove: string) => {
  tags.value = tags.value.filter((tag) => tag !== tagToRemove)
}

const onSelectEmoji = (emojiData: any) => {
  emoji.value = emojiData.native
  showEmojiPicker.value = false
}

const clearEmoji = () => {
  emoji.value = ''
  showEmojiPicker.value = false
}

const handleSubmit = () => {
  if (!title.value.trim()) {
    titleError.value = 'Title is required'
    return
  }

  const now = new Date().toISOString()

  if (props.editProject) {
    projectStore.updateProject(
      props.editProject.id,
      {
        title: title.value,
        description: description.value,
        tags: tags.value,
        emoji: emoji.value || undefined,
        updatedAt: now
      },
      props.userId
    )
  } else {
    projectStore.addProject(
      {
        id: crypto.randomUUID(),
        title: title.value,
        description: description.value,
        tags: tags.value,
        emoji: emoji.value || undefined,
        createdAt: now,
        updatedAt: now,
        members: [],
        workspaceId: props.workspaceId
      },
      props.userId,
      props.workspaceId
    )
  }

  resetForm()
  emit('close')
}

const resetForm = () => {
  title.value = ''
  description.value = ''
  tags.value = []
  emoji.value = ''
  showEmojiPicker.value = false
  currentTag.value = ''
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

                    <!-- Botão CLEAR embutido no Picker -->
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
            :class="titleError ? 'border-red-700' : ''"
            @input="
              () => {
                if (title.trim()) titleError = ''
              }
            "
          />
          <p v-if="titleError" class="text-xs text-red-700">
            {{ titleError }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="description">Description</Label>
          <Textarea
            id="description"
            v-model="description"
            placeholder="Add a description..."
            rows="4"
          />
        </div>

        <div class="space-y-2">
          <Label for="tags">Tags</Label>
          <div class="flex gap-2">
            <Input
              id="tags"
              v-model="currentTag"
              placeholder="Add a tag"
              @keypress.enter.prevent="addTag"
            />
            <Button type="button" variant="outline" @click="addTag">
              Add
            </Button>
          </div>
          <div v-if="tags.length > 0" class="flex flex-wrap gap-2 mt-3">
            <Badge
              v-for="tag in tags"
              :key="tag"
              variant="secondary"
              class="flex items-center gap-1 px-3 py-1"
            >
              {{ tag }}
              <button
                type="button"
                class="ml-1 hover:text-destructive"
                @click="removeTag(tag)"
              >
                <X class="h-3 w-3" />
              </button>
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">
            Cancel
          </Button>
          <Button type="submit">
            {{ editProject ? 'Update' : 'Create' }} Project
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
