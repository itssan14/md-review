#!/usr/bin/env bun

import { startServer } from './server'

const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: md-review <file.md>')
  process.exit(1)
}

const file = Bun.file(filePath)

if (!(await file.exists())) {
  console.error(`Error: file not found — ${filePath}`)
  process.exit(1)
}

const content = await file.text()
const filename = filePath.split('/').pop()!

await startServer(content, filename)
