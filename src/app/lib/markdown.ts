import { Marked } from "marked";
import hljs from "highlight.js";
import { escapeForHTML } from "./feedback";

const marked = new Marked();

export function configureMarked() {
  marked.use({
    gfm: true,
    breaks: false,
    renderer: {
      code(obj: { text?: string; lang?: string } | string) {
        const text = typeof obj === "string" ? obj : (obj.text || "");
        const lang = typeof obj === "string" ? "" : (obj.lang || "");
        if (lang === "mermaid") {
          const id = "mermaid-" + Math.random().toString(36).slice(2, 9);
          return `<div class="mermaid-container" data-mermaid-id="${id}"><pre class="mermaid-source">${escapeForHTML(text)}</pre><div class="mermaid-render"></div></div>`;
        }
        const langClass = lang ? ` class="language-${escapeForHTML(lang)}"` : "";
        return `<pre><code${langClass}>${escapeForHTML(text)}</code></pre>`;
      },
      listitem(obj: { text?: string; task?: boolean; checked?: boolean } | string) {
        const text = typeof obj === "string" ? obj : (obj.text || "");
        const task = typeof obj === "string" ? undefined : obj.task;
        const checked = typeof obj === "string" ? false : obj.checked;
        if (task) {
          const checkbox = `<input type="checkbox"${checked ? " checked" : ""} disabled> `;
          return `<li class="task-list-item">${checkbox}${text}</li>\n`;
        }
        return `<li>${text}</li>\n`;
      },
    },
  });
}

export function renderMarkdown(raw: string): string {
  return marked.parse(raw) as string;
}

export function highlightCodeBlocks(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>('pre code[class*="language-"]').forEach((block) => {
    hljs.highlightElement(block);
  });
}
