<template>
  <div class="app-layout" :class="{ 'app-layout--immersive': isImmersiveRoute }">
    <header
      v-if="!isImmersiveRoute"
      class="app-layout__header"
    >
      <div class="app-layout__brand" @click="goTo('books')">
        <div class="app-layout__logo-ring">
          <img class="app-layout__logo" src="/icon-192.png" alt="初华的书" />
        </div>
        <div class="app-layout__brand-text">
          <div class="app-layout__title">
            <span>初华的书</span>
            <span class="app-layout__star" aria-hidden="true">✦</span>
          </div>
          <span class="app-layout__subtitle">Uika Light Reader</span>
        </div>
      </div>

      <nav class="app-layout__nav" aria-label="主导航">
        <button
          class="app-layout__nav-link"
          :class="{ 'app-layout__nav-link--active': route.name === 'books' || route.name === 'book-detail' }"
          @click="goTo('books')"
        >
          <span v-if="route.name === 'books' || route.name === 'book-detail'" class="app-layout__nav-sparkle" aria-hidden="true">✦</span>
          <span>书架</span>
        </button>
        <button
          class="app-layout__nav-link"
          :class="{ 'app-layout__nav-link--active': route.name === 'rules' }"
          @click="goTo('rules')"
        >
          <span v-if="route.name === 'rules'" class="app-layout__nav-sparkle" aria-hidden="true">✦</span>
          <span>目录规则</span>
        </button>
      </nav>

      <div class="app-layout__side">
        <button
          class="app-layout__theme-toggle"
          :title="themeToggleLabel"
          :aria-label="themeToggleLabel"
          @click="handleToggleTheme"
        >
          <Sun v-if="appThemeStore.theme === 'dark'" :size="17" />
          <Moon v-else :size="17" />
        </button>

        <div ref="userMenuRef" class="app-layout__user">
          <div class="app-layout__user-trigger" @click="userMenuOpen = !userMenuOpen">
            <img class="app-layout__user-avatar" src="/icon-192.png" alt="" aria-hidden="true" />
            <div class="app-layout__user-meta">
              <span class="app-layout__username">{{ authStore.user?.username }}</span>
            </div>
            <svg
              class="app-layout__user-chevron"
              :class="{ 'app-layout__user-chevron--open': userMenuOpen }"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <div v-show="userMenuOpen" class="app-layout__user-menu">
            <button
              class="app-layout__user-menu-item"
              @click="passwordModalVisible = true; userMenuOpen = false"
            >
              更改密码
            </button>
            <button
              class="app-layout__user-menu-item app-layout__user-menu-item--danger"
              @click="handleLogout"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="app-layout__content" :class="{ 'app-layout__content--immersive': isImmersiveRoute }">
      <router-view />
    </main>

    <!-- Change Password Dialog -->
    <Dialog :open="passwordModalVisible" @update:open="passwordModalVisible = $event">
      <DialogContent class="password-modal max-w-md">
        <div class="password-modal__title">更改密码</div>
        <div class="password-modal__fields">
          <div class="password-modal__field">
            <span>当前密码</span>
            <Input
              v-model="passwordForm.oldPassword"
              type="password"
              placeholder="输入当前密码"
            />
          </div>
          <div class="password-modal__field">
            <span>新密码</span>
            <Input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="至少6位"
            />
          </div>
          <div class="password-modal__field">
            <span>确认新密码</span>
            <Input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="再次输入新密码"
            />
          </div>
        </div>
        <div class="password-modal__actions">
          <Button variant="ghost" @click="passwordModalVisible = false">取消</Button>
          <Button :disabled="passwordPending" @click="handleChangePassword">
            {{ passwordPending ? "保存中..." : "保存" }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { onClickOutside } from "@vueuse/core";
import { Moon, Sun } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "../stores/auth";
import { useAppThemeStore } from "../stores/app-theme";
import { usePreferencesStore } from "../stores/preferences";
import { authApi } from "../api/auth";
import { notify } from "../utils/notify";
import { getErrorMessage } from "../api/client";

const authStore = useAuthStore();
const appThemeStore = useAppThemeStore();
const preferencesStore = usePreferencesStore();
const route = useRoute();
const router = useRouter();
const isImmersiveRoute = computed(() => route.meta.immersive === true);
const themeToggleLabel = computed(() => (appThemeStore.theme === "dark" ? "日间模式" : "夜间模式"));

const userMenuOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);
onClickOutside(userMenuRef, () => {
  userMenuOpen.value = false;
});

const passwordModalVisible = ref(false);
const passwordForm = ref({ oldPassword: "", newPassword: "", confirmPassword: "" });
const passwordPending = ref(false);

function goTo(name: "books" | "rules") {
  void router.push({ name });
}

function handleLogout() {
  userMenuOpen.value = false;
  authStore.logout();
  void router.push({ name: "login" });
}

function handleToggleTheme() {
  const nextTheme = appThemeStore.theme === "dark" ? "light" : "dark";
  appThemeStore.setTheme(nextTheme, true);

  if (preferencesStore.initialized) {
    preferencesStore.patchReader({ theme: nextTheme }, 0);
    return;
  }

  void preferencesStore.ensureReady().then(() => {
    preferencesStore.patchReader({ theme: nextTheme }, 0);
  }).catch(() => {
    // 全局主题已经本地生效，这里只是不让 reader 偏好同步失败打断交互。
  });
}

