import { beforeAll, describe, expect, test } from "bun:test";
import { configureMarked, renderMarkdown } from "./markdown";

beforeAll(() => {
  configureMarked();
});

// ── Inline formatting inside list items ───────────────────────────────────────

describe("renderMarkdown: inline in list items", () => {
  test("bold text in list item renders <strong>", () => {
    const html = renderMarkdown("- **bold**");
    expect(html).toContain("<strong>bold</strong>");
  });

  test("italic text in list item renders <em>", () => {
    const html = renderMarkdown("- *italic*");
    expect(html).toContain("<em>italic</em>");
  });

  test("inline code in list item renders <code>", () => {
    const html = renderMarkdown("- `code`");
    expect(html).toContain("<code>code</code>");
  });
});

// ── Task list items ───────────────────────────────────────────────────────────

describe("renderMarkdown: task list items", () => {
  test("checked task item contains checked checkbox input", () => {
    const html = renderMarkdown("- [x] done");
    expect(html).toContain('<input type="checkbox" checked disabled>');
    expect(html).toContain("done");
  });

  test("unchecked task item contains unchecked checkbox input", () => {
    const html = renderMarkdown("- [ ] todo");
    expect(html).toContain('<input type="checkbox" disabled>');
    expect(html).not.toContain("checked disabled");
    expect(html).toContain("todo");
  });
});

// ── Mermaid blocks ────────────────────────────────────────────────────────────

describe("renderMarkdown: mermaid blocks", () => {
  test("mermaid fenced block renders mermaid-container div", () => {
    const html = renderMarkdown("```mermaid\ngraph LR\n  A --> B\n```");
    expect(html).toContain('class="mermaid-container"');
  });

  test("mermaid fenced block renders mermaid-source pre", () => {
    const html = renderMarkdown("```mermaid\ngraph LR\n  A --> B\n```");
    expect(html).toContain('class="mermaid-source"');
  });
});

// ── Code blocks ───────────────────────────────────────────────────────────────

describe("renderMarkdown: code blocks", () => {
  test("ts code block has language-ts class on code element", () => {
    const html = renderMarkdown("```ts\nconst x = 1;\n```");
    expect(html).toContain('class="language-ts"');
  });

  test("code block without language has no language class", () => {
    const html = renderMarkdown("```\nplain\n```");
    expect(html).not.toContain('class="language-');
  });
});

// ── HTML escaping in code blocks ──────────────────────────────────────────────

describe("renderMarkdown: HTML escaping", () => {
  test("<div> in code block is escaped to &lt;div&gt; (XSS safe)", () => {
    const html = renderMarkdown("```\n<div>hello</div>\n```");
    expect(html).toContain("&lt;div&gt;");
    expect(html).not.toContain("<div>");
  });
});
