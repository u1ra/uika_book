<template>
  <app-provider>
    <div class="app-shell" :class="appThemeClass">
      <router-view />

      <transition name="boot-fade">
        <div v-if="authStore.isRestoringSession" class="boot-screen" aria-live="polite">
          <div class="boot-screen__panel">
            <div class="boot-screen__avatar-wrap">
              <span class="boot-screen__orbit" aria-hidden="true" />
              <img class="boot-screen__logo" src="/icon-192.png" alt="初华的书" />
            </div>
            <div class="boot-screen__badge">
              <span aria-hidden="true">✦</span>
              <span>UIKA LIBRARY</span>
            </div>
            <div class="boot-screen__title">正在恢复登录状态</div>
            <p class="boot-screen__description">正在确认你的账号信息与阅读入口，请稍候。</p>
          </div>
        </div>
      </transition>
    </div>
  </app-provider>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";

import AppProvider from "./components/AppProvider.vue";
import { useAuthStore } from "./stores/auth";
import { useAppThemeStore } from "./stores/app-theme";
import { usePreferencesStore } from "./stores/preferences";

const authStore = useAuthStore();
const route = useRoute();
const appThemeStore = useAppThemeStore();
const preferencesStore = usePreferencesStore();
const appThemeClass = computed(() => `app-theme--${appThemeStore.theme}`);

watch(
  () => preferencesStore.reader.theme,
  (theme, previousTheme) => {
    if (
      !preferencesStore.initialized ||
      route.name !== "reader" ||
      theme === previousTheme ||
      theme === appThemeStore.theme
    ) {
      return;
    }

    appThemeStore.setTheme(theme, true);
  },
);
</script>

<style scoped>
.app-shell {
  min-height: 100dvh;
}

.boot-screen {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--app-shell-color) 82%, transparent 18%);
  backdrop-filter: blur(18px);
}

.boot-screen__panel {
  width: min(420px, 100%);
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 38px 28px;
  border: 1px solid var(--border-color);
  border-radius: 28px;
  background: var(--surface-card-bg);
  box-shadow: var(--shadow-modal);
  text-align: center;
}

.boot-screen__avatar-wrap {
  position: relative;
  width: 78px;
  height: 78px;
  display: grid;
  place-items: center;
}

.boot-screen__orbit {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px dashed var(--border-color);
  border-top-color: var(--primary-color);
  border-right-color: var(--accent-color);
  animation: boot-orbit-spin 2.4s linear infinite;
}

@keyframes boot-orbit-spin {
  to {
    transform: rotate(360deg);
  }
}

.boot-screen__logo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-gold);
}

.boot-screen__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-color);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.boot-screen__badge span:first-child {
  color: var(--accent-color);
}

.boot-screen__title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
}

.boot-screen__description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.boot-fade-enter-active,
.boot-fade-leave-active {
  transition: opacity 180ms ease;
}

.boot-fade-enter-from,
.boot-fade-leave-to {
  opacity: 0;
}
</style>
