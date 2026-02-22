export interface LineMapEntry {
  startLine: number;
  endLine: number;
  type:
    | "heading"
    | "paragraph"
    | "code"
    | "mermaid"
    | "list"
    | "blockquote"
    | "table"
    | "hr";
  text: string;
  _used?: boolean;
}

export function buildLineMap(src: string): LineMapEntry[] {
  const lines = src.split("\n");
  const map: LineMapEntry[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // fenced code block
    const fenceMatch = line.match(/^```(\w*)/);
    if (fenceMatch) {
      const startLine = i + 1;
      const lang = fenceMatch[1] || "";
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        i++;
      }
      const endLine = i + 1;
      i++;
      map.push({
        startLine,
        endLine,
        type: lang === "mermaid" ? "mermaid" : "code",
        text: "(code block)",
      });
      continue;
    }

    // heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      map.push({
        startLine: i + 1,
        endLine: i + 1,
        type: "heading",
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // hr
    if (/^(---|___|\*\*\*)\s*$/.test(line.trim())) {
      map.push({ startLine: i + 1, endLine: i + 1, type: "hr", text: "---" });
      i++;
      continue;
    }

    // blockquote
    if (line.startsWith("> ") || line === ">") {
      const startLine = i + 1;
      while (
        i < lines.length &&
        (lines[i].startsWith("> ") || lines[i] === ">")
      ) {
        i++;
      }
      map.push({
        startLine,
        endLine: i,
        type: "blockquote",
        text: lines[startLine - 1].replace(/^>\s?/, ""),
      });
      continue;
    }

    // table
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^[\s|:\-]+$/.test(lines[i + 1])
    ) {
      const startLine = i + 1;
      i += 2;
      while (
        i < lines.length &&
        lines[i].includes("|") &&
        lines[i].trim() !== ""
      ) {
        i++;
      }
      map.push({
        startLine,
        endLine: i,
        type: "table",
        text: lines[startLine - 1],
      });
      continue;
    }

    // list
    const listMatch =
      line.match(/^(\s*)[-*+]\s+/) || line.match(/^(\s*)\d+\.\s+/);
    if (listMatch) {
      const startLine = i + 1;
      while (i < lines.length) {
        const l = lines[i];
        if (l.trim() === "") break;
        if (
          /^\s*[-*+]\s+/.test(l) ||
          /^\s*\d+\.\s+/.test(l) ||
          /^\s{2,}/.test(l)
        ) {
          i++;
        } else {
          break;
        }
      }
      map.push({
        startLine,
        endLine: i,
        type: "list",
        text: lines[startLine - 1].replace(/^\s*[-*+\d.]+\s+/, ""),
      });
      continue;
    }

    // paragraph
    {
      const startLine = i + 1;
      let paraText = "";
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].match(/^#{1,6}\s/) &&
        !lines[i].match(/^```/) &&
        !lines[i].match(/^\s*[-*+]\s/) &&
        !lines[i].match(/^\s*\d+\.\s/) &&
        !lines[i].startsWith("> ") &&
        !(
          lines[i].includes("|") &&
          i + 1 < lines.length &&
          /^[\s|:\-]+$/.test(lines[i + 1] || "")
        ) &&
        !/^(---|___|\*\*\*)\s*$/.test(lines[i].trim())
      ) {
        paraText += (paraText ? " " : "") + lines[i];
        i++;
      }
      map.push({ startLine, endLine: i, type: "paragraph", text: paraText });
    }
  }

  return map;
}

export function matchBlockToMap(
  el: Element,
  lineMap: LineMapEntry[],
): LineMapEntry | null {
  const tag = el.tagName.toLowerCase();

  // mermaid container
  if (el.classList.contains("mermaid-container")) {
    const entry = lineMap.find((m) => m.type === "mermaid" && !m._used);
    if (entry) {
      entry._used = true;
      return entry;
    }
    return null;
  }

  // code block
  if (tag === "pre" && !el.classList.contains("mermaid-source")) {
    const entry = lineMap.find((m) => m.type === "code" && !m._used);
    if (entry) {
      entry._used = true;
      return entry;
    }
    return null;
  }

  // table
  if (tag === "table") {
    const entry = lineMap.find((m) => m.type === "table" && !m._used);
    if (entry) {
      entry._used = true;
      return entry;
    }
    return null;
  }

  // hr
  if (tag === "hr") {
    const entry = lineMap.find((m) => m.type === "hr" && !m._used);
    if (entry) {
      entry._used = true;
      return entry;
    }
    return null;
  }

  const text = (el.textContent || "").trim();
  const first40 = text.slice(0, 40);

  // heading
  if (/^h[1-6]$/.test(tag)) {
    const entry = lineMap.find(
      (m) =>
        m.type === "heading" &&
        !m._used &&
        first40.startsWith(m.text.slice(0, 30)),
    );
    if (entry) {
      entry._used = true;
      return entry;
    }
  }

  // blockquote
  if (tag === "blockquote") {
    const entry = lineMap.find((m) => m.type === "blockquote" && !m._used);
    if (entry) {
      entry._used = true;
      return entry;
    }
    return null;
  }

  // list
  if (tag === "ul" || tag === "ol") {
    const entry = lineMap.find((m) => m.type === "list" && !m._used);
    if (entry) {
      entry._used = true;
      return entry;
    }
    return null;
  }

  // paragraph — text content match
  if (tag === "p") {
    const entry = lineMap.find(
      (m) =>
        m.type === "paragraph" &&
        !m._used &&
        first40 &&
        m.text.slice(0, 30).trim() !== "" &&
        first40.startsWith(m.text.slice(0, 30).trim()),
    );
    if (entry) {
      entry._used = true;
      return entry;
    }
    // fallback: next unused paragraph
    const fallback = lineMap.find((m) => m.type === "paragraph" && !m._used);
    if (fallback) {
      fallback._used = true;
      return fallback;
    }
  }

  return null;
}
