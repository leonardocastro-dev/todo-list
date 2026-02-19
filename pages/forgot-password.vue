<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { useAuth } from '@/composables/useAuth'
import { sendPasswordResetEmail } from 'firebase/auth'
import { toast } from 'vue-sonner'
import { ref, watch } from 'vue'

const { user, loading } = useAuth()
const { $auth } = useNuxtApp()
const sendingReset = ref(false)

watch(
  [() => user.value, () => loading.value],
  ([newUser, isLoading]) => {
    if (newUser && !isLoading) {
      navigateTo('/workspaces')
    }
  },
  { immediate: true }
)

const forgotPasswordSchema = toTypedSchema(
  z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email')
  })
)

const { isFieldDirty, handleSubmit } = useForm({
  validationSchema: forgotPasswordSchema
})

const onSubmit = handleSubmit(async (data) => {
  try {
    sendingReset.value = true
    await sendPasswordResetEmail($auth, data.email.trim())
    toast.success('Password reset email sent. Check your inbox.', {
      style: { background: '#6ee7b7' },
      duration: 3000
    })
  } catch (e: any) {
    if (e.code === 'auth/too-many-requests') {
      toast.error('Too many requests. Please try again later.', {
        style: { background: '#fda4af' },
        duration: 3000
      })
    } else if (e.code === 'auth/network-request-failed') {
      toast.error('Network error. Please check your connection.', {
        style: { background: '#fda4af' },
        duration: 3000
      })
    } else {
      toast.error(
        'Could not send password reset email. Please try again later.',
        {
          style: { background: '#fda4af' },
          duration: 3000
        }
      )
      console.error('Error sending password reset email:', e)
    }
  } finally {
    sendingReset.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="text-2xl font-bold text-center">
            Forgot Password
          </CardTitle>
          <CardDescription class="text-center">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form class="space-y-4" @submit="onSubmit">
            <FormField
              v-slot="{ componentField }"
              name="email"
              :validate-on-blur="!isFieldDirty"
            >
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="email"
                    placeholder="your@email.com"
                    :disabled="loading || sendingReset"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button
              type="submit"
              class="w-full"
              :disabled="loading || sendingReset"
            >
              {{ sendingReset ? 'Sending...' : 'Send reset email' }}
            </Button>
          </form>
        </CardContent>

        <CardFooter class="flex justify-center">
          <Button variant="link" @click="navigateTo('/login')">
            Back to login
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
