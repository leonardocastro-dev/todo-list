<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { doc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'vue-sonner'
import { Upload } from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  username: string
  avatarUrl: string
}>()

const emit = defineEmits<{
  'update:username': [value: string]
  'update:avatarUrl': [value: string]
}>()

const { user } = useAuth()

const localUsername = ref(props.username)
const isUpdatingProfile = ref(false)
const isUploadingAvatar = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Sync with parent
watch(() => props.username, (val) => { localUsername.value = val })

const updateUsername = async () => {
  if (!user.value || !localUsername.value) {
    toast.error('Username is required', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  try {
    isUpdatingProfile.value = true
    const { $firestore } = useNuxtApp()

    const publicRef = doc($firestore, 'users', user.value.uid)
    await updateDoc(publicRef, { username: localUsername.value })

    emit('update:username', localUsername.value)

    toast.success('Username updated successfully', {
      style: { background: '#6ee7b7' },
      duration: 3000
    })
  } catch (error) {
    console.error('Error updating username:', error)
    toast.error('Failed to update username', {
      style: { background: '#fda4af' },
      duration: 3000
    })
  } finally {
    isUpdatingProfile.value = false
  }
}

const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file || !user.value) return

  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    toast.error('Image must be less than 2MB', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  try {
    isUploadingAvatar.value = true
    const { $storage, $firestore } = useNuxtApp()

    const avatarRef = storageRef($storage, `avatars/${user.value.uid}/${Date.now()}_${file.name}`)
    await uploadBytes(avatarRef, file)
    const downloadUrl = await getDownloadURL(avatarRef)

    const publicRef = doc($firestore, 'users', user.value.uid)
    await updateDoc(publicRef, { avatarUrl: downloadUrl })

    emit('update:avatarUrl', downloadUrl)

    toast.success('Avatar updated successfully', {
      style: { background: '#6ee7b7' },
      duration: 3000
    })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    toast.error('Failed to upload avatar', {
      style: { background: '#fda4af' },
      duration: 3000
    })
  } finally {
    isUploadingAvatar.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Profile Information</CardTitle>
      <CardDescription>Update your username and profile picture</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Avatar Upload -->
      <div class="flex items-center gap-6">
        <div class="relative">
          <Avatar class="h-24 w-24">
            <AvatarImage :src="avatarUrl" alt="Profile picture" />
            <AvatarFallback class="text-2xl">
              {{ localUsername.charAt(0).toUpperCase() || 'U' }}
            </AvatarFallback>
          </Avatar>
          <div
            v-if="isUploadingAvatar"
            class="absolute flex items-center justify-center bg-muted bottom-0 right-0 h-8 w-8 rounded-full"
          >
            <Loader2 class="animate-spin text-primary" />
          </div>
        </div>
        <div class="flex-1">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleAvatarUpload"
          />
          <Button
            variant="outline"
            @click="fileInput?.click()"
            :disabled="isUploadingAvatar"
            class="flex items-center gap-2"
          >
            <Upload class="h-4 w-4" />
            {{ isUploadingAvatar ? 'Uploading...' : 'Upload New Photo' }}
          </Button>
          <p class="text-sm text-muted-foreground mt-2">
            JPG, PNG or GIF. Max size 2MB.
          </p>
        </div>
      </div>

      <!-- Username -->
      <div class="space-y-2">
        <Label for="username">Username</Label>
        <div class="flex gap-2">
          <Input
            id="username"
            v-model="localUsername"
            placeholder="Enter your username"
            :disabled="isUpdatingProfile"
          />
          <Button
            @click="updateUsername"
            :disabled="isUpdatingProfile || !localUsername"
          >
            {{ isUpdatingProfile ? 'Saving...' : 'Save' }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
