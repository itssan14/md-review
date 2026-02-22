import { Marked } from "marked";
import type { Tokens } from "marked";
import hljs from "highlight.js";
import { escapeForHTML } from "./feedback";

const marked = new Marked();

export function configureMarked() {
  marked.use({
    gfm: true,
    breaks: false,
    renderer: {
      code(token: Tokens.Code) {
        const { text, lang } = token;
        const safeLang = lang ?? "";
        if (safeLang === "mermaid") {
          const id = "mermaid-" + Math.random().toString(36).slice(2, 9);
          return `<div class="mermaid-container" data-mermaid-id="${id}"><pre class="mermaid-source">${escapeForHTML(text)}</pre><div class="mermaid-render"></div></div>`;
        }
        const langClass = safeLang
          ? ` class="language-${escapeForHTML(safeLang)}"`
          : "";
        return `<pre><code${langClass}>${escapeForHTML(text)}</code></pre>`;
      },
      listitem(item: Tokens.ListItem) {
        const { text, task, checked } = item;
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
  container
    .querySelectorAll<HTMLElement>('pre code[class*="language-"]')
    .forEach((block) => {
      hljs.highlightElement(block);
    });
}
