<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <ClientOnly>
    <Toaster />
  </ClientOnly>
  <NuxtPage />
</template>
