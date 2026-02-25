import { resolve, basename } from "path";
import { readdirSync } from "fs";

export interface FolderNode {
  name: string;
  relativePath: string;
  type: "dir" | "file";
  children?: FolderNode[];
}

export function buildFolderTree(dirPath: string): FolderNode {
  const absDir = resolve(dirPath);

  function walk(abs: string, rel: string): FolderNode {
    const entries = readdirSync(abs, { withFileTypes: true });
    const dirs: FolderNode[] = [];
    const files: FolderNode[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const childAbs = resolve(abs, entry.name);
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const child = walk(childAbs, childRel);
        // Only include dirs that have at least one .md descendant
        if (child.children && child.children.length > 0) {
          dirs.push(child);
        }
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push({ name: entry.name, relativePath: childRel, type: "file" });
      }
    }

    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    return {
      name: rel ? basename(rel) : basename(absDir),
      relativePath: rel,
      type: "dir",
      children: [...dirs, ...files],
    };
  }

  return walk(absDir, "");
}
