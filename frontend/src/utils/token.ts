const TOKEN_STORAGE_KEY = "uika_book/token";
const DEPRECATED_BACKEND_CONFIG_KEY = "uika_book/backend-config";
const DEPRECATED_BACKEND_NOTICE_KEY = "uika_book/backend-notice";

function getPreviousSameOriginTokenKey() {
  if (typeof window === "undefined") {
    return null;
  }

  const previousBackendId = `origin:${window.location.origin.toLowerCase()}`;
  return `${TOKEN_STORAGE_KEY}/${encodeURIComponent(previousBackendId)}`;
}

function clearDeprecatedBackendState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DEPRECATED_BACKEND_CONFIG_KEY);
  window.sessionStorage.removeItem(DEPRECATED_BACKEND_NOTICE_KEY);
}

function migratePreviousSameOriginToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const currentToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (currentToken) {
    clearDeprecatedBackendState();
    return currentToken;
  }

  const previousKey = getPreviousSameOriginTokenKey();
  const previousToken = previousKey ? window.localStorage.getItem(previousKey) : null;
  if (previousToken && previousKey) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, previousToken);
    window.localStorage.removeItem(previousKey);
  }

  clearDeprecatedBackendState();
  return previousToken;
}

export const authTokenStorage = {
  get() {
    return migratePreviousSameOriginToken();
  },
  set(token: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    const previousKey = getPreviousSameOriginTokenKey();
    if (previousKey) {
      window.localStorage.removeItem(previousKey);
    }
    clearDeprecatedBackendState();
  },
  clear() {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    const previousKey = getPreviousSameOriginTokenKey();
    if (previousKey) {
      window.localStorage.removeItem(previousKey);
    }
    clearDeprecatedBackendState();
  },
};
