<template>
  <div class="login-page">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div class="login-page__intro">
          <div class="login-page__eyebrow">初华的书</div>
          <h1 class="login-page__title">
            <span>把喜欢的故事，</span>
            <span>留在自己的书架里。</span>
          </h1>
          <p class="login-page__description">
            上传 TXT，整理章节，安静地读下去。阅读位置会自动保存，下次打开时可以接着上次停下的地方继续。
          </p>

          <div class="login-page__feature-list" aria-label="阅读器主要功能">
            <div class="login-page__feature-item">
              <span class="login-page__feature-dot" />
              <div>
                <strong>TXT 私人书架</strong>
                <span>上传、整理和查找自己的本地书籍</span>
              </div>
            </div>
            <div class="login-page__feature-item">
              <span class="login-page__feature-dot" />
              <div>
                <strong>章节目录</strong>
                <span>自动识别章节，也支持自定义目录规则</span>
              </div>
            </div>
            <div class="login-page__feature-item">
              <span class="login-page__feature-dot" />
              <div>
                <strong>阅读进度</strong>
                <span>按章节和阅读位置保存，下次打开继续阅读</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <Card class="login-page__card">
          <CardContent class="flex flex-col gap-4 pt-6">
            <div>
              <h2 class="login-page__form-title">登录</h2>
              <p class="login-page__form-subtitle">
                {{ redirectHint }}
              </p>
            </div>

            <Alert v-if="authStore.errorMessage" variant="destructive">
              {{ authStore.errorMessage }}
            </Alert>

            <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium">用户名</label>
                <Input
                  v-model="form.username"
                  placeholder="请输入用户名"
                  :disabled="authStore.loginPending"
                  @update:model-value="clearError"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium">密码</label>
                <Input
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
                class="w-full"
                :disabled="authStore.loginPending"
              >
                登录并进入书架
              </Button>
            </form>

            <div class="login-page__footnote">
              如果后端未启动，登录页会直接提示连接失败，方便你区分"服务没开"和"账号密码错误"。
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  width: min(1100px, 100%);
  margin: 0 auto;
  min-height: 100dvh;
  display: grid;
  align-items: center;
  padding: 24px 0;
}

.login-page__intro,
.login-page__card {
  height: 100%;
  border-radius: 28px;
}

.login-page__intro {
  display: grid;
  gap: 22px;
  padding: clamp(24px, 5vw, 40px);
  background:
    radial-gradient(circle at top right, rgba(74, 159, 217, 0.22), transparent 34%),
    radial-gradient(circle at bottom left, rgba(244, 164, 180, 0.12), transparent 30%),
    color-mix(in srgb, var(--surface-color) 94%, white 6%);
  box-shadow: var(--surface-shadow);
}

.login-page__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-page__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(36px, 4.5vw, 52px);
  font-weight: 500;
  letter-spacing: -0.035em;
  line-height: 1.12;
  text-wrap: balance;
}

.login-page__title span {
  display: block;
}

.login-page__description,
.login-page__form-subtitle {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.8;
}

.login-page__form-title {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-size: 28px;
}

.login-page__card {
  background: color-mix(in srgb, var(--surface-color) 94%, white 6%);
  box-shadow: var(--surface-shadow);
}

.login-page__feature-list {
  display: grid;
  gap: 12px;
}

.login-page__feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.login-page__feature-item strong,
.login-page__feature-item span {
  display: block;
}

.login-page__feature-item strong {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
}

.login-page__feature-item div > span {
  margin-top: 2px;
  font-size: 13px;
}

.login-page__feature-dot {
  width: 10px;
  height: 10px;
  margin-top: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  box-shadow: 0 0 0 6px var(--primary-soft);
}

.login-page__error {
  border-radius: 16px;
}

.login-page__footnote {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 1023px) {
  .login-page {
    min-height: auto;
    padding: 24px 0 40px;
  }
}
</style>
