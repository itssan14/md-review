#!/usr/bin/env bun

import { startServer } from "./server";
import { installSkill } from "./install-skill";

const args = process.argv.slice(2);

if (args[0] === "install-skill") {
  await installSkill();
  process.exit(0);
}

const filePath = args[0];

if (!filePath) {
  console.error("Usage: md-review <file.md>");
  console.error("       md-review install-skill");
  process.exit(1);
}

const file = Bun.file(filePath);

if (!(await file.exists())) {
  console.error(`Error: file not found — ${filePath}`);
  process.exit(1);
}

const content = await file.text();
const filename = filePath.split("/").pop()!;

await startServer(content, filename);
