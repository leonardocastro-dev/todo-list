<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus,
  Trash2,
  CheckCircle2,
  Edit3,
  Filter,
  Sparkles
} from 'lucide-vue-next'

const features = [
  {
    icon: Plus,
    title: 'Create Tasks',
    description: 'Add new tasks quickly with just a few clicks. Simple and intuitive interface.'
  },
  {
    icon: Edit3,
    title: 'Edit Tasks',
    description: 'Modify your tasks easily. Update titles, descriptions, and deadlines whenever needed.'
  },
  {
    icon: CheckCircle2,
    title: 'Task Status',
    description: 'Mark tasks as pending or completed. Track your progress visually.'
  },
  {
    icon: Trash2,
    title: 'Delete Tasks',
    description: 'Remove completed or unnecessary tasks to keep your workspace organized.'
  },
  {
    icon: Filter,
    title: 'Smart Filters',
    description: 'Filter tasks by status: all, pending, or completed. Find what you need quickly.'
  },
  {
    icon: Sparkles,
    title: 'Intuitive Interface',
    description: 'Clean and modern design that makes managing your daily tasks easy.'
  }
]
</script>

<template>
  <section id="features" class="py-20 md:py-32 bg-background">
    <div class="container mx-auto px-4 md:px-6">
      <!-- Section Header -->
      <div class="text-center space-y-4 mb-16 animate-fade-in">
        <h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Powerful Features
        </h2>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to manage your tasks efficiently and productively
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="(feature, index) in features"
          :key="index"
          class="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-fade-in-up"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <CardContent class="p-6 space-y-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary group-hover:scale-110 transition-transform">
              <component :is="feature.icon" class="h-7 w-7 text-primary-foreground" />
            </div>
            <div class="space-y-2">
              <h3 class="text-xl font-semibold text-foreground">
                {{ feature.title }}
              </h3>
              <p class="text-muted-foreground">
                {{ feature.description }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>
