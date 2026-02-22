import { resolve } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

export async function installSkill() {
  const skillSource = resolve(import.meta.dir, "../skills/claude-skill.md");
  const homeDir = process.env.HOME || process.env.USERPROFILE || "~";
  const skillsDir = resolve(homeDir, ".claude/skills");
  const destPath = resolve(skillsDir, "md-review.md");

  if (!existsSync(skillsDir)) {
    mkdirSync(skillsDir, { recursive: true });
  }

  const content = readFileSync(skillSource, "utf-8");
  writeFileSync(destPath, content, "utf-8");

  console.log(`✓ Skill installed to ${destPath}`);
  console.log();
  console.log("Claude Code will now know how to use md-review for document reviews.");
  console.log();
  console.log("For Cursor / Copilot, add to your .cursorrules:");
  console.log('  "When asked to review a markdown document, use `md-review <file>` to open it in the browser for annotation."');
}
