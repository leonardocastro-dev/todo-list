<script setup lang="ts">
import { Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Security', href: '#security' }
  ],
  company: [
    { name: 'About', href: '#about' },
    { name: 'Blog', href: '#blog' },
    { name: 'Careers', href: '#careers' }
  ],
  support: [
    { name: 'Help Center', href: '#help' },
    { name: 'Contact', href: '#contact' },
    { name: 'Documentation', href: '#docs' }
  ]
}

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Github, href: '#', label: 'GitHub' }
]
</script>

<template>
  <footer id="contact" class="border-t border-border bg-background">
    <div class="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        <!-- Brand -->
        <div class="lg:col-span-2 space-y-4">
          <NuxtLink to="/" class="flex items-center space-x-2">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary"
            >
              <span class="text-xl font-bold text-primary-foreground">FK</span>
            </div>
            <span class="text-xl font-bold text-foreground">Fokuz</span>
          </NuxtLink>
          <p class="text-sm text-muted-foreground max-w-sm">
            The simplest and most intuitive way to manage your tasks and boost
            your productivity.
          </p>
          <!-- Social Links -->
          <div class="flex space-x-4">
            <a
              v-for="social in socialLinks"
              :key="social.label"
              :href="social.href"
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              :aria-label="social.label"
            >
              <component :is="social.icon" class="h-5 w-5" />
            </a>
          </div>
        </div>

        <!-- Links Columns -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-foreground">Product</h3>
          <ul class="space-y-2">
            <li v-for="link in footerLinks.product" :key="link.name">
              <a
                :href="link.href"
                class="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>

        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-foreground">Company</h3>
          <ul class="space-y-2">
            <li v-for="link in footerLinks.company" :key="link.name">
              <a
                :href="link.href"
                class="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>

        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-foreground">Support</h3>
          <ul class="space-y-2">
            <li v-for="link in footerLinks.support" :key="link.name">
              <a
                :href="link.href"
                class="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div
        class="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4"
      >
        <p class="text-sm text-muted-foreground">
          © {{ currentYear }} Fokuz. All rights reserved.
        </p>
        <div class="flex gap-6">
          <a
            href="#privacy"
            class="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#terms"
            class="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
