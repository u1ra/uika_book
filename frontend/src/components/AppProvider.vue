<template>
  <div class="app-provider">
    <slot />
    <AppNotificationDialog />
  </div>
</template>

<script setup lang="ts">
import AppNotificationDialog from "@/components/AppNotificationDialog.vue";
</script>
