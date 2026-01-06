<script setup lang="ts">
import { computed } from 'vue'
import { LogOut, Lock } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/composables/useAuth"

const { user, logout } = useAuth()
const route = useRoute()

const workspaceSlug = computed(() => route.params.workspace as string)
const isGuest = computed(() => !user.value)
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
    <aside class="w-64 bg-background border-r fixed h-screen flex flex-col">
      <div class="p-6">
        <NuxtLink to="/workspaces" class="text-2xl font-bold text-primary">
          Fokuz
        </NuxtLink>
      </div>

      <nav class="flex flex-col flex-1 gap-2 px-4 py-2">
        <NuxtLink
          :to="`/${workspaceSlug}/projects`"
          class="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
          active-class="!text-primary !bg-accent"
        >
          Projects
        </NuxtLink>
        <div
          v-if="isGuest"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground/50 cursor-not-allowed opacity-60"
          title="Members feature is only available for logged-in users"
        >
          <Lock class="h-4 w-4" />
          <span>Members</span>
        </div>
        <NuxtLink
          v-else
          :to="`/${workspaceSlug}/members`"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-primary hover:bg-accent"
          active-class="!text-primary !bg-accent"
        >
          <span>Members</span>
        </NuxtLink>

        <div class="border-t my-2"></div>

        <NuxtLink
          to="/workspaces"
          class="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
        >
          Workspaces
        </NuxtLink>
        <div
          v-if="isGuest"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground/50 cursor-not-allowed opacity-60"
          title="Members feature is only available for logged-in users"
        >
          <Lock class="h-4 w-4" />
          <span>Settings</span>
        </div>
        <NuxtLink
          v-else
          :to="`/settings`"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-primary hover:bg-accent"
          active-class="!text-primary !bg-accent"
        >
          <span>Settings</span>
        </NuxtLink>
      </nav>

      <div class="p-4 border-t">
        <div v-if="user">
          <div class="mb-3 px-2">
            <p class="text-sm text-muted-foreground truncate">
              {{ user.email }}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            @click="logout"
            class="w-full flex items-center justify-center gap-2"
          >
            <LogOut class="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>

        <div v-else class="space-y-2">
          <Button
            variant="default"
            size="sm"
            @click="$router.push('/login')"
            class="w-full"
          >
            Login
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="$router.push('/register')"
            class="w-full"
          >
            Register
          </Button>
        </div>
      </div>
    </aside>

    <main class="flex-1 ml-64 p-6">
      <slot />
    </main>
  </div>
</template>
