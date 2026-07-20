<template>
  <div class="login-page">
    <main class="login-page__panel">
      <section class="login-page__intro">
        <div class="login-page__eyebrow">初华的书</div>
        <h1 class="login-page__title">
          <span>把喜欢的故事，</span>
          <span>留在自己的书架里。</span>
        </h1>
        <p class="login-page__description">
          上传 TXT，整理章节，安静地读下去。阅读位置会自动保存，下次打开时可以接着上次停下的地方继续。
        </p>

        <ul class="login-page__feature-list" aria-label="阅读器主要功能">
          <li class="login-page__feature-item">
            <strong>TXT 私人书架</strong>
            <span>上传、整理和查找自己的本地书籍</span>
          </li>
          <li class="login-page__feature-item">
            <strong>章节目录</strong>
            <span>自动识别章节，也支持自定义目录规则</span>
          </li>
          <li class="login-page__feature-item">
            <strong>阅读进度</strong>
            <span>按章节和阅读位置保存，下次打开继续阅读</span>
          </li>
        </ul>
      </section>

      <section class="login-page__form">
        <div class="login-page__form-header">
          <h2 class="login-page__form-title">登录</h2>
          <p class="login-page__form-subtitle">{{ redirectHint }}</p>
        </div>

        <Alert v-if="authStore.errorMessage" variant="destructive">
          {{ authStore.errorMessage }}
        </Alert>

        <form class="login-page__form-fields" @submit.prevent="handleLogin">
          <div class="login-page__field">
            <label class="login-page__label" for="login-username">用户名</label>
            <Input
              id="login-username"
              v-model="form.username"
              placeholder="请输入用户名"
              :disabled="authStore.loginPending"
              @update:model-value="clearError"
            />
          </div>

          <div class="login-page__field">
            <label class="login-page__label" for="login-password">密码</label>
            <Input
              id="login-password"
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :disabled="authStore.loginPending"
              @update:model-value="clearError"
              @keydown.enter.prevent="handleLogin"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            class="login-page__submit"
            :disabled="authStore.loginPending"
          >
            {{ authStore.loginPending ? "登录中..." : "登录并进入书架" }}
          </Button>
        </form>

        <p class="login-page__footnote">
          如果后端未启动，登录页会直接提示连接失败，方便你区分“服务没开”和“账号密码错误”。
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { notify } from "@/utils/notify";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({
  username: "",
  password: "",
});

const redirectHint = computed(() => {
  if (typeof route.query.redirect === "string" && route.query.redirect !== "/books") {
    return "登录成功后会自动回到你刚才尝试访问的页面。";
  }

  return "输入账号即可进入书架，继续阅读。";
});

function clearError() {
  if (authStore.errorMessage) {
    authStore.setError(null);
  }
}

async function handleLogin() {
  clearError();

  if (!form.username.trim() || !form.password.trim()) {
    authStore.setError("请先输入用户名和密码。");
    return;
  }

  try {
    await authStore.login({
      username: form.username.trim(),
      password: form.password,
    });

    notify.success("登录成功");

    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/books";
    await router.push(redirect);
  } catch {}
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
}

.login-page__panel {
  width: min(960px, 100%);
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: clamp(32px, 6vw, 72px);
  align-items: center;
}

/* 品牌区：纯排版，无卡片 */
.login-page__intro {
  display: grid;
  gap: 20px;
  align-content: center;
}

.login-page__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 5px 12px;
  border: 1px solid var(--border-color-soft);
  border-radius: 999px;
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.login-page__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(34px, 4.5vw, 50px);
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.18;
  text-wrap: balance;
}

.login-page__title span {
  display: block;
}

.login-page__description {
  margin: 0;
  max-width: 42ch;
  color: var(--text-secondary);
  line-height: 1.9;
}

.login-page__feature-list {
  display: grid;
  gap: 0;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--border-color-soft);
}

.login-page__feature-item {
  display: grid;
  gap: 2px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color-soft);
}

.login-page__feature-item strong {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
}

.login-page__feature-item span {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

/* 登录表单：暖白软面板 */
.login-page__form {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 36px);
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-lg);
  background: var(--surface-color);
}

.login-page__form-header {
  display: grid;
  gap: 6px;
}

.login-page__form-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
}

.login-page__form-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.8;
}

.login-page__form-fields {
  display: grid;
  gap: 14px;
}

.login-page__field {
  display: grid;
  gap: 6px;
}

.login-page__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.login-page__submit {
  width: 100%;
  margin-top: 4px;
}

.login-page__footnote {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.7;
  opacity: 0.85;
}

@media (max-width: 860px) {
  .login-page {
    place-items: start center;
    padding: 40px 20px;
  }

  .login-page__panel {
    grid-template-columns: 1fr;
    gap: 36px;
    max-width: 460px;
  }
}
</style>
