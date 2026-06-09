import { create } from "zustand";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export type Theme = "light" | "dark" | "system";

interface UiStore {
  sidebarOpen: boolean;
  toasts: Toast[];
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  setTheme: (theme: Theme) => void;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("grantledger-theme");
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  toasts: [],
  theme: getInitialTheme(),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addToast: (toast) =>
    set((state) => {
      const newToasts = [
        ...state.toasts,
        { ...toast, id: crypto.randomUUID() },
      ];
      return { toasts: newToasts.slice(-5) };
    }),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("grantledger-theme", theme);
    }
    set({ theme });
  },
}));
