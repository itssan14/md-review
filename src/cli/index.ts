#!/usr/bin/env bun

import { statSync } from "fs";
import { startServer, startFolderServer } from "./server";
import { installSkill } from "./install-skill";

const args = process.argv.slice(2);

if (args[0] === "install-skill") {
  await installSkill();
  process.exit(0);
}

const inputPath = args[0];

if (!inputPath) {
  console.error("Usage: md-review <file.md> | <folder/>");
  console.error("       md-review install-skill");
  process.exit(1);
}

let stat: ReturnType<typeof statSync>;
try {
  stat = statSync(inputPath);
} catch {
  console.error(`Error: path not found — ${inputPath}`);
  process.exit(1);
}

if (stat.isDirectory()) {
  await startFolderServer(inputPath);
} else {
  const file = Bun.file(inputPath);

  if (!(await file.exists())) {
    console.error(`Error: file not found — ${inputPath}`);
    process.exit(1);
  }

  const content = await file.text();
  const filename = inputPath.split("/").pop()!;

  await startServer(content, filename);
}
