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
import { watch } from 'vue'

const { user, register, loading } = useAuth()

// Redirect if already logged in
watch(() => user.value, (newUser) => {
  if (newUser && !loading.value) {
    navigateTo('/workspaces')
  }
}, { immediate: true })

const registerSchema = toTypedSchema(
  z
    .object({
      name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters').max(50, 'Name must not exceed 50 characters'),
      email: z.string().min(1, 'Email is required').email('Invalid email'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      confirmPassword: z.string().min(1, 'Confirm your password')
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'The passwords do not match',
      path: ['confirmPassword']
    })
)

const { isFieldDirty, handleSubmit } = useForm({
  validationSchema: registerSchema
})

const onSubmit = handleSubmit(async (data) => {
  await register(data.name, data.email, data.password)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="text-2xl font-bold text-center">Register</CardTitle>
          <CardDescription class="text-center">
            Register to manage your tasks
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form @submit="onSubmit" class="space-y-4">
            <FormField
              v-slot="{ componentField }"
              name="name"
              :validate-on-blur="!isFieldDirty"
            >
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="text"
                    placeholder="John Doe"
                    :disabled="loading"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

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
                    :disabled="loading"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField
              v-slot="{ componentField }"
              name="password"
              :validate-on-blur="!isFieldDirty"
            >
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="password"
                    placeholder="******"
                    :disabled="loading"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField
              v-slot="{ componentField }"
              name="confirmPassword"
              :validate-on-blur="!isFieldDirty"
            >
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="password"
                    placeholder="******"
                    :disabled="loading"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full" :disabled="loading">
              {{ loading ? 'Loading...' : 'Register' }}
            </Button>
          </form>
        </CardContent>

        <CardFooter class="flex flex-col space-y-2">
          <div class="text-sm text-center text-muted-foreground">
            Already have an account?
          </div>
          <Button
            variant="outline"
            class="w-full"
            @click="navigateTo('/login')"
          >
            Login
          </Button>
          <Button variant="link" @click="navigateTo('/workspaces')">
            Continue as guest
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
