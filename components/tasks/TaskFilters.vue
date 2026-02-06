<script setup lang="ts">
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
        class="w-full"
        @update:model-value="
          (val) => taskStore.setSearchQuery(String(val || ''))
        "
      />
    </div>

    <div class="flex flex-wrap gap-4">
      <div class="w-full md:flex-1">
        <Label for="status-filter" class="mb-1 block text-sm font-medium"
          >Status</Label
        >
        <Tabs
          :model-value="taskStore.statusFilter"
          class="w-full"
          @update:model-value="
            (val) => taskStore.setStatusFilter(String(val || 'all'))
          "
        >
          <TabsList class="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div>
        <Label for="priority-filter" class="mb-1 block text-sm font-medium"
          >Priority</Label
        >
        <Select
          :model-value="taskStore.priorityFilter"
          @update:model-value="
            (val) => taskStore.setPriorityFilter(String(val || 'all'))
          "
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

      <div>
        <Label for="due-date-filter" class="mb-1 block text-sm font-medium"
          >Due Date</Label
        >
        <Select
          :model-value="taskStore.dueDateFilter"
          @update:model-value="
            (val) => taskStore.setDueDateFilter(String(val || 'all'))
          "
        >
          <SelectTrigger id="due-date-filter">
            <SelectValue placeholder="All Dates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="on-time">On Time</SelectItem>
            <SelectItem value="no-date">No Date</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>
