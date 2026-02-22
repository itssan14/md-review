import { describe, expect, test } from "bun:test";
import { buildFeedback, escapeForHTML } from "./feedback";

describe("escapeForHTML", () => {
  test("escapes &", () => {
    expect(escapeForHTML("a & b")).toBe("a &amp; b");
  });

  test("escapes <", () => {
    expect(escapeForHTML("<div>")).toBe("&lt;div&gt;");
  });

  test("escapes >", () => {
    expect(escapeForHTML("a > b")).toBe("a &gt; b");
  });

  test('escapes "', () => {
    expect(escapeForHTML('"quoted"')).toBe("&quot;quoted&quot;");
  });

  test("passes plain text through unchanged", () => {
    expect(escapeForHTML("hello world")).toBe("hello world");
  });

  test("escapes all special chars in one string", () => {
    expect(escapeForHTML('a & <b> "c"')).toBe("a &amp; &lt;b&gt; &quot;c&quot;");
  });
});

describe("buildFeedback", () => {
  test("header always starts with Feedback on: <filename>", () => {
    const { feedback } = buildFeedback([], "", "notes.md");
    expect(feedback).toContain("Feedback on: notes.md");
  });

  test("single-line comment uses L<n> reference", () => {
    const comments = [
      { id: "1", startLine: 5, endLine: 5, context: "some text", text: "looks good" },
    ];
    const { feedback } = buildFeedback(comments, "", "doc.md");
    expect(feedback).toContain("L5 [some text]: looks good");
  });

  test("multi-line comment uses L<start>-<end> reference", () => {
    const comments = [
      { id: "1", startLine: 3, endLine: 7, context: "a paragraph", text: "rewrite this" },
    ];
    const { feedback } = buildFeedback(comments, "", "doc.md");
    expect(feedback).toContain("L3-7 [a paragraph]: rewrite this");
  });

  test("context over 50 chars is truncated with ...", () => {
    const longCtx = "a".repeat(60);
    const comments = [
      { id: "1", startLine: 1, endLine: 1, context: longCtx, text: "hi" },
    ];
    const { feedback } = buildFeedback(comments, "", "doc.md");
    expect(feedback).toContain("a".repeat(50) + "...");
    expect(feedback).not.toContain("a".repeat(51) + "...");
  });

  test("context of exactly 50 chars is not truncated", () => {
    const ctx = "b".repeat(50);
    const comments = [
      { id: "1", startLine: 1, endLine: 1, context: ctx, text: "hi" },
    ];
    const { feedback } = buildFeedback(comments, "", "doc.md");
    expect(feedback).toContain(`[${"b".repeat(50)}]`);
    expect(feedback).not.toContain("...");
  });

  test("comments are sorted by startLine ascending", () => {
    const comments = [
      { id: "2", startLine: 10, endLine: 10, context: "second", text: "B" },
      { id: "1", startLine: 2, endLine: 2, context: "first", text: "A" },
    ];
    const { feedback } = buildFeedback(comments, "", "doc.md");
    const posA = feedback.indexOf("L2");
    const posB = feedback.indexOf("L10");
    expect(posA).toBeLessThan(posB);
  });

  test("general text is appended as General: <text>", () => {
    const { feedback } = buildFeedback([], "overall thoughts", "doc.md");
    expect(feedback).toContain("\nGeneral: overall thoughts\n");
  });

  test("count equals number of comments plus 1 when general text is present", () => {
    const comments = [
      { id: "1", startLine: 1, endLine: 1, context: "x", text: "a" },
      { id: "2", startLine: 2, endLine: 2, context: "y", text: "b" },
    ];
    const { count } = buildFeedback(comments, "some general", "doc.md");
    expect(count).toBe(3);
  });

  test("count equals number of comments when no general text", () => {
    const comments = [
      { id: "1", startLine: 1, endLine: 1, context: "x", text: "a" },
    ];
    const { count } = buildFeedback(comments, "", "doc.md");
    expect(count).toBe(1);
  });

  test("empty comments and no general text produce count 0", () => {
    const { count } = buildFeedback([], "", "doc.md");
    expect(count).toBe(0);
  });

  test("empty comments and no general text produce only the header", () => {
    const { feedback } = buildFeedback([], "", "doc.md");
    expect(feedback.trim()).toBe("Feedback on: doc.md");
  });
});
