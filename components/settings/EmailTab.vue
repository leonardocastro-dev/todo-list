<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { doc, updateDoc } from 'firebase/firestore'
import { updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'vue-sonner'

const props = defineProps<{
  email: string
}>()

const emit = defineEmits<{
  'update:email': [value: string]
}>()

const { user } = useAuth()

const localEmail = ref(props.email)
const currentPassword = ref('')
const isUpdatingEmail = ref(false)

// Sync with parent
watch(() => props.email, (val) => { localEmail.value = val })

const isEmailChanged = computed(() => {
  return localEmail.value !== props.email
})

const updateUserEmail = async () => {
  if (!user.value || !localEmail.value || !currentPassword.value) {
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
    await updateEmail(user.value, localEmail.value)

    // Update email in Firestore
    const privateRef = doc($firestore, 'users_private', user.value.uid)
    await updateDoc(privateRef, { email: localEmail.value })

    emit('update:email', localEmail.value)
    currentPassword.value = ''

    toast.success('Email updated successfully', {
      style: { background: '#6ee7b7' },
      duration: 3000
    })
  } catch (error: any) {
    console.error('Error updating email:', error)
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      toast.error('Incorrect password', {
        style: { background: '#fda4af' },
        duration: 3000
      })
    } else if (error.code === 'auth/email-already-in-use') {
      toast.error('Email is already in use', {
        style: { background: '#fda4af' },
        duration: 3000
      })
    } else if (error.code === 'auth/invalid-email') {
      toast.error('Please enter a valid email address', {
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
</script>

<template>
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
          v-model="localEmail"
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
        :disabled="isUpdatingEmail || !localEmail || !currentPassword || !isEmailChanged"
        class="w-full"
      >
        {{ isUpdatingEmail ? 'Updating...' : 'Update Email' }}
      </Button>
    </CardContent>
  </Card>
</template>
