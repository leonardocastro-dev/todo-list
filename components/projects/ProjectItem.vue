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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, Tag, Users, Calendar } from 'lucide-vue-next'
import ProjectForm from './ProjectForm.vue'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  project: Project
}>()

const router = useRouter()
const projectStore = useProjectStore()
const { user } = useAuth()
const isEditing = ref(false)
const isInviting = ref(false)
const memberEmail = ref('')

const formatDate = (date: string) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `Date: ${year}.${month}.${day}`
}

const handleInvite = async () => {
  if (memberEmail.value) {
    await projectStore.inviteMember(props.project.id, memberEmail.value, user.value?.uid)
    memberEmail.value = ''
    isInviting.value = false
  }
}

const goToProject = () => {
  router.push(`/dashboard/projects/${props.project.id}`)
}

</script>

<template>
  <Card class="aspect-[1.55] hover:shadow-lg transition-shadow cursor-pointer" @click="goToProject">
    <CardContent class="flex items-start justify-between h-full">
      <div class="flex h-full flex-col justify-between">
        <div class="flex flex-col gap-2">
          <div class="w-11 h-11 rounded-full flex items-center justify-center bg-gray-100">
            <span v-if="project.emoji" class="text-xl">{{ project.emoji }}</span>
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

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click.stop>
            <span class="sr-only">Open menu</span>
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click.stop="isEditing = true">
            Edit Project
          </DropdownMenuItem>
          <DropdownMenuItem @click.stop="isInviting = true">
            Invite Member
          </DropdownMenuItem>
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click.stop="projectStore.deleteProject(project.id, user?.uid)"
          >
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

  <!-- Invite Member Dialog -->
  <Dialog v-model:open="isInviting">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Invite Member to {{ project.title }}</DialogTitle>
        <DialogDescription>
          Enter the email address of the person you want to invite.
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div>
          <Label for="member-email">Email</Label>
          <Input
            id="member-email"
            v-model="memberEmail"
            type="email"
            placeholder="colleague@example.com"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isInviting = false">
            Cancel
          </Button>
          <Button @click="handleInvite">
            Send Invite
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>
