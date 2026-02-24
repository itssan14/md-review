export interface Comment {
  id: string;
  filename: string;
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

export function buildFolderFeedback(
  comments: Comment[],
  generalText: string,
  folderName: string,
): { feedback: string; count: number } {
  let out = `Feedback on: ${folderName}/\n\n`;
  const byFile = new Map<string, Comment[]>();
  for (const c of comments) {
    if (!byFile.has(c.filename)) byFile.set(c.filename, []);
    byFile.get(c.filename)!.push(c);
  }
  for (const [filename, fileComments] of byFile) {
    out += `${filename}:\n`;
    const sorted = [...fileComments].sort((a, b) => a.startLine - b.startLine);
    for (const c of sorted) {
      const ctx =
        c.context.length > 50 ? c.context.slice(0, 50) + "..." : c.context;
      const ref =
        c.startLine === c.endLine
          ? `L${c.startLine}`
          : `L${c.startLine}-${c.endLine}`;
      out += `  ${ref} [${ctx}]: ${c.text}\n`;
    }
    out += "\n";
  }
  if (generalText) out += `General: ${generalText}\n`;
  return {
    feedback: out.trimEnd() + "\n",
    count: comments.length + (generalText ? 1 : 0),
  };
}
