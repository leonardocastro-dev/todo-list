<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

definePageMeta({
  layout: 'dashboard'
})

const { loading } = useAuth()
</script>

<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>

  <NuxtPage v-else />
</template>
