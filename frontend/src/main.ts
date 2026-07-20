import { createApp } from "vue";

import App from "./App.vue";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";
import { useAppThemeStore } from "./stores/app-theme";
import { pinia } from "./stores";
import { installGlobalErrorHandling, notifyGlobalError } from "./utils/app-notifier";
import { setUnauthorizedHandler } from "./api/client";
import { createSwUpdateHandler } from "./utils/sw-update";
import "./styles/index.css";
import "./styles/tailwind.css";

installGlobalErrorHandling();

// PWA Service Worker 更新检测：SW 更新后刷新页面以加载一致的新资源，
// 避免 PC 端触发 SW 更新后，安卓 PWA 加载新旧资源混合导致渲染异常（如白线）。
// 阅读页（immersive）内不立即刷新，等离开阅读页后再刷新，避免打断阅读。
if ("serviceWorker" in navigator) {
  const swUpdateHandler = createSwUpdateHandler({
    reload: () => window.location.reload(),
    isImmersiveRoute: () => !!router.currentRoute.value.meta.immersive,
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    swUpdateHandler.onControllerChange();
  });

  router.afterEach((to, from) => {
    swUpdateHandler.onRouteAfterEach(
      { immersive: !!to.meta.immersive },
      { immersive: !!from.meta.immersive },
    );
  });
}

const app = createApp(App);

app.config.errorHandler = (error) => {
  notifyGlobalError(error, "页面渲染出现异常，请刷新后重试");
  console.error(error);
};

router.onError((error) => {
  notifyGlobalError(error, "页面跳转失败，请稍后重试");
});

app.use(pinia);

// 应用启动时先恢复全局主题，避免页面首次渲染出现明显闪烁。
const appThemeStore = useAppThemeStore(pinia);
appThemeStore.initialize();

const authStore = useAuthStore(pinia);
void authStore.ensureReady();

// 统一 401 处理：会话过期时清理本地会话并跳登录页（保留跳转目标）。
setUnauthorizedHandler(() => {
  authStore.clearAuth();
  if (router.currentRoute.value.name !== "login") {
    void router.push({
      name: "login",
      query: { redirect: router.currentRoute.value.fullPath },
    });
  }
});

app.use(router);
app.mount("#app");
