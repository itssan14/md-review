import { generateHTML } from './html'

async function findFreePort(start: number): Promise<number> {
  for (let port = start; port < start + 100; port++) {
    try {
      const server = Bun.serve({ port, fetch: () => new Response() })
      server.stop(true)
      return port
    } catch {
      continue
    }
  }
  throw new Error('Could not find a free port')
}

export async function startServer(content: string, filename: string) {
  const port = await findFreePort(3849)
  const html = generateHTML(content, filename)

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url)

      if (url.pathname === '/') {
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        })
      }

      if (url.pathname === '/done' && req.method === 'POST') {
        // sendBeacon sends text/plain; regular fetch sends application/json
        const body = await req.text()
        const { feedback, count } = JSON.parse(body) as { feedback: string; count: number }

        if (count > 0) {
          const proc = Bun.spawn(['pbcopy'], { stdin: 'pipe' })
          proc.stdin.write(feedback)
          proc.stdin.end()
          await proc.exited
          console.log(`\n✓ ${count} comment${count === 1 ? '' : 's'} copied to clipboard`)
        } else {
          console.log('\n(No comments — clipboard unchanged)')
        }

        setTimeout(() => process.exit(0), 200)
        return new Response('ok')
      }

      return new Response('Not found', { status: 404 })
    },
  })

  console.log(`\nmd-review: opening http://localhost:${port}`)
  Bun.spawn(['open', `http://localhost:${port}`])
}
