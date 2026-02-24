<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock } from 'lucide-vue-next'
</script>

<template>
  <section
    id="home"
    class="relative overflow-hidden bg-gradient-subtle py-20 md:py-28"
  >
    <div class="container mx-auto px-4 md:px-6">
      <div class="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
        <!-- Left: copy -->
        <div class="flex flex-col space-y-8 animate-fade-in">
          <div class="space-y-4">
            <h1
              class="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Your team's work,
              <span class="bg-gradient-primary bg-clip-text text-transparent">
                finally in focus.
              </span>
            </h1>
            <p class="text-lg text-muted-foreground md:text-xl max-w-2xl">
              Fokuz is a workspace-based task management system built for teams.
              Three-tier hierarchy, server-enforced permissions, multi-assignee
              tasks, and advanced filtering — all in one place.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <NuxtLink to="/register">
              <Button
                size="lg"
                class="btn-glow bg-gradient-primary shadow-lg hover:shadow-glow transition-all text-base group"
              >
                Create free account
                <ArrowRight
                  class="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                />
              </Button>
            </NuxtLink>
            <NuxtLink to="/workspaces">
              <Button
                size="lg"
                variant="outline"
                class="text-base border-2 hover:bg-secondary"
              >
                Try as guest — no signup
              </Button>
            </NuxtLink>
          </div>

          <div class="flex flex-wrap gap-3 pt-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              Guest mode — no signup required
            </span>
            <span
              class="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              Roles &amp; permissions built-in
            </span>
            <span
              class="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              Open source &amp; free
            </span>
          </div>
        </div>

        <!-- Right: task pill cluster (desktop only, mobile shown in ProductMockup) -->
        <div
          class="relative hidden lg:flex flex-col gap-3 lg:pl-8"
          aria-hidden="true"
        >
          <!-- Task pills -->
          <div
            class="rounded-xl border border-border bg-card p-4 shadow-md flex items-start gap-3 hover:border-primary/40 transition-colors"
          >
            <div class="mt-0.5 h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
            <div class="flex-1 space-y-1.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium">Fix auth token refresh</span>
                <span class="priority-badge-urgent text-[10px] px-1.5 py-0.5 rounded font-semibold">Urgent</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1 text-xs text-red-500">
                  <Clock class="h-3.5 w-3.5" />
                  Overdue Feb 18
                </span>
                <div class="flex -space-x-1.5">
                  <div class="h-6 w-6 rounded-full bg-gradient-primary flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-background">A</div>
                  <div class="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-background">B</div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-xl border border-border bg-card p-4 shadow-md flex items-start gap-3"
          >
            <div class="mt-0.5 h-4 w-4 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
              <svg class="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="flex-1 space-y-1.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium line-through text-muted-foreground opacity-70">Design new onboarding flow</span>
                <span class="priority-badge-important text-[10px] px-1.5 py-0.5 rounded font-semibold">Important</span>
              </div>
              <span class="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock class="h-3.5 w-3.5" />
                Due Feb 20
              </span>
            </div>
          </div>

          <div
            class="rounded-xl border border-border bg-card p-4 shadow-md flex items-start gap-3 hover:border-primary/40 transition-colors"
          >
            <div class="mt-0.5 h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
            <div class="flex-1 space-y-1.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium">Update API documentation</span>
                <span class="priority-badge-normal text-[10px] px-1.5 py-0.5 rounded font-semibold">Normal</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock class="h-3.5 w-3.5" />
                  Due Mar 1
                </span>
                <div class="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-background">C</div>
              </div>
            </div>
          </div>

          <!-- Decorative blur -->
          <div
            class="absolute -bottom-8 -right-8 h-48 w-48 rounded-full opacity-20"
            style="background: var(--gradient-primary); filter: blur(48px)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
