<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-vue-next'

const mobileMenuOpen = ref(false)

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '#features' },
  { name: 'About', href: '#about' },
  { name: 'Contact', href: '#contact' }
]
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
      <!-- Logo -->
      <NuxtLink to="#home" class="flex items-center space-x-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
          <span class="text-xl font-bold text-primary-foreground">FK</span>
        </div>
        <span class="text-xl font-bold text-foreground">Fokuz</span>
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center space-x-8">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.name"
          :to="link.href"
          class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {{ link.name }}
        </NuxtLink>
      </nav>

      <!-- Auth Buttons -->
      <div class="hidden md:flex items-center space-x-4">
        <NuxtLink to="/login">
          <Button variant="ghost" size="sm">
            Login
          </Button>
        </NuxtLink>
        <div class="rounded-lg">
          <NuxtLink to="/register">
            <Button
              variant="default"
              size="sm"
              class="rounded-r-none h-9 px-4"
            >
              Register
            </Button>
          </NuxtLink>
          <NuxtLink to="/dashboard">
            <Button
              variant="outline"
              size="sm"
              class="rounded-l-none h-9 px-4"
            >
              Guest
            </Button>
          </NuxtLink>
        </div>
      </div>

      <!-- Mobile Menu Button -->
      <button
        class="md:hidden text-foreground"
        @click="mobileMenuOpen = !mobileMenuOpen"
        aria-label="Toggle menu"
      >
        <Menu class="h-6 w-6" />
      </button>
    </div>

    <!-- Mobile Menu -->
    <div v-if="mobileMenuOpen" class="md:hidden border-t border-border bg-background animate-fade-in">
      <nav class="container mx-auto flex flex-col space-y-4 px-4 py-6">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.name"
          :to="link.href"
          class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          @click="mobileMenuOpen = false"
        >
          {{ link.name }}
        </NuxtLink>
        <div class="flex flex-col space-y-2 pt-4 border-t border-border">
          <NuxtLink to="/login">
            <Button variant="ghost" size="sm" class="w-full">
              Login
            </Button>
          </NuxtLink>
          <div class="flex items-center border border-border rounded-lg overflow-hidden divide-x divide-border group">
            <NuxtLink to="/register" class="flex-1">
              <Button
                variant="default"
                size="sm"
                class="rounded-none w-full"
              >
                Register
              </Button>
            </NuxtLink>
            <NuxtLink to="/dashboard" class="flex-1">
              <Button
                variant="ghost"
                size="sm"
                class="rounded-none w-full"
              >
                Guest
              </Button>
            </NuxtLink>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>
