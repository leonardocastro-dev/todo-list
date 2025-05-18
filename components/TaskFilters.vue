<script setup lang="ts">
import { useTaskStore } from '@/store'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const taskStore = useTaskStore()
</script>

<template>
  <div class="space-y-4 mb-6">
    <div>
      <Label for="search" class="sr-only">Search tasks</Label>
      <Input
        id="search"
        type="text"
        placeholder="Search tasks..."
        :model-value="taskStore.searchQuery"
        @update:model-value="taskStore.setSearchQuery"
        class="w-full"
      />
    </div>

    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <Label for="status-filter" class="mb-1 block text-sm font-medium"
          >Status</Label
        >
        <Tabs
          :model-value="taskStore.statusFilter"
          @update:model-value="taskStore.setStatusFilter"
          class="w-full"
        >
          <TabsList class="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div class="w-full sm:w-40">
        <Label for="priority-filter" class="mb-1 block text-sm font-medium"
          >Priority</Label
        >
        <Select
          :model-value="taskStore.priorityFilter"
          @update:model-value="taskStore.setPriorityFilter"
        >
          <SelectTrigger id="priority-filter">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="important">Important</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>
