<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { WorkspaceMember } from '@/composables/useMembers'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Calendar,
  Lock,
  Trash2,
  PenLine
} from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  project: Project
  workspaceMembers: WorkspaceMember[]
}>()

const emit = defineEmits<{
  edit: [project: Project]
}>()

const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()
const { user } = useAuth()
const canEdit = computed(() => projectStore.canEditProjects)
const canDelete = computed(() => projectStore.canDeleteProjects)
const hasAnyAction = computed(() => canEdit.value || canDelete.value)

const projectMembersWithData = computed(() => {
  if (!props.project.members || props.project.members.length === 0) {
    return []
  }
  return props.project.members
    .map(memberEmail => props.workspaceMembers.find(m => m.email === memberEmail))
    .filter((m): m is WorkspaceMember => m !== undefined)
})

console.log('projectMembersWithData', projectMembersWithData.value);
const displayedMembers = computed(() => projectMembersWithData.value.slice(0, 3))
const extraMembersCount = computed(() => Math.max(0, projectMembersWithData.value.length - 3))

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

const handleEdit = () => {
  emit('edit', props.project)
}
</script>

<template>
  <Card
    class="aspect-[1.55] hover:shadow-lg transition-shadow cursor-pointer"
    @click="goToProject"
  >
    <CardContent class="flex items-start justify-between h-full">
      <div class="flex h-full flex-col justify-between">
        <div class="flex flex-col gap-2">
          <div
            class="w-11 h-11 rounded-full flex items-center justify-center bg-muted"
          >
            <span v-if="project.emoji" class="text-xl">{{
              project.emoji
            }}</span>
            <span v-else class="text-lg font-semibold text-muted-foreground">{{
              project.title?.charAt(0).toUpperCase()
            }}</span>
          </div>
          <h3 class="text-lg font-semibold line-clamp-2">
            {{ project.title }}
          </h3>
          <p
            v-if="project.description"
            class="text-sm text-muted-foreground mb-2 line-clamp-2"
          >
            {{ project.description }}
          </p>
        </div>

        <div
          class="mt-auto flex items-center gap-4 text-xs text-muted-foreground"
        >
          <div class="flex items-center gap-1">
            <Calendar class="h-3 w-3" />
            <span>{{ formatDate(project.updatedAt) }}</span>
          </div>
          <div
            v-if="projectMembersWithData.length > 0"
            class="flex -space-x-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:ring-2"
          >
            <Avatar
              v-for="member in displayedMembers"
              :key="member.uid"
              class="h-6 w-6"
            >
              <AvatarImage :src="member.photoURL || undefined" :alt="member.username || ''" />
              <AvatarFallback class="text-xs">
                {{ member.username?.charAt(0).toUpperCase() || '?' }}
              </AvatarFallback>
            </Avatar>
            <Avatar v-if="extraMembersCount > 0" class="h-6 w-6">
              <AvatarFallback class="text-xs bg-muted">
                +{{ extraMembersCount }}
              </AvatarFallback>
            </Avatar>
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
            class="flex items-center gap-2"
            @click.stop="handleEdit"
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
</template>
