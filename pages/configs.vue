<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'vue-sonner'
import { Upload, ArrowLeft } from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const { user } = useAuth()
const router = useRouter()

// User data
const username = ref('')
const email = ref('')
const avatarUrl = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// Loading states
const isLoading = ref(true)
const isUpdatingProfile = ref(false)
const isUpdatingEmail = ref(false)
const isUpdatingPassword = ref(false)
const isUploadingAvatar = ref(false)

// File input
const fileInput = ref<HTMLInputElement | null>(null)

const loadUserData = async () => {
  if (!user.value) return

  try {
    isLoading.value = true
    const { $firestore } = useNuxtApp()

    // Load public data
    const publicRef = doc($firestore, 'users', user.value.uid)
    const publicSnap = await getDoc(publicRef)

    if (publicSnap.exists()) {
      const publicData = publicSnap.data()
      username.value = publicData.username || ''
      avatarUrl.value = publicData.avatarUrl || ''
    }

    // Load private data
    const privateRef = doc($firestore, 'users_private', user.value.uid)
    const privateSnap = await getDoc(privateRef)

    if (privateSnap.exists()) {
      const privateData = privateSnap.data()
      email.value = privateData.email || user.value.email || ''
    }
  } catch (error) {
    console.error('Error loading user data:', error)
    toast.error('Failed to load user data', {
      style: { background: '#fda4af' },
      duration: 3000
    })
  } finally {
    isLoading.value = false
  }
}

const updateUsername = async () => {
  if (!user.value || !username.value) {
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
    await updateDoc(publicRef, { username: username.value })

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

const updateUserEmail = async () => {
  if (!user.value || !email.value || !currentPassword.value) {
    toast.error('Email and current password are required', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  try {
    isUpdatingEmail.value = true
    const { $firestore } = useNuxtApp()

    // Reauthenticate user
    const credential = EmailAuthProvider.credential(user.value.email!, currentPassword.value)
    await reauthenticateWithCredential(user.value, credential)

    // Update email in Firebase Auth
    await updateEmail(user.value, email.value)

    // Update email in Firestore
    const privateRef = doc($firestore, 'users_private', user.value.uid)
    await updateDoc(privateRef, { email: email.value })

    currentPassword.value = ''
    toast.success('Email updated successfully', {
      style: { background: '#6ee7b7' },
      duration: 3000
    })
  } catch (error: any) {
    console.error('Error updating email:', error)
    if (error.code === 'auth/wrong-password') {
      toast.error('Incorrect password', {
        style: { background: '#fda4af' },
        duration: 3000
      })
    } else if (error.code === 'auth/email-already-in-use') {
      toast.error('Email is already in use', {
        style: { background: '#fda4af' },
        duration: 3000
      })
    } else {
      toast.error('Failed to update email', {
        style: { background: '#fda4af' },
        duration: 3000
      })
    }
  } finally {
    isUpdatingEmail.value = false
  }
}

const updateUserPassword = async () => {
  if (!user.value || !currentPassword.value || !newPassword.value) {
    toast.error('All password fields are required', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.error('Passwords do not match', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  if (newPassword.value.length < 6) {
    toast.error('Password must be at least 6 characters', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  try {
    isUpdatingPassword.value = true

    // Reauthenticate user
    const credential = EmailAuthProvider.credential(user.value.email!, currentPassword.value)
    await reauthenticateWithCredential(user.value, credential)

    // Update password
    await updatePassword(user.value, newPassword.value)

    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

    toast.success('Password updated successfully', {
      style: { background: '#6ee7b7' },
      duration: 3000
    })
  } catch (error: any) {
    console.error('Error updating password:', error)
    if (error.code === 'auth/wrong-password') {
      toast.error('Incorrect current password', {
        style: { background: '#fda4af' },
        duration: 3000
      })
    } else {
      toast.error('Failed to update password', {
        style: { background: '#fda4af' },
        duration: 3000
      })
    }
  } finally {
    isUpdatingPassword.value = false
  }
}

const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file || !user.value) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file', {
      style: { background: '#fda4af' },
      duration: 3000
    })
    return
  }

  // Validate file size (max 2MB)
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

    // Upload to Firebase Storage
    const avatarRef = storageRef($storage, `avatars/${user.value.uid}/${Date.now()}_${file.name}`)
    await uploadBytes(avatarRef, file)
    const downloadUrl = await getDownloadURL(avatarRef)

    // Update Firestore
    const publicRef = doc($firestore, 'users', user.value.uid)
    await updateDoc(publicRef, { avatarUrl: downloadUrl })

    avatarUrl.value = downloadUrl

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

onMounted(() => {
  if (!user.value) {
    router.push('/login')
  } else {
    loadUserData()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <header class="mb-8">
        <div class="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            @click="router.push('/workspaces')"
            class="flex items-center gap-1"
          >
            <ArrowLeft class="h-4 w-4" />
            <span>Back to Workspaces</span>
          </Button>
        </div>

        <div>
          <h1 class="text-3xl font-bold text-primary mb-2">Account Settings</h1>
          <p class="text-muted-foreground">Manage your account information and preferences</p>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <LoadingSpinner />
      </div>

      <!-- Settings Content -->
      <Tabs v-else default-value="profile" class="w-full">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <!-- Profile Tab -->
        <TabsContent value="profile">
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
                      {{ username.charAt(0).toUpperCase() || 'U' }}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    v-if="isUploadingAvatar"
                    size="sm"
                    disabled
                    class="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
                  >
                    <LoadingSpinner class="h-4 w-4" />
                  </Button>
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
                    Upload New Photo
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
                    v-model="username"
                    placeholder="Enter your username"
                    :disabled="isUpdatingProfile"
                  />
                  <Button
                    @click="updateUsername"
                    :disabled="isUpdatingProfile || !username"
                  >
                    {{ isUpdatingProfile ? 'Saving...' : 'Save' }}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Email Tab -->
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Address</CardTitle>
              <CardDescription>Update your email address. You'll need to enter your current password.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label for="email">New Email</Label>
                <Input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="your@email.com"
                  :disabled="isUpdatingEmail"
                />
              </div>

              <div class="space-y-2">
                <Label for="current-password-email">Current Password</Label>
                <Input
                  id="current-password-email"
                  v-model="currentPassword"
                  type="password"
                  placeholder="Enter your current password"
                  :disabled="isUpdatingEmail"
                />
              </div>

              <Button
                @click="updateUserEmail"
                :disabled="isUpdatingEmail || !email || !currentPassword"
                class="w-full"
              >
                {{ isUpdatingEmail ? 'Updating...' : 'Update Email' }}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Password Tab -->
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label for="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  v-model="currentPassword"
                  type="password"
                  placeholder="Enter your current password"
                  :disabled="isUpdatingPassword"
                />
              </div>

              <div class="space-y-2">
                <Label for="new-password">New Password</Label>
                <Input
                  id="new-password"
                  v-model="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  :disabled="isUpdatingPassword"
                />
              </div>

              <div class="space-y-2">
                <Label for="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  v-model="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  :disabled="isUpdatingPassword"
                />
              </div>

              <Button
                @click="updateUserPassword"
                :disabled="isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword"
                class="w-full"
              >
                {{ isUpdatingPassword ? 'Updating...' : 'Update Password' }}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
