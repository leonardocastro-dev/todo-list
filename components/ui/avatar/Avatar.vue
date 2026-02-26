<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, provide } from 'vue'
import { AvatarRoot } from 'reka-ui'
import { cn } from '@/lib/utils'
const props = defineProps<{
  class?: HTMLAttributes['class']
  uid?: string
}>()

provide(
  'avatarUid',
  computed(() => props.uid)
)
</script>

<template>
  <AvatarRoot
    data-slot="avatar"
    :class="
      cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full bg-input',
        props.class
      )
    "
  >
    <slot />
  </AvatarRoot>
</template>
