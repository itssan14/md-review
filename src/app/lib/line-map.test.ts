import { describe, expect, test } from "bun:test";
import { buildLineMap } from "./line-map";

// ── Headings ──────────────────────────────────────────────────────────────────

describe("buildLineMap: headings", () => {
  test("h1 produces a heading entry on the correct line", () => {
    const map = buildLineMap("# Title");
    expect(map).toHaveLength(1);
    expect(map[0]).toMatchObject({ type: "heading", startLine: 1, endLine: 1, text: "Title" });
  });

  test("all heading levels 1-6 are detected as heading type", () => {
    const src = ["# H1", "## H2", "### H3", "#### H4", "##### H5", "###### H6"].join("\n");
    const map = buildLineMap(src);
    expect(map).toHaveLength(6);
    map.forEach((entry) => expect(entry.type).toBe("heading"));
  });

  test("heading text captures the content after the # prefix", () => {
    const map = buildLineMap("## My Section");
    expect(map[0].text).toBe("My Section");
  });

  test("heading occupies exactly one line", () => {
    const map = buildLineMap("line one\n## Heading\nline three");
    const h = map.find((e) => e.type === "heading")!;
    expect(h.startLine).toBe(h.endLine);
    expect(h.startLine).toBe(2);
  });
});

// ── Paragraphs ────────────────────────────────────────────────────────────────

describe("buildLineMap: paragraphs", () => {
  test("single-line paragraph spans one line", () => {
    const map = buildLineMap("Hello world");
    expect(map).toHaveLength(1);
    expect(map[0]).toMatchObject({ type: "paragraph", startLine: 1, endLine: 1 });
  });

  test("multi-line paragraph spans all its lines", () => {
    const src = "line one\nline two\nline three";
    const map = buildLineMap(src);
    expect(map).toHaveLength(1);
    expect(map[0]).toMatchObject({ type: "paragraph", startLine: 1, endLine: 3 });
  });

  test("multi-line paragraph text is concatenated with spaces", () => {
    const map = buildLineMap("alpha\nbeta");
    expect(map[0].text).toBe("alpha beta");
  });

  test("two paragraphs separated by blank line produce two entries", () => {
    const map = buildLineMap("first\n\nsecond");
    expect(map).toHaveLength(2);
    expect(map[0].type).toBe("paragraph");
    expect(map[1].type).toBe("paragraph");
  });
});

// ── Fenced code blocks ────────────────────────────────────────────────────────

describe("buildLineMap: fenced code blocks", () => {
  test("plain code block produces a code entry", () => {
    const src = "```\nconsole.log('hi')\n```";
    const map = buildLineMap(src);
    expect(map).toHaveLength(1);
    expect(map[0]).toMatchObject({ type: "code", startLine: 1, endLine: 3 });
  });

  test("language-tagged code block is still type code", () => {
    const src = "```ts\nconst x = 1;\n```";
    const map = buildLineMap(src);
    expect(map[0].type).toBe("code");
  });

  test("mermaid code block has type mermaid", () => {
    const src = "```mermaid\ngraph LR\n  A --> B\n```";
    const map = buildLineMap(src);
    expect(map[0].type).toBe("mermaid");
  });

  test("code block line range covers opening and closing fences", () => {
    const src = "```\nline a\nline b\n```";
    const map = buildLineMap(src);
    expect(map[0].startLine).toBe(1);
    expect(map[0].endLine).toBe(4);
  });
});

// ── Lists ─────────────────────────────────────────────────────────────────────

describe("buildLineMap: lists", () => {
  test("unordered list with - marker produces a list entry", () => {
    const src = "- item one\n- item two";
    const map = buildLineMap(src);
    expect(map).toHaveLength(1);
    expect(map[0].type).toBe("list");
  });

  test("unordered list with * marker produces a list entry", () => {
    const map = buildLineMap("* alpha\n* beta");
    expect(map[0].type).toBe("list");
  });

  test("unordered list with + marker produces a list entry", () => {
    const map = buildLineMap("+ one");
    expect(map[0].type).toBe("list");
  });

  test("ordered list produces a list entry", () => {
    const src = "1. first\n2. second";
    const map = buildLineMap(src);
    expect(map[0].type).toBe("list");
  });

  test("list endLine covers all items", () => {
    const src = "- a\n- b\n- c";
    const map = buildLineMap(src);
    expect(map[0].startLine).toBe(1);
    expect(map[0].endLine).toBe(3);
  });

  test("indented continuation lines stay within the same list entry", () => {
    const src = "- item one\n  continuation\n- item two";
    const map = buildLineMap(src);
    expect(map).toHaveLength(1);
    expect(map[0].endLine).toBe(3);
  });

  test("list ends at a blank line", () => {
    const src = "- item\n\nparagraph";
    const map = buildLineMap(src);
    expect(map[0].type).toBe("list");
    expect(map[1].type).toBe("paragraph");
  });
});

