<script setup lang="ts">
import { Search, Clock, Users, ChevronRight } from 'lucide-vue-next'
</script>

<template>
  <section class="py-20 md:py-32 bg-background overflow-hidden">
    <div class="container mx-auto px-4 md:px-6">
      <div class="text-center space-y-4 mb-14 reveal">
        <h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          See it in action
        </h2>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          A real look at the interface your team will actually use
        </p>
      </div>

      <!-- Browser chrome wrapper -->
      <div
        class="float-animation mx-auto max-w-4xl rounded-2xl border border-border shadow-2xl overflow-hidden"
        aria-hidden="true"
      >
        <!-- Title bar -->
        <div
          class="flex items-center gap-3 bg-muted/60 px-4 py-3 border-b border-border"
        >
          <div class="flex gap-1.5">
            <div class="h-3 w-3 rounded-full bg-red-400" />
            <div class="h-3 w-3 rounded-full bg-yellow-400" />
            <div class="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div
            class="flex-1 bg-background/80 rounded-md px-3 py-1 text-xs text-muted-foreground text-center mx-8"
          >
            fokuz.app/my-workspace/projects/frontend
          </div>
        </div>

        <!-- App layout -->
        <div class="flex h-[420px] bg-background">
          <!-- Sidebar -->
          <div
            class="w-52 flex-shrink-0 border-r border-border bg-background flex flex-col"
          >
            <!-- Logo + workspace -->
            <div class="p-4 pb-3">
              <div class="flex items-center gap-2">
                <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary shrink-0">
                  <span class="text-xs font-bold text-primary-foreground">FK</span>
                </div>
                <span class="font-bold text-sm text-foreground">Fokuz</span>
              </div>
              <div class="mt-3 px-1">
                <p class="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Workspace</p>
                <p class="text-xs font-semibold text-foreground mt-0.5">Acme Corp</p>
              </div>
            </div>

            <!-- Nav -->
            <nav class="flex flex-col flex-1 gap-1 px-2 py-1">
              <div class="flex items-center px-3 py-1.5 text-xs font-medium text-muted-foreground rounded-md">
                Tasks
              </div>

              <!-- Projects with chevron (expanded) -->
              <div>
                <div class="flex items-center justify-between px-3 py-1.5 text-xs font-medium text-primary bg-accent rounded-md">
                  <span>Projects</span>
                  <div class="rounded p-0.5">
                    <ChevronRight class="h-3.5 w-3.5 rotate-90" />
                  </div>
                </div>
                <div class="mt-0.5 flex flex-col gap-0.5 pl-3">
                  <div class="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md text-primary bg-accent font-medium">
                    <span class="leading-none">💻</span>
                    <span>Frontend</span>
                  </div>
                  <div class="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md text-muted-foreground">
                    <span class="leading-none">🔧</span>
                    <span>Backend</span>
                  </div>
                  <div class="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md text-muted-foreground">
                    <span class="leading-none">🎨</span>
                    <span>Design</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center px-3 py-1.5 text-xs font-medium text-muted-foreground rounded-md">
                Members
              </div>

              <div class="border-t border-border my-1" />

              <div class="flex items-center px-3 py-1.5 text-xs font-medium text-muted-foreground rounded-md">
                Workspaces
              </div>
              <div class="flex items-center px-3 py-1.5 text-xs font-medium text-muted-foreground rounded-md">
                Settings
              </div>
            </nav>

            <!-- User -->
            <div class="p-3 border-t border-border">
              <p class="text-xs text-muted-foreground truncate px-1">john@acme.com</p>
            </div>
          </div>

          <!-- Main content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Filter bar -->
            <div class="flex items-center gap-2 border-b border-border px-4 py-3 flex-wrap">
              <div class="flex items-center gap-1.5 bg-muted rounded-md px-3 py-1.5 flex-1 max-w-56">
                <Search class="h-3.5 w-3.5 text-muted-foreground" />
                <span class="text-xs text-muted-foreground">Search tasks…</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground cursor-pointer">
                <Users class="h-3.5 w-3.5" />
                Members
              </div>
              <div class="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground cursor-pointer">
                Filters
              </div>
            </div>

            <!-- Stats -->
            <div class="flex items-center gap-4 px-4 py-3 border-b border-border text-sm">
              <span class="font-medium">All <span class="text-muted-foreground ml-1">8</span></span>
              <span class="text-muted-foreground">Pending <span class="ml-1">5</span></span>
              <span class="text-muted-foreground">Completed <span class="ml-1">3</span></span>
            </div>

            <!-- Task list -->
            <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
              <!-- Task 1: urgent + overdue -->
              <div class="rounded-lg border border-border bg-card p-3 flex items-start gap-3 hover:border-primary/40 transition-colors">
                <div class="mt-0.5 h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="text-sm font-medium">Fix auth token refresh bug</span>
                    <span class="priority-badge-urgent text-[10px] px-1.5 py-0.5 rounded font-semibold">Urgent</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="flex items-center gap-1 text-red-500 text-xs">
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

              <!-- Task 2: important + completed -->
              <div class="rounded-lg border border-border bg-card p-3 flex items-start gap-3">
                <div class="mt-0.5 h-4 w-4 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                  <svg class="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="text-sm font-medium line-through text-muted-foreground opacity-70">Design new onboarding flow</span>
                    <span class="priority-badge-important text-[10px] px-1.5 py-0.5 rounded font-semibold">Important</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock class="h-3.5 w-3.5" />
                      Due Feb 20
                    </span>
                    <div class="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-background">C</div>
                  </div>
                </div>
              </div>

              <!-- Task 3: normal -->
              <div class="rounded-lg border border-border bg-card p-3 flex items-start gap-3 hover:border-primary/40 transition-colors">
                <div class="mt-0.5 h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="text-sm font-medium">Update README documentation</span>
                    <span class="priority-badge-normal text-[10px] px-1.5 py-0.5 rounded font-semibold">Normal</span>
                  </div>
                  <span class="flex items-center gap-1 text-muted-foreground text-xs">
                    <Clock class="h-3.5 w-3.5" />
                    Due Mar 1
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
