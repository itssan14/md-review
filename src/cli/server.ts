import { resolve } from "path";

async function findFreePort(start: number): Promise<number> {
  for (let port = start; port < start + 100; port++) {
    try {
      const server = Bun.serve({ port, fetch: () => new Response() });
      server.stop(true);
      return port;
    } catch {
      continue;
    }
  }
  throw new Error("Could not find a free port");
}

export async function startServer(content: string, filename: string) {
  const port = await findFreePort(3849);

  // Read the built single-file HTML and inject data
  const distPath = resolve(import.meta.dir, "../../dist/index.html");
  const distFile = Bun.file(distPath);

  if (!(await distFile.exists())) {
    console.error(
      "Error: dist/index.html not found. Run `bun run build` first.",
    );
    process.exit(1);
  }

  const template = await distFile.text();
  const data = JSON.stringify({ rawMarkdown: content, filename });
  const html = template.replace("__MD_REVIEW_DATA__", data);

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/") {
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      }

      if (url.pathname === "/done" && req.method === "POST") {
        const body = await req.text();
        const { feedback, count } = JSON.parse(body) as {
          feedback: string;
          count: number;
        };

        if (count > 0) {
          const proc = Bun.spawn(["pbcopy"], { stdin: "pipe" });
          proc.stdin.write(feedback);
          proc.stdin.end();
          await proc.exited;
          console.log(
            `\n✓ ${count} comment${count === 1 ? "" : "s"} copied to clipboard`,
          );
        } else {
          console.log("\n(No comments — clipboard unchanged)");
        }

        return new Response("ok");
      }

      if (url.pathname === "/post" && req.method === "POST") {
        const { feedback, count } = JSON.parse(await req.text()) as {
          feedback: string;
          count: number;
        };

        if (count > 0) {
          // Copy to clipboard via pbcopy
          const proc = Bun.spawn(["pbcopy"], { stdin: "pipe" });
          proc.stdin.write(feedback);
          proc.stdin.end();
          await proc.exited;
          // Print to stdout so Claude Code can read the feedback
          process.stdout.write(
            "\n=== md-review feedback ===\n" +
              feedback +
              "==========================\n",
          );
          console.log(`✓ ${count} comment${count === 1 ? "" : "s"} posted`);
        }

        setTimeout(() => process.exit(0), 300);
        return new Response("ok", {
          headers: { "Content-Type": "text/plain" },
        });
      }

      return new Response("Not found", { status: 404 });
    },
  });

  console.log(`\nmd-review: opening http://localhost:${port}`);
  Bun.spawn(["open", `http://localhost:${port}`]);
}
