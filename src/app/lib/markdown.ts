import { Marked } from "marked";
import type { Tokens } from "marked";
import hljs from "highlight.js";
import { escapeForHTML } from "./feedback";

const marked = new Marked();
let configured = false;

export function configureMarked() {
  if (configured) return;
  configured = true;
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
        const { task, checked } = item;
        const body = (this as any).parser.parse(item.tokens, !!item.loose);
        if (task) {
          const checkbox = `<input type="checkbox"${checked ? " checked" : ""} disabled> `;
          return `<li class="task-list-item">${checkbox}${body}</li>\n`;
        }
        return `<li>${body}</li>\n`;
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
