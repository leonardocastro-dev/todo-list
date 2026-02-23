<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-vue-next'

const mobileMenuOpen = ref(false)
const scrolled = ref(false)

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'How it works', href: '#how-it-works' },
  { name: 'Permissions', href: '#permissions' }
]

function onScroll() {
  scrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-50 w-full border-b transition-all duration-300',
      scrolled
        ? 'border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm'
        : 'border-transparent bg-transparent'
    ]"
  >
    <div
      class="container mx-auto flex h-16 items-center justify-between px-4 md:px-6"
    >
      <!-- Logo -->
      <NuxtLink to="#home">
        <img src="/logo-light.svg" alt="Fokuz" class="h-10" />
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center space-x-8">
        <a
          v-for="link in navLinks"
          :key="link.name"
          :href="link.href"
          class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {{ link.name }}
        </a>
      </nav>

      <!-- Auth Buttons -->
      <div class="hidden md:flex items-center space-x-4">
        <NuxtLink to="/login">
          <Button variant="ghost" size="sm"> Login </Button>
        </NuxtLink>
        <div class="rounded-lg">
          <NuxtLink to="/register">
            <Button variant="default" size="sm" class="rounded-r-none h-9 px-4">
              Register
            </Button>
          </NuxtLink>
          <NuxtLink to="/workspaces">
            <Button variant="outline" size="sm" class="rounded-l-none h-9 px-4">
              Guest
            </Button>
          </NuxtLink>
        </div>
      </div>

      <!-- Mobile Menu Button -->
      <button
        class="md:hidden text-foreground"
        aria-label="Toggle menu"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <Menu class="h-6 w-6" />
      </button>
    </div>

    <!-- Mobile Menu -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden border-t border-border bg-background animate-fade-in"
    >
      <nav class="container mx-auto flex flex-col space-y-4 px-4 py-6">
        <a
          v-for="link in navLinks"
          :key="link.name"
          :href="link.href"
          class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          @click="mobileMenuOpen = false"
        >
          {{ link.name }}
        </a>
        <div class="flex flex-col space-y-2 pt-4 border-t border-border">
          <NuxtLink to="/login">
            <Button variant="ghost" size="sm" class="w-full"> Login </Button>
          </NuxtLink>
          <div
            class="flex items-center border border-border rounded-lg overflow-hidden divide-x divide-border group"
          >
            <NuxtLink to="/register" class="flex-1">
              <Button variant="default" size="sm" class="rounded-none w-full">
                Register
              </Button>
            </NuxtLink>
            <NuxtLink to="/workspaces" class="flex-1">
              <Button variant="ghost" size="sm" class="rounded-none w-full">
                Guest
              </Button>
            </NuxtLink>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>
