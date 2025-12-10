<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <NuxtLayout>
    <ClientOnly>
      <Toaster />
    </ClientOnly>
    <NuxtPage />
  </NuxtLayout>
</template>
