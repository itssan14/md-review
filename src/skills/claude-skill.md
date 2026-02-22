# md-review — Markdown Document Review

## When to use

Use `md-review` when the user asks you to review, annotate, or give feedback on a markdown document (`.md` file). This opens an interactive browser-based review UI where the user can:

- Read the rendered markdown with syntax highlighting and mermaid diagrams
- Select text and add inline comments (Google Docs-style margin comments)
- Add a general comment about the overall document
- Click "Done & Copy" to copy all feedback to the clipboard

## How to invoke

```bash
md-review <path-to-file.md>
```

This starts a local server and opens the review UI in the default browser.

## What to expect

After the user finishes reviewing and clicks "Done & Copy", their feedback is copied to the clipboard in this format:

```
Feedback on: filename.md

L5 [The introduction section...]: This needs more context about the problem.
L12-15 [Implementation details...]: Consider adding a sequence diagram here.

General: Overall the document is well-structured but needs more examples.
```

The server stays running so the user can continue editing comments. The CLI prints a confirmation when feedback is copied.

## Installation

```bash
md-review install-skill
```
