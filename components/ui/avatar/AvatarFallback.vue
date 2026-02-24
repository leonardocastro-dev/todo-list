<script setup lang="ts">
import type { AvatarFallbackProps } from 'reka-ui'
import type { ComputedRef, HTMLAttributes } from 'vue'
import { computed, inject } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AvatarFallback } from 'reka-ui'
import { cn } from '@/lib/utils'
import { getAvatarColor } from '@/utils/avatarColor'

const props = defineProps<
  AvatarFallbackProps & { class?: HTMLAttributes['class'] }
>()

const delegatedProps = reactiveOmit(props, 'class')

const avatarUid = inject<ComputedRef<string | undefined>>(
  'avatarUid',
  computed(() => undefined)
)
const colorClass = computed(() =>
  avatarUid.value ? getAvatarColor(avatarUid.value) : 'bg-muted'
)
</script>

<template>
  <AvatarFallback
    data-slot="avatar-fallback"
    v-bind="delegatedProps"
    :class="
      cn(
        'flex size-full items-center justify-center rounded-full',
        colorClass,
        avatarUid ? 'text-white' : '',
        props.class
      )
    "
  >
    <slot />
  </AvatarFallback>
</template>
