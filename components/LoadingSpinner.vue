<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-background"
  >
    <div class="flex flex-col items-center gap-4">
      <Loader2 class="h-12 w-12 animate-spin text-primary" />
      <p class="text-muted-foreground">Loading...</p>
    </div>
  </div>
</template>
