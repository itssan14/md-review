export interface Comment {
  id: string;
  startLine: number;
  endLine: number;
  context: string;
  text: string;
}

export function escapeForHTML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildFeedback(
  comments: Comment[],
  generalText: string,
  filename: string,
): { feedback: string; count: number } {
  let out = `Feedback on: ${filename}\n\n`;

  const sorted = [...comments].sort((a, b) => a.startLine - b.startLine);
  for (const c of sorted) {
    const ctx =
      c.context.length > 50 ? c.context.slice(0, 50) + "..." : c.context;
    const ref =
      c.startLine === c.endLine
        ? `L${c.startLine}`
        : `L${c.startLine}-${c.endLine}`;
    out += `${ref} [${ctx}]: ${c.text}\n`;
  }

  if (generalText) {
    out += `\nGeneral: ${generalText}\n`;
  }

  return { feedback: out, count: sorted.length + (generalText ? 1 : 0) };
}