// ── Horizontal rules ──────────────────────────────────────────────────────────

describe("buildLineMap: horizontal rules", () => {
  test("--- produces an hr entry with text ---", () => {
    const map = buildLineMap("---");
    expect(map).toHaveLength(1);
    expect(map[0]).toMatchObject({ type: "hr", text: "---" });
  });

  test("___ produces an hr entry", () => {
    const map = buildLineMap("___");
    expect(map[0].type).toBe("hr");
  });

  test("*** produces an hr entry", () => {
    const map = buildLineMap("***");
    expect(map[0].type).toBe("hr");
  });

  test("hr occupies exactly one line", () => {
    const src = "para\n---\nafter";
    const map = buildLineMap(src);
    const hr = map.find((e) => e.type === "hr")!;
    expect(hr.startLine).toBe(hr.endLine);
    expect(hr.startLine).toBe(2);
  });
});

// ── Blockquotes ───────────────────────────────────────────────────────────────

describe("buildLineMap: blockquotes", () => {
  test("a > line produces a blockquote entry", () => {
    const map = buildLineMap("> quoted text");
    expect(map[0].type).toBe("blockquote");
  });

  test("consecutive > lines merge into one entry", () => {
    const src = "> line one\n> line two\n> line three";
    const map = buildLineMap(src);
    expect(map).toHaveLength(1);
    expect(map[0]).toMatchObject({ type: "blockquote", startLine: 1, endLine: 3 });
  });

  test("blockquote text is the first line content stripped of > prefix", () => {
    const map = buildLineMap("> hello there");
    expect(map[0].text).toBe("hello there");
  });
});

// ── Tables ────────────────────────────────────────────────────────────────────

describe("buildLineMap: tables", () => {
  test("header + separator row produces a table entry", () => {
    const src = "| A | B |\n|---|---|\n| 1 | 2 |";
    const map = buildLineMap(src);
    expect(map).toHaveLength(1);
    expect(map[0].type).toBe("table");
  });

  test("table endLine covers all data rows", () => {
    const src = "| H |\n|---|\n| r1 |\n| r2 |";
    const map = buildLineMap(src);
    expect(map[0].startLine).toBe(1);
    expect(map[0].endLine).toBe(4);
  });
});

// ── Blank lines ───────────────────────────────────────────────────────────────

describe("buildLineMap: blank lines", () => {
  test("blank lines are ignored and produce no entries", () => {
    const map = buildLineMap("\n\n\n");
    expect(map).toHaveLength(0);
  });

  test("blank lines between blocks don't produce extra entries", () => {
    const src = "# H\n\nparagraph\n\n- list";
    const map = buildLineMap(src);
    expect(map).toHaveLength(3);
  });
});

// ── Mixed content ─────────────────────────────────────────────────────────────

describe("buildLineMap: mixed content", () => {
  test("realistic document produces entries in source order with correct types", () => {
    const src = [
      "# Introduction",       // line 1  → heading
      "",                      // line 2  → blank
      "Some paragraph text.",  // line 3  → paragraph
      "",                      // line 4  → blank
      "- item a",              // line 5  → list
      "- item b",              // line 6
      "",                      // line 7  → blank
      "```js",                 // line 8  → code
      "const x = 1;",          // line 9
      "```",                   // line 10
      "",                      // line 11 → blank
      "> a quote",             // line 12 → blockquote
      "",                      // line 13 → blank
      "---",                   // line 14 → hr
    ].join("\n");

    const map = buildLineMap(src);
    expect(map.map((e) => e.type)).toEqual([
      "heading",
      "paragraph",
      "list",
      "code",
      "blockquote",
      "hr",
    ]);

    expect(map[0]).toMatchObject({ startLine: 1, endLine: 1 });
    expect(map[1]).toMatchObject({ startLine: 3, endLine: 3 });
    expect(map[2]).toMatchObject({ startLine: 5, endLine: 6 });
    expect(map[3]).toMatchObject({ startLine: 8, endLine: 10 });
    expect(map[4]).toMatchObject({ startLine: 12, endLine: 12 });
    expect(map[5]).toMatchObject({ startLine: 14, endLine: 14 });
  });
});
