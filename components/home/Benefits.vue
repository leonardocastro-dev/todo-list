<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import {
  Zap,
  Target,
  Smile
} from 'lucide-vue-next'

const benefits = [
  {
    icon: Zap,
    title: 'Maximum Productivity',
    description: 'Organize your tasks efficiently and increase your productivity by up to 3x. Less time planning, more time executing.',
    gradient: 'from-accent to-primary'
  },
  {
    icon: Target,
    title: 'Complete Organization',
    description: 'Keep all your tasks in one place. Visualize, prioritize, and manage everything without complications.',
    gradient: 'from-primary to-primary-glow'
  },
  {
    icon: Smile,
    title: 'Simplicity',
    description: 'Intuitive and easy-to-use interface. Start using it in seconds with no learning curve. Simplicity that works.',
    gradient: 'from-primary-glow to-accent'
  }
]
</script>

<template>
  <section id="about" class="py-20 md:py-32 bg-gradient-subtle">
    <div class="container mx-auto px-4 md:px-6">
      <!-- Section Header -->
      <div class="text-center space-y-4 mb-16 animate-fade-in">
        <h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Why use
          <span class="bg-gradient-primary bg-clip-text text-transparent">
            Fokuz
          </span>
          ?
        </h2>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          The perfect solution for those seeking productivity, organization, and simplicity
        </p>
      </div>

      <!-- Benefits Grid -->
      <div class="grid gap-8 md:grid-cols-3">
        <Card
          v-for="(benefit, index) in benefits"
          :key="index"
          class="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group animate-scale-in"
          :style="{ animationDelay: `${index * 0.15}s` }"
        >
          <div :class="`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${benefit.gradient}`"></div>

          <CardContent class="p-8 space-y-4">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary group-hover:scale-110 transition-transform">
              <component :is="benefit.icon" class="h-8 w-8 text-primary-foreground" />
            </div>

            <div class="space-y-3">
              <h3 class="text-2xl font-bold text-foreground">
                {{ benefit.title }}
              </h3>
              <p class="text-muted-foreground leading-relaxed">
                {{ benefit.description }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Additional Info -->
      <div class="mt-16 text-center animate-fade-in-up">
        <div class="inline-flex items-center justify-center rounded-full bg-primary/10 px-6 py-3">
          <span class="text-sm font-medium text-primary">
            ✨ Thousands of users already trust Fokuz
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
