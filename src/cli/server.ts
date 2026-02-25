import { resolve } from "path";
import { buildFolderTree } from "./folder";
import { basename } from "path";

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

async function getTemplate(): Promise<string> {
  const distPath = resolve(import.meta.dir, "../../dist/index.html");
  const distFile = Bun.file(distPath);

  if (!(await distFile.exists())) {
    console.error(
      "Error: dist/index.html not found. Run `bun run build` first.",
    );
    process.exit(1);
  }

  return distFile.text();
}

async function handleFeedbackRequest(
  req: Request,
  pathname: string,
): Promise<Response | null> {
  if (pathname === "/done" && req.method === "POST") {
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

  if (pathname === "/post" && req.method === "POST") {
    const { feedback, count } = JSON.parse(await req.text()) as {
      feedback: string;
      count: number;
    };

    if (count > 0) {
      const proc = Bun.spawn(["pbcopy"], { stdin: "pipe" });
      proc.stdin.write(feedback);
      proc.stdin.end();
      await proc.exited;
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

  return null;
}

export async function startServer(content: string, filename: string) {
  const port = await findFreePort(3849);
  const template = await getTemplate();
  const data = JSON.stringify({ type: "file", rawMarkdown: content, filename });
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

      const feedbackResponse = await handleFeedbackRequest(req, url.pathname);
      if (feedbackResponse) return feedbackResponse;

      return new Response("Not found", { status: 404 });
    },
  });

  console.log(`\nmd-review: opening http://localhost:${port}`);
  Bun.spawn(["open", `http://localhost:${port}`]);
}

export async function startFolderServer(folderPath: string) {
  const port = await findFreePort(3849);
  const template = await getTemplate();

  const absFolder = resolve(folderPath);
  const folderName = basename(absFolder);
  const tree = buildFolderTree(absFolder);

  const data = JSON.stringify({ type: "folder", folderName, tree });
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

      if (url.pathname === "/file" && req.method === "GET") {
        const reqPath = url.searchParams.get("path");
        if (!reqPath) {
          return new Response("Bad request: missing path", { status: 400 });
        }

        // Security: path traversal check
        const absFile = resolve(absFolder, reqPath);
        if (!absFile.startsWith(resolve(absFolder) + "/")) {
          return new Response("Forbidden", { status: 403 });
        }

        // Must be a .md file
        if (!absFile.endsWith(".md")) {
          return new Response("Forbidden", { status: 403 });
        }

        const file = Bun.file(absFile);
        if (!(await file.exists())) {
          return new Response("Not found", { status: 404 });
        }

        const rawMarkdown = await file.text();
        return new Response(
          JSON.stringify({ rawMarkdown, filename: reqPath }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      const feedbackResponse = await handleFeedbackRequest(req, url.pathname);
      if (feedbackResponse) return feedbackResponse;

      return new Response("Not found", { status: 404 });
    },
  });

  console.log(`\nmd-review: opening http://localhost:${port}`);
  Bun.spawn(["open", `http://localhost:${port}`]);
}
