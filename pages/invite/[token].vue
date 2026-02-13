<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useWorkspaceStore } from '@/stores/workspaces'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const { user, loading: authLoading } = useAuth()
const workspaceStore = useWorkspaceStore()

const inviteToken = route.params.token as string
const invite = ref<any>(null)
const isLoading = ref(true)
const isAccepting = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  await loadInvite()
})

const loadInvite = async () => {
  try {
    invite.value = await $fetch(`/api/invite/${inviteToken}`)
    isLoading.value = false
  } catch (err: any) {
    if (err.statusCode === 404) {
      error.value = 'Invitation not found or has expired'
    } else if (err.statusCode === 410) {
      error.value = 'This invitation has expired'
    } else {
      error.value = err.data?.message || 'Failed to load invitation'
    }
    isLoading.value = false
  }
}

const acceptInvite = async () => {
  if (!user.value) {
    router.push(`/login?redirect=/invite/${inviteToken}`)
    return
  }

  isAccepting.value = true

  try {
    const idToken = await user.value.getIdToken()

    const response = await $fetch<{ workspaceId: string }>(
      '/api/invite/accept',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`
        },
        body: {
          token: inviteToken
        }
      }
    )

    await workspaceStore.loadWorkspaces(user.value.uid)

    toast.success('Successfully joined workspace!', {
      style: { background: '#6ee7b7' },
      duration: 3000
    })

    router.push(`/${response.workspaceId}/tasks`)
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to accept invitation', {
      style: { background: '#fda4af' },
      duration: 3000
    })
  } finally {
    isAccepting.value = false
  }
}

const declineInvite = () => {
  router.push('/workspaces')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <Card class="max-w-md w-full">
      <div v-if="isLoading || authLoading" class="p-12">
        <LoadingSpinner />
      </div>

      <div v-else-if="error">
        <CardHeader>
          <CardTitle class="text-center text-destructive"
            >Invalid Invitation</CardTitle
          >
          <CardDescription class="text-center">
            {{ error }}
          </CardDescription>
        </CardHeader>
        <CardContent class="flex justify-center">
          <Button @click="router.push('/workspaces')">
            Go to Workspaces
          </Button>
        </CardContent>
      </div>

      <div v-else-if="invite">
        <CardHeader>
          <CardTitle class="text-center">Workspace Invitation</CardTitle>
          <CardDescription class="text-center">
            You've been invited to join a workspace
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-6">
          <div class="text-center space-y-2">
            <div class="text-2xl font-bold text-primary">
              {{ invite.workspaceName }}
            </div>
            <p class="text-sm text-muted-foreground">
              Invited by
              <span class="font-medium">{{ invite.inviterName }}</span>
            </p>
          </div>

          <div v-if="!user" class="space-y-4">
            <p class="text-sm text-muted-foreground text-center">
              You need to be logged in to accept this invitation
            </p>
            <div class="flex flex-col gap-2">
              <Button
                class="w-full"
                @click="router.push(`/login?redirect=/invite/${inviteToken}`)"
              >
                Login
              </Button>
              <Button
                variant="outline"
                class="w-full"
                @click="
                  router.push(`/register?redirect=/invite/${inviteToken}`)
                "
              >
                Register
              </Button>
            </div>
          </div>

          <div v-else class="flex flex-col gap-2">
            <Button
              :disabled="isAccepting"
              class="w-full"
              @click="acceptInvite"
            >
              {{ isAccepting ? 'Accepting...' : 'Accept Invitation' }}
            </Button>
            <Button
              variant="outline"
              class="w-full"
              :disabled="isAccepting"
              @click="declineInvite"
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  </div>
</template>
