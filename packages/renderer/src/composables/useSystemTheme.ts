import { onBeforeUnmount } from "vue";

type ThemeListener = () => void;

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
}

async function detectInitialTheme() {
  if (window.electron?.theme?.get) {
    return window.electron.theme.get();
  }
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function subscribeToSystemTheme(): ThemeListener | null {
  if (window.electron?.theme?.onDidChange) {
    return window.electron.theme.onDidChange(applyTheme);
  }
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!media) return null;
  const listener = (event: MediaQueryListEvent) => {
    applyTheme(event.matches ? "dark" : "light");
  };
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function useSystemTheme() {
  let unsubscribe: ThemeListener | null = null;

  const init = async () => {
    const mode = await detectInitialTheme();
    applyTheme(mode);
    unsubscribe = subscribeToSystemTheme();
  };

  onBeforeUnmount(() => {
    unsubscribe?.();
  });

  return {
    init,
  };
}
