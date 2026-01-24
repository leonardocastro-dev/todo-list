<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'vue-sonner'
import { useAuth } from '@/composables/useAuth'
import { useMembers } from '@/composables/useMembers'

interface Member {
  uid: string
  email: string
  username: string
  photoURL: string | null
  permissions: Record<string, boolean> | null
  joinedAt: any
}

const props = defineProps<{
  member: Member
  workspaceId: string
}>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  'project-assigned': []
}>()

const { user } = useAuth()
const { loadAllProjectAssignments, projectAssignmentsMap } = useMembers()
const projectStore = useProjectStore()

const isSaving = ref(false)
const isLoading = ref(false)
const selectedProjectIds = ref<string[]>([])
const initialProjectIds = ref<string[]>([])

const getAuthToken = async (): Promise<string | null> => {
  if (!user.value) return null
  return await user.value.getIdToken()
}

const projects = computed(() => projectStore.projects)

watch(open, async (isOpen) => {
  if (isOpen) {
    await loadProjectAssignments()
  }
})

const loadProjectAssignments = async () => {
  isLoading.value = true
  try {
    const projectIds = projects.value.map((p) => p.id)
    await loadAllProjectAssignments(props.workspaceId, projectIds)

    // Find which projects the member is assigned to
    const assignedProjects: string[] = []
    for (const [projectId, memberIds] of Object.entries(
      projectAssignmentsMap.value
    )) {
      if (memberIds.includes(props.member.uid)) {
        assignedProjects.push(projectId)
      }
    }

    selectedProjectIds.value = [...assignedProjects]
    initialProjectIds.value = [...assignedProjects]
  } catch (error) {
    console.error('Error loading project assignments:', error)
    toast.error('Failed to load project assignments', {
      style: { background: '#fda4af' },
      duration: 3000
    })
  } finally {
    isLoading.value = false
  }
}

const toggleProject = (projectId: string) => {
  const index = selectedProjectIds.value.indexOf(projectId)
  if (index > -1) {
    selectedProjectIds.value.splice(index, 1)
  } else {
    selectedProjectIds.value.push(projectId)
  }
}

const hasChanges = computed(() => {
  if (selectedProjectIds.value.length !== initialProjectIds.value.length) {
    return true
  }
  return !selectedProjectIds.value.every((id) =>
    initialProjectIds.value.includes(id)
  )
})

const saveAssignments = async () => {
  if (!hasChanges.value) {
    open.value = false
    return
  }

  isSaving.value = true

  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    // Find which projects changed
    const addedProjects = selectedProjectIds.value.filter(
      (id) => !initialProjectIds.value.includes(id)
    )
    const removedProjects = initialProjectIds.value.filter(
      (id) => !selectedProjectIds.value.includes(id)
    )

    // Update each changed project
    const updatePromises: Promise<any>[] = []

    for (const projectId of addedProjects) {
      const currentMembers = projectAssignmentsMap.value[projectId] || []
      const newMembers = [...currentMembers, props.member.uid]

      updatePromises.push(
        $fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            workspaceId: props.workspaceId,
            memberIds: newMembers
          }
        })
      )
    }

    for (const projectId of removedProjects) {
      const currentMembers = projectAssignmentsMap.value[projectId] || []
      const newMembers = currentMembers.filter((id) => id !== props.member.uid)

      updatePromises.push(
        $fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            workspaceId: props.workspaceId,
            memberIds: newMembers
          }
        })
      )
    }

    await Promise.all(updatePromises)

    toast.success('Project assignments updated successfully', {
      style: { background: '#6ee7b7' },
      duration: 3000
    })
    emit('project-assigned')
    open.value = false
  } catch (error: any) {
    console.error('Error saving project assignments:', error)
    toast.error(error.data?.message || 'Failed to update project assignments', {
      style: { background: '#fda4af' },
      duration: 3000
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="p-0 w-[420px]"
      :can-close="!isSaving"
      @interact-outside="
        (e) => {
          if (isSaving) e.preventDefault()
        }
      "
    >
      <DialogHeader class="pt-6 px-6">
        <DialogTitle>Assign to Projects</DialogTitle>
        <DialogDescription>
          {{ member.username || member.email }}
        </DialogDescription>
      </DialogHeader>

      <hr />

      <div class="px-6 max-h-[150px] overflow-y-auto">
        <template v-if="isLoading">
          <div v-for="i in 3" :key="i" class="flex items-center space-x-3 py-2">
            <Skeleton class="h-4 w-4" />
            <Skeleton class="h-4 w-40" />
          </div>
        </template>

        <template v-else-if="projects.length === 0">
          <p class="text-sm text-muted-foreground text-center py-4">
            No projects in this workspace
          </p>
        </template>

        <template v-else>
          <div class="space-y-3">
            <div
              v-for="project in projects"
              :key="project.id"
              class="flex items-center space-x-3"
            >
              <Checkbox
                :id="`project-${project.id}`"
                :model-value="selectedProjectIds.includes(project.id)"
                :disabled="isSaving"
                @update:model-value="toggleProject(project.id)"
              />
              <Label
                :for="`project-${project.id}`"
                class="cursor-pointer flex-1 font-normal flex items-center gap-2"
              >
                <span v-if="project.emoji" class="text-base">{{
                  project.emoji
                }}</span>
                {{ project.title }}
              </Label>
            </div>
          </div>
        </template>
      </div>

      <hr />

      <DialogFooter class="pb-6 px-6">
        <Button variant="outline" :disabled="isSaving" @click="open = false">
          Cancel
        </Button>
        <Button :disabled="isSaving || !hasChanges" @click="saveAssignments">
          {{ isSaving ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