async function handleChangePassword() {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    notify.error("请填写完整信息");
    return;
  }
  if (passwordForm.value.newPassword.length < 6) {
    notify.error("新密码至少需要6位");
    return;
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    notify.error("两次输入的新密码不一致");
    return;
  }

  passwordPending.value = true;
  try {
    await authApi.changePassword({
      old_password: passwordForm.value.oldPassword,
      new_password: passwordForm.value.newPassword,
    });
    notify.success("密码已更改，请重新登录");
    passwordModalVisible.value = false;
    passwordForm.value = { oldPassword: "", newPassword: "", confirmPassword: "" };
    authStore.logout();
    void router.push({ name: "login" });
  } catch (error) {
    notify.error(getErrorMessage(error));
  } finally {
    passwordPending.value = false;
  }
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: transparent;
}

.app-layout__header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  padding: 12px 28px;
  backdrop-filter: blur(18px);
  background: var(--surface-header-bg);
  border-bottom: 1px solid var(--border-color-soft);
  box-shadow: 0 4px 24px -6px rgba(96, 68, 198, 0.08);
}

.app-layout__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.app-layout__logo-ring {
  padding: 2px;
  border-radius: 13px;
  background: var(--brand-gradient);
  box-shadow: 0 4px 12px var(--primary-soft);
}

.app-layout__logo {
  display: block;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  object-fit: cover;
}

.app-layout__brand-text {
  display: grid;
  gap: 1px;
}

.app-layout__title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.app-layout__star {
  color: var(--accent-color);
  font-size: 13px;
}

.app-layout__subtitle {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.app-layout__nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border: 1px solid var(--border-color-soft);
  border-radius: 999px;
  background: var(--surface-panel-soft-bg);
  min-width: 0;
}

.app-layout__nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 180ms ease;
}

.app-layout__nav-link:hover {
  color: var(--text-primary);
}

.app-layout__nav-link--active {
  color: var(--primary-color);
  background: var(--surface-tab-active-bg);
  border-color: var(--surface-tab-active-border);
  box-shadow: 0 4px 12px var(--primary-soft);
  font-weight: 700;
}

.app-layout__nav-sparkle {
  color: var(--accent-color);
  font-size: 11px;
}

.app-layout__side {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-layout__theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--border-color-soft);
  border-radius: 999px;
  background: var(--surface-card-bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 180ms ease;
}

.app-layout__theme-toggle:hover {
  color: var(--primary-color);
  background: var(--surface-panel-soft-bg);
  border-color: var(--border-color);
  transform: translateY(-1px);
}

.app-layout__user {
  position: relative;
  display: flex;
  align-items: center;
}

.app-layout__user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 11px 5px 6px;
  border: 1px solid var(--border-color-soft);
  border-radius: 999px;
  background: var(--surface-card-bg);
  cursor: pointer;
  transition: all 180ms ease;
}

.app-layout__user-trigger:hover {
  border-color: var(--border-color);
  background: var(--surface-panel-soft-bg);
}

.app-layout__user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-gold);
}

.app-layout__user-meta {
  display: flex;
  align-items: center;
}

.app-layout__user-chevron {
  color: var(--text-secondary);
  transition: transform 200ms ease;
  flex-shrink: 0;
}

.app-layout__user-chevron--open {
  transform: rotate(180deg);
}

.app-layout__user-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 30;
  min-width: 150px;
  padding: 6px;
  border-radius: var(--radius-md);
  background: var(--dialog-bg);
  backdrop-filter: blur(18px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-modal);
  display: grid;
  gap: 2px;
}

.app-layout__user-menu-item {
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  text-align: left;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 140ms ease;
}

.app-layout__user-menu-item:hover {
  background: var(--surface-panel-soft-bg);
}

.app-layout__user-menu-item--danger {
  color: #f43f5e;
}

.app-layout__user-menu-item--danger:hover {
  background: rgba(244, 63, 94, 0.1);
}

.app-layout__content {
  max-width: 1360px;
  margin: 0 auto;
  padding: 28px;
}

.app-layout__content--immersive {
  max-width: none;
  margin: 0;
  padding: 0;
}

.app-layout__username {
  max-width: min(220px, 38vw);
  overflow: hidden;
  color: var(--text-primary);
  font-size: 13.5px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.password-modal {
  border-radius: var(--radius-xl);
}

.password-modal__title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 20px;
}

.password-modal__fields {
  display: grid;
  gap: 14px;
  margin-bottom: 24px;
}

.password-modal__field {
  display: grid;
  gap: 6px;
}

.password-modal__field span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.password-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 780px) {
  .app-layout__header {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas: "brand user" "nav nav";
    gap: 10px 16px;
    align-items: center;
    padding: 10px 16px;
  }

  .app-layout__brand {
    grid-area: brand;
  }

  .app-layout__nav {
    grid-area: nav;
    justify-content: center;
    width: 100%;
  }

  .app-layout__nav-link {
    flex: 1;
    justify-content: center;
  }

  .app-layout__side {
    grid-area: user;
    justify-self: end;
    align-self: center;
    width: auto;
  }

  .app-layout__username {
    max-width: 110px;
    font-size: 13px;
  }

  .app-layout__content {
    padding: 16px;
  }

  .app-layout__content--immersive {
    padding: 0;
  }
}
</style>
