<script setup lang="ts">
  import Hero from '@/components/home/Hero.vue'
  import Header from '@/components/home/Header.vue'
  import Features from '@/components/home/Features.vue';
  import Benefits from '@/components/home/Benefits.vue';
  import CTA from '@/components/home/CTA.vue';
  import Footer from '@/components/home/Footer.vue';
</script>

<template>
  <div className="flex min-h-screen flex-col">
    <Header />
    <main className="flex-1">
      <Hero />
      <Features />
      <Benefits />
      <CTA />
    </main>
    <Footer />
  </div>
</template>
