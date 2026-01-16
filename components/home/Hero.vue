<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-vue-next'
</script>

<template>
  <section
    id="home"
    class="relative overflow-hidden bg-gradient-subtle py-20 md:py-32"
  >
    <div class="container mx-auto px-4 md:px-6">
      <div class="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
        <div class="flex flex-col space-y-8 animate-fade-in">
          <div class="space-y-4">
            <h1
              class="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Organize your tasks with
              <span class="bg-gradient-primary bg-clip-text text-transparent">
                efficiency
              </span>
            </h1>
            <p class="text-lg text-muted-foreground md:text-xl max-w-2xl">
              Manage your day without complications. Fokuz is the simplest and
              most intuitive way to organize your tasks and boost your
              productivity.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              class="bg-gradient-primary shadow-lg hover:shadow-glow transition-all text-base group"
            >
              Get Started
              <ArrowRight
                class="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
              />
            </Button>
            <Button
              size="lg"
              variant="outline"
              class="text-base border-2 hover:bg-secondary"
            >
              Learn More
            </Button>
          </div>

          <div class="flex flex-wrap gap-8 pt-4">
            <div>
              <div class="text-3xl font-bold text-foreground">10k+</div>
              <div class="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-foreground">50k+</div>
              <div class="text-sm text-muted-foreground">Tasks Completed</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-foreground">99%</div>
              <div class="text-sm text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </div>
        <img src="@/images/gato.png" alt="Fokuz Dashboard" class="w-40" />
      </div>
    </div>
  </section>
</template>
