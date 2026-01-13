<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Tag, Users, Calendar, Lock, Trash2, PenLine } from 'lucide-vue-next'
import ProjectForm from './ProjectForm.vue'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  project: Project
}>()

const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()
const { user } = useAuth()
const isEditing = ref(false)

// Check permissions
const canEdit = computed(() => projectStore.canEditProjects)
const canDelete = computed(() => projectStore.canDeleteProjects)
const hasAnyAction = computed(() => canEdit.value || canDelete.value)

const formatDate = (date: string) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `Date: ${year}.${month}.${day}`
}

const goToProject = () => {
  const workspaceId = route.params.workspace as string
  router.push(`/${workspaceId}/projects/${props.project.id}`)
}

</script>

<template>
  <Card class="aspect-[1.55] hover:shadow-lg transition-shadow cursor-pointer" @click="goToProject">
    <CardContent class="flex items-start justify-between h-full">
      <div class="flex h-full flex-col justify-between">
        <div class="flex flex-col gap-2">
          <div class="w-11 h-11 rounded-full flex items-center justify-center bg-muted">
            <span v-if="project.emoji" class="text-xl">{{ project.emoji }}</span>
            <span v-else class="text-lg font-semibold text-muted-foreground">{{ project.title?.charAt(0).toUpperCase() }}</span>
          </div>
            <h3 class="text-lg font-semibold line-clamp-2">{{ project.title }}</h3>
          <p v-if="project.description" class="text-sm text-muted-foreground mb-2 line-clamp-2">
            {{ project.description }}
          </p>
        </div>

        <div>
          <!-- Tags -->
          <div v-if="project.tags && project.tags.length > 0" class="flex flex-wrap gap-1 mb-3">
            <Badge
              v-for="tag in project.tags.slice(0, 3)"
              :key="tag"
              variant="secondary"
              class="flex items-center gap-1 text-xs"
            >
              <Tag class="h-3 w-3" />
              {{ tag }}
            </Badge>
            <Badge v-if="project.tags.length > 3" variant="secondary" class="text-xs">
              +{{ project.tags.length - 3 }}
            </Badge>
          </div>

          <!-- Footer info -->
          <div class="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
            <div class="flex items-center gap-1">
              <Calendar class="h-3 w-3" />
              <span>{{ formatDate(project.updatedAt) }}</span>
            </div>
            <div v-if="project.members && project.members.length > 0" class="flex items-center gap-1">
              <Users class="h-3 w-3" />
              <span>{{ project.members.length }} {{ project.members.length === 1 ? 'member' : 'members' }}</span>
            </div>
          </div>
        </div>
      </div>

      <DropdownMenu v-if="hasAnyAction">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click.stop>
            <span class="sr-only">Open menu</span>
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            v-if="canEdit"
            @click.stop="isEditing = true"
            class="flex items-center gap-2"
          >
            <PenLine class="h-3 w-3" />
            Edit Project
          </DropdownMenuItem>
          <DropdownMenuItem
            v-else
            disabled
            class="flex items-center gap-2 opacity-50 cursor-not-allowed"
          >
            <Lock class="h-3 w-3" />
            Edit Project
          </DropdownMenuItem>

          <DropdownMenuItem
            v-if="canDelete"
            class="flex items-center gap-2 text-destructive focus:text-destructive"
            @click.stop="projectStore.deleteProject(project.id, user?.uid)"
          >
            <Trash2 class="h-3 w-3 text-destructive/50" />
            Delete Project
          </DropdownMenuItem>
          <DropdownMenuItem
            v-else
            disabled
            class="flex items-center gap-2 opacity-50 cursor-not-allowed text-destructive/50"
          >
            <Lock class="h-3 w-3 text-destructive/50" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardContent>
  </Card>

  <ProjectForm
    v-if="isEditing"
    :is-open="isEditing"
    :edit-project="project"
    :user-id="user?.uid"
    @close="isEditing = false"
  />
</template>
