<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FolderOpen } from 'lucide-vue-next'

export interface NestedItem {
  id: string
  name: string
  children?: NestedItem[]
}

const props = defineProps<{
  items: NestedItem[]
  modelValue: Record<string, boolean>
  disabled?: boolean
  level?: number
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, boolean>]
}>()

const level = computed(() => props.level ?? 0)

// Get all descendant IDs of an item (including nested children)
const getAllDescendantIds = (item: NestedItem): string[] => {
  const ids: string[] = []
  if (item.children) {
    for (const child of item.children) {
      ids.push(child.id)
      ids.push(...getAllDescendantIds(child))
    }
  }
  return ids
}

// Check if all children of an item are checked
const areAllChildrenChecked = (item: NestedItem): boolean => {
  if (!item.children || item.children.length === 0) return false
  return item.children.every((child) => {
    const isChecked = props.modelValue[child.id]
    if (child.children && child.children.length > 0) {
      return isChecked && areAllChildrenChecked(child)
    }
    return isChecked
  })
}

// Check if some (but not all) children are checked
const areSomeChildrenChecked = (item: NestedItem): boolean => {
  if (!item.children || item.children.length === 0) return false
  const allIds = getAllDescendantIds(item)
  const checkedCount = allIds.filter((id) => props.modelValue[id]).length
  return checkedCount > 0 && checkedCount < allIds.length
}

// Get the checked state for an item
const getItemState = (item: NestedItem): boolean | 'indeterminate' => {
  // If no children, just return the item's value
  if (!item.children || item.children.length === 0) {
    return props.modelValue[item.id] ?? false
  }

  // If has children, calculate based on children states
  if (areAllChildrenChecked(item)) {
    return true
  }

  if (areSomeChildrenChecked(item)) {
    return 'indeterminate'
  }

  return false
}

// Handle checkbox change
const handleChange = (item: NestedItem, value: boolean | 'indeterminate') => {
  const isChecked = value === true
  const newValue = { ...props.modelValue }

  // Set the item's value
  newValue[item.id] = isChecked

  // If item has children, set all descendants to the same value
  if (item.children && item.children.length > 0) {
    const descendantIds = getAllDescendantIds(item)
    for (const id of descendantIds) {
      newValue[id] = isChecked
    }
  }

  emit('update:modelValue', newValue)
}

// Handle child updates and propagate to parent
const handleChildUpdate = (newValue: Record<string, boolean>) => {
  emit('update:modelValue', newValue)
}
</script>

<template>
  <div :class="['space-y-2', level > 0 ? 'pl-6' : '']">
    <template v-for="(item, index) in items" :key="item.id">
      <!-- Separator between root items -->
      <hr v-if="level === 0 && index > 0" class="my-4" />

      <div :class="cn('space-y-2', props.class)">
        <!-- Item Checkbox -->
        <div class="flex items-center space-x-2">
          <Checkbox
            :id="`nested-${item.id}`"
            :model-value="getItemState(item)"
            :disabled="disabled"
            @update:model-value="(val) => handleChange(item, val)"
          />
          <Label
            :for="`nested-${item.id}`"
            class="flex items-center gap-2 cursor-pointer"
          >
            <FolderOpen
              v-if="level === 0 && item.children && item.children.length > 0"
              class="h-4 w-4 text-muted-foreground"
            />
            {{ item.name }}
          </Label>
        </div>

        <!-- Nested Children (Recursive) -->
        <NestedCheckboxes
          v-if="item.children && item.children.length > 0"
          :items="item.children"
          :model-value="modelValue"
          :disabled="disabled"
          :level="level + 1"
          @update:model-value="handleChildUpdate"
        />
      </div>
    </template>
  </div>
</template>
