import { createSignal, onCleanup } from "solid-js";

export function useSystemTheme(): () => "light" | "dark" {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const [theme, setTheme] = createSignal<"light" | "dark">(mq.matches ? "dark" : "light");

  const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
  mq.addEventListener("change", handler);
  onCleanup(() => mq.removeEventListener("change", handler));

  return theme;
}
