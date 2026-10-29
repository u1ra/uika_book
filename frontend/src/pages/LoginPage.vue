<template>
  <div class="login-page">
    <main class="login-page__panel">
      <section class="login-page__intro">
        <div class="login-page__character-card">
          <div class="login-page__portrait-ring">
            <img class="login-page__portrait" src="/icon-source.png" alt="初华的书" />
          </div>
          <div class="login-page__character-meta">
            <div class="login-page__eyebrow">
              <span aria-hidden="true">✦</span>
              <span>UIKA STARLIGHT LIBRARY</span>
            </div>
            <h1 class="login-page__title">
              <span>把喜欢的故事，</span>
              <span class="login-page__title-highlight">留在初华的书架里。</span>
            </h1>
          </div>
        </div>

        <p class="login-page__description">
          上传 TXT，整理章节，安静地读下去。阅读位置会自动保存，下次打开时可以接着上次停下的地方继续。
        </p>

        <ul class="login-page__feature-list" aria-label="阅读器主要功能">
          <li class="login-page__feature-item">
            <span class="login-page__feature-icon" aria-hidden="true">✦</span>
            <div>
              <strong>TXT 私人书架</strong>
              <span>支持海报网格与列表双视图，轻松整理本地藏书</span>
            </div>
          </li>
          <li class="login-page__feature-item">
            <span class="login-page__feature-icon" aria-hidden="true">✦</span>
            <div>
              <strong>章节目录解析</strong>
              <span>内置多种章节规则，也支持自定义正则与实时预览</span>
            </div>
          </li>
          <li class="login-page__feature-item">
            <span class="login-page__feature-icon" aria-hidden="true">✦</span>
            <div>
              <strong>跨端阅读进度</strong>
              <span>按章节与字符偏移精准保存，随时无缝续读</span>
            </div>
          </li>
        </ul>
      </section>

      <section class="login-page__form">
        <div class="login-page__form-badge" aria-hidden="true">✦ WELCOME BACK</div>
        <div class="login-page__form-header">
          <h2 class="login-page__form-title">登录书架</h2>
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
            {{ authStore.loginPending ? "登录中..." : "登录并进入书架 ✦" }}
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
  width: min(1020px, 100%);
  display: grid;
  grid-template-columns: 1.15fr 0.95fr;
  gap: clamp(32px, 5vw, 64px);
  align-items: center;
}

.login-page__intro {
  display: grid;
  gap: 22px;
  align-content: center;
}

.login-page__character-card {
  display: grid;
  gap: 18px;
}

.login-page__portrait-ring {
  position: relative;
  width: 116px;
  height: 116px;
  padding: 4px;
  border-radius: 34px;
  background: var(--brand-gradient);
  box-shadow: 0 16px 36px var(--primary-glow);
}

.login-page__portrait {
  width: 100%;
  height: 100%;
  border-radius: 30px;
  object-fit: cover;
  display: block;
  background: var(--surface-color);
}

.login-page__character-meta {
  display: grid;
  gap: 12px;
}

.login-page__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 5px 14px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-color);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.login-page__eyebrow span:first-child {
  color: var(--accent-color);
}

.login-page__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(32px, 4.2vw, 46px);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.22;
  text-wrap: balance;
}

.login-page__title span {
  display: block;
}

.login-page__title-highlight {
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.login-page__description {
  margin: 0;
  max-width: 44ch;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.8;
}

.login-page__feature-list {
  display: grid;
  gap: 10px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}

.login-page__feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-md);
  background: var(--surface-card-bg);
  backdrop-filter: blur(12px);
}

.login-page__feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--accent-color);
  font-size: 12px;
  flex-shrink: 0;
  margin-top: 2px;
}

.login-page__feature-item div {
  display: grid;
  gap: 2px;
}

.login-page__feature-item strong {
  color: var(--text-primary);
  font-size: 14.5px;
  font-weight: 700;
}

.login-page__feature-item span {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

/* 登录表单：晶透毛玻璃卡片 */
.login-page__form {
  position: relative;
  display: grid;
  gap: 18px;
  padding: clamp(26px, 4vw, 38px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: var(--surface-card-bg);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-card);
}

.login-page__form-badge {
  width: fit-content;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: var(--accent-color);
}

.login-page__form-header {
  display: grid;
  gap: 6px;
}

.login-page__form-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 800;
}

.login-page__form-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.login-page__form-fields {
  display: grid;
  gap: 16px;
}

.login-page__field {
  display: grid;
  gap: 6px;
}

.login-page__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
}

.login-page__submit {
  width: 100%;
  margin-top: 6px;
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
    padding: 36px 18px;
  }

  .login-page__panel {
    grid-template-columns: 1fr;
    gap: 32px;
    max-width: 480px;
  }

  .login-page__portrait-ring {
    width: 92px;
    height: 92px;
    border-radius: 28px;
  }

  .login-page__portrait {
    border-radius: 24px;
  }
}
</style>
