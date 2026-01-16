<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'vue-sonner'

const { user } = useAuth()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isUpdatingPassword = ref(false)

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
    const credential = EmailAuthProvider.credential(
      user.value.email!,
      currentPassword.value
    )
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
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Change Password</CardTitle>
      <CardDescription
        >Update your password to keep your account secure</CardDescription
      >
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
        :disabled="
          isUpdatingPassword ||
          !currentPassword ||
          !newPassword ||
          !confirmPassword
        "
        class="w-full"
        @click="updateUserPassword"
      >
        {{ isUpdatingPassword ? 'Updating...' : 'Update Password' }}
      </Button>
    </CardContent>
  </Card>
</template>
