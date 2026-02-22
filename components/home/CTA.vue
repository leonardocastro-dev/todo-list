<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-vue-next'
import { useScrollReveal } from '@/composables/useScrollReveal'

useScrollReveal()
</script>

<template>
  <section class="py-20 md:py-32 bg-background">
    <div class="container mx-auto px-4 md:px-6">
      <div
        class="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 md:p-16 lg:p-20 shadow-lg reveal"
      >
        <div
          class="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        />
        <div
          class="absolute bottom-0 left-0 -mb-8 -ml-8 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        />

        <div class="relative z-10 text-center space-y-8">
          <div class="space-y-4">
            <h2
              class="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
            >
              Ready to bring your team into focus?
            </h2>
            <p class="text-lg text-white/90 max-w-2xl mx-auto">
              Create a free account and start organising your team's work in
              minutes. Or jump straight in without signing up.
            </p>
          </div>

          <div
            class="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <NuxtLink to="/register">
              <Button
                size="lg"
                variant="secondary"
                class="text-base font-semibold px-8 group shadow-lg hover:shadow-xl transition-all"
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
                class="text-base font-semibold px-8 border-2 border-white text-white hover:bg-white hover:text-primary transition-all bg-transparent"
              >
                Try as guest — no signup
              </Button>
            </NuxtLink>
          </div>

          <div
            class="pt-8 flex flex-wrap justify-center gap-8 text-white/80 text-sm"
          >
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              100% Free
            </div>
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Open source
            </div>
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Guest mode, no signup
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
