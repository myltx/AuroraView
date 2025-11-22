import type { ThemeMode, ThemePreference } from "../types/theme";

type ThemeListener = () => void;
type ThemeSubscriber = (state: ThemeState) => void;
type ThemeState = { preference: ThemePreference; mode: ThemeMode };

const subscribers = new Set<ThemeSubscriber>();
let initialized = false;
let currentState: ThemeState = { preference: "auto", mode: "light" };
let unsubscribeThemeUpdates: ThemeListener | null = null;

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
}

function detectSystemTheme(): ThemeMode {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function attachThemeListener(handler: (mode: ThemeMode) => void): ThemeListener | null {
  if (window.electron?.theme?.onDidChange) {
    return window.electron.theme.onDidChange(handler);
  }
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!media) return null;
  const listener = (event: MediaQueryListEvent) => {
    handler(event.matches ? "dark" : "light");
  };
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function notifySubscribers() {
  const snapshot = { ...currentState };
  subscribers.forEach((listener) => listener(snapshot));
}

async function readPreferences() {
  try {
    const prefs = await window.electron?.preferences?.get?.();
    return prefs?.themePreference ?? "auto";
  } catch {
    return "auto";
  }
}

async function readThemeMode() {
  try {
    const mode = await window.electron?.theme?.get?.();
    return mode ?? detectSystemTheme();
  } catch {
    return detectSystemTheme();
  }
}

export function useSystemTheme() {
  const init = async () => {
    if (initialized) return;
    initialized = true;

    const [preference, mode] = await Promise.all([
      readPreferences(),
      readThemeMode(),
    ]);

    currentState.preference = preference;
    currentState.mode = mode;
    applyTheme(mode);
    notifySubscribers();

    unsubscribeThemeUpdates = attachThemeListener((nextMode) => {
      currentState.mode = nextMode;
      applyTheme(nextMode);
      notifySubscribers();
    });
  };

  const setTheme = async (preference: ThemePreference) => {
    try {
      const prefs = await window.electron?.preferences?.set?.(
        "themePreference",
        preference
      );
      currentState.preference = prefs?.themePreference ?? preference;
      if (preference !== "auto") {
        currentState.mode = preference;
        applyTheme(preference);
      }
    } catch {
      currentState.preference = preference;
      if (preference === "auto") {
        currentState.mode = detectSystemTheme();
      } else {
        currentState.mode = preference;
      }
      applyTheme(currentState.mode);
    } finally {
      notifySubscribers();
    }
  };

  const getTheme = () => ({ ...currentState });

  const subscribe = (listener: ThemeSubscriber) => {
    subscribers.add(listener);
    listener(getTheme());
    return () => {
      subscribers.delete(listener);
    };
  };

  const dispose = () => {
    unsubscribeThemeUpdates?.();
    unsubscribeThemeUpdates = null;
  };

  return {
    init,
    setTheme,
    getTheme,
    subscribe,
    dispose,
  };
}
