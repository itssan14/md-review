import { escapeForHTML } from "./feedback";

declare global {
  interface Window {
    __mermaid?: {
      initialize: (config: Record<string, unknown>) => void;
      render: (id: string, code: string) => Promise<{ svg: string }>;
    };
  }
}

export async function waitForMermaid(): Promise<void> {
  if (window.__mermaid) return;
  await new Promise<void>((resolve) => {
    window.addEventListener("mermaid-ready", () => resolve(), { once: true });
    setTimeout(resolve, 5000);
  });
}

export async function renderMermaidBlocks(container: HTMLElement) {
  if (!window.__mermaid) return;
  const containers = container.querySelectorAll(".mermaid-container");
  for (const el of containers) {
    const source = el.querySelector(".mermaid-source");
    const renderDiv = el.querySelector(".mermaid-render");
    if (!source || !renderDiv) continue;
    const code = source.textContent || "";
    const id = el.getAttribute("data-mermaid-id") || "mermaid-" + Math.random().toString(36).slice(2, 9);
    try {
      const { svg } = await window.__mermaid!.render(id, code);
      renderDiv.innerHTML = svg;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      renderDiv.innerHTML = `<pre class="text-red-500 text-xs">Mermaid error: ${escapeForHTML(msg)}</pre>`;
    }
  }
}

export function reinitMermaid(theme: "light" | "dark", container: HTMLElement) {
  if (!window.__mermaid) return;
  window.__mermaid.initialize({
    startOnLoad: false,
    theme: theme === "dark" ? "dark" : "default",
  });
  renderMermaidBlocks(container);
}
