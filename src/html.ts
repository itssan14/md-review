export function generateHTML(rawMarkdown: string, filename: string): string {
  const escapedMarkdown = JSON.stringify(rawMarkdown)
  const escapedFilename = JSON.stringify(filename)

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>md-review: ${filename}</title>

<!-- highlight.js themes -->
<link id="hljs-light" rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css">
<link id="hljs-dark" rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css" disabled>

<!-- highlight.js -->
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"><\/script>

<!-- marked.js -->
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"><\/script>

<!-- mermaid (ESM, loaded async) -->
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  const savedTheme = localStorage.getItem('md-review-theme') || 'light';
  mermaid.initialize({ startOnLoad: false, theme: savedTheme === 'dark' ? 'dark' : 'default' });
  window.__mermaid = mermaid;
  window.dispatchEvent(new Event('mermaid-ready'));
<\/script>

<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #fafaf9;
    --surface: #ffffff;
    --border: #e7e5e4;
    --text: #1c1917;
    --text-secondary: #78716c;
    --accent: #2563eb;
    --accent-light: #eff6ff;
    --annotation-bg: #fefce8;
    --annotation-border: #eab308;
    --red: #ef4444;
    --green: #16a34a;
    --radius: 6px;
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, monospace;
    --code-bg: #f5f5f4;
    --pre-bg: #1e1e1e;
    --pre-text: #d4d4d4;
    --table-header-bg: #f5f5f4;
    --range-bg: rgba(37, 99, 235, 0.08);
    --range-border: var(--accent);
  }

  [data-theme="dark"] {
    --bg: #1a1a1a;
    --surface: #242424;
    --border: #3a3a3a;
    --text: #e0e0e0;
    --text-secondary: #9ca3af;
    --accent: #60a5fa;
    --accent-light: rgba(96, 165, 250, 0.1);
    --annotation-bg: rgba(234, 179, 8, 0.1);
    --annotation-border: #ca8a04;
    --red: #f87171;
    --green: #4ade80;
    --code-bg: #2d2d2d;
    --pre-bg: #0d1117;
    --pre-text: #e6edf3;
    --table-header-bg: #2d2d2d;
    --range-bg: rgba(96, 165, 250, 0.1);
    --range-border: #60a5fa;
  }

  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    display: flex;
    min-height: 100vh;
    padding-right: 340px;
  }

  /* Main wrapper */
  #main-wrapper {
    max-width: 840px;
    width: 100%;
    margin: 0 auto;
  }

  /* Content area */
  #content-area {
    position: relative;
    padding: 48px 40px 120px;
  }

  /* Floating comment button */
  #comment-float-btn {
    display: none;
    position: absolute;
    z-index: 200;
    padding: 4px 12px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius);
    font-family: var(--font);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    user-select: none;
  }

  #content-area h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5em 0 0.5em; line-height: 1.25; }
  #content-area h2 { font-size: 1.5rem; font-weight: 600; margin: 1.4em 0 0.4em; line-height: 1.3; }
  #content-area h3 { font-size: 1.25rem; font-weight: 600; margin: 1.3em 0 0.35em; }
  #content-area h4 { font-size: 1.1rem; font-weight: 600; margin: 1.2em 0 0.3em; }
  #content-area h5 { font-size: 1rem; font-weight: 600; margin: 1.1em 0 0.25em; }
  #content-area h6 { font-size: 0.9rem; font-weight: 600; margin: 1em 0 0.2em; }
  #content-area p { margin: 0.75em 0; }
  #content-area ul, #content-area ol { margin: 0.75em 0; padding-left: 1.75em; }
  #content-area li { margin: 0.25em 0; }
  #content-area li.task-list-item { list-style: none; margin-left: -1.5em; }
  #content-area li.task-list-item input[type="checkbox"] { margin-right: 0.5em; pointer-events: none; }
  #content-area blockquote {
    border-left: 3px solid var(--border);
    padding: 0.25em 1em;
    margin: 0.75em 0;
    color: var(--text-secondary);
  }
  #content-area pre {
    background: var(--pre-bg);
    color: var(--pre-text);
    border-radius: var(--radius);
    padding: 16px;
    overflow-x: auto;
    margin: 0.75em 0;
    font-family: var(--mono);
    font-size: 0.875rem;
    line-height: 1.5;
  }
  #content-area code {
    font-family: var(--mono);
    font-size: 0.875em;
    background: var(--code-bg);
    padding: 2px 5px;
    border-radius: 3px;
  }
  #content-area pre code {
    background: none;
    padding: 0;
    font-size: inherit;
  }
  #content-area table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.75em 0;
  }
  #content-area th, #content-area td {
    border: 1px solid var(--border);
    padding: 8px 12px;
    text-align: left;
  }
  #content-area th { background: var(--table-header-bg); font-weight: 600; }
  #content-area hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
  #content-area img { max-width: 100%; border-radius: var(--radius); }
  #content-area a { color: var(--accent); text-decoration: none; }
  #content-area a:hover { text-decoration: underline; }

  /* Mermaid containers */
  .mermaid-container {
    margin: 0.75em 0;
    overflow-x: auto;
  }
  .mermaid-container svg { max-width: 100%; height: auto; }
  .mermaid-source { display: none; }

  /* Annotatable blocks */
  .annotatable {
    position: relative;
    border-radius: var(--radius);
    transition: background 0.15s;
  }
  .annotatable:hover { background: var(--accent-light); }
  .has-comment { background: var(--annotation-bg); border-left: 3px solid var(--annotation-border); }
  .has-comment:hover { background: var(--annotation-bg); }

  /* Range selection highlight */
  .range-selected {
    background: var(--range-bg) !important;
    border-left: 2px solid var(--range-border);
  }

  /* Inline comment form — placed AFTER the block, not inside */
  .comment-form-wrapper {
    margin: 8px 0 4px;
  }
  .comment-form-wrapper .range-label {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--accent);
    font-weight: 600;
    margin-bottom: 4px;
  }
  .comment-form {
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }
  .comment-form textarea {
    flex: 1;
    font-family: var(--font);
    font-size: 0.875rem;
    padding: 8px 10px;
    border: 1.5px solid var(--accent);
    border-radius: var(--radius);
    resize: vertical;
    min-height: 38px;
    outline: none;
    line-height: 1.4;
    background: var(--surface);
    color: var(--text);
  }
  .comment-form textarea:focus { border-color: #1d4ed8; box-shadow: 0 0 0 2px rgba(37,99,235,0.15); }
  .comment-form button {
    padding: 8px 12px;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
  }
  .btn-save { background: var(--accent); color: white; }
  .btn-save:hover { background: #1d4ed8; }
  .btn-cancel { background: var(--border); color: var(--text); }
  .btn-cancel:hover { background: #d6d3d1; }

  /* Sidebar */
  #sidebar {
    position: fixed;
    top: 0;
    right: 0;
    width: 340px;
    height: 100vh;
    background: var(--surface);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 100;
    box-shadow: -2px 0 8px rgba(0,0,0,0.04);
  }
  #sidebar-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  #sidebar-header h2 { font-size: 0.95rem; font-weight: 600; margin: 0; }
  #comment-count {
    background: var(--accent);
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
    min-width: 20px;
    text-align: center;
  }
  #theme-toggle {
    margin-left: auto;
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    padding: 4px 8px;
    font-size: 1rem;
    line-height: 1;
    color: var(--text);
    transition: background 0.15s;
  }
  #theme-toggle:hover { background: var(--accent-light); }
  #comment-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px 0;
  }
  .comment-item {
    padding: 10px 20px;
    border-bottom: 1px solid var(--border);
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.1s;
  }
  .comment-item:hover { background: var(--accent-light); }
  .comment-item .comment-ref {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--accent);
    font-weight: 600;
  }
  .comment-item .comment-context {
    color: var(--text-secondary);
    font-size: 0.78rem;
    margin: 2px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .comment-item .comment-text { margin-top: 4px; line-height: 1.4; }
  .comment-item .comment-actions {
    margin-top: 6px;
    display: flex;
    gap: 8px;
  }
  .comment-item .comment-actions button {
    font-size: 0.72rem;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    color: var(--text-secondary);
  }
  .comment-item .comment-actions button:hover { color: var(--accent); }
  .comment-item .comment-actions .del-btn:hover { color: var(--red); }

  /* General comment */
  #general-comment {
    padding: 12px 20px;
    border-top: 1px solid var(--border);
  }
  #general-comment label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--text-secondary);
  }
  #general-comment textarea {
    width: 100%;
    font-family: var(--font);
    font-size: 0.85rem;
    padding: 8px 10px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    resize: vertical;
    min-height: 60px;
    outline: none;
    line-height: 1.4;
    background: var(--surface);
    color: var(--text);
  }
  #general-comment textarea:focus { border-color: var(--accent); }

  /* Done button */
  #done-area {
    padding: 12px 20px;
    border-top: 1px solid var(--border);
  }
  #done-btn {
    width: 100%;
    padding: 10px;
    background: var(--green);
    color: white;
    border: none;
    border-radius: var(--radius);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  #done-btn:hover { background: #15803d; }
  [data-theme="dark"] #done-btn:hover { background: #22c55e; }

  /* Empty state */
  .empty-state {
    padding: 40px 20px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.6;
  }
</style>
</head>
<body>

<div id="main-wrapper">
  <div id="content-area"></div>
  <button id="comment-float-btn">Comment</button>
</div>

<div id="sidebar">
  <div id="sidebar-header">
    <h2>Comments</h2>
    <span id="comment-count">0</span>
    <button id="theme-toggle" title="Toggle theme">&#9790;</button>
  </div>
  <div id="comment-list">
    <div class="empty-state">Select text in the document<br>to add a comment</div>
  </div>
  <div id="general-comment">
    <label>General comment</label>
    <textarea id="general-text" placeholder="Overall thoughts on the document..."></textarea>
  </div>
  <div id="done-area">
    <button id="done-btn">Done &amp; Copy</button>
  </div>
</div>

<script>
// --- App State ---
const rawMarkdown = ${escapedMarkdown};
const filename = ${escapedFilename};
const comments = []; // { startLine, endLine, context, text }

// --- Theme ---
function initTheme() {
  const saved = localStorage.getItem('md-review-theme') || 'light';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('md-review-theme', theme);
  const btn = document.getElementById('theme-toggle');
  btn.innerHTML = theme === 'dark' ? '&#9788;' : '&#9790;';
  btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  // swap hljs stylesheets
  document.getElementById('hljs-light').disabled = (theme === 'dark');
  document.getElementById('hljs-dark').disabled = (theme !== 'dark');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  // re-init mermaid with new theme
  if (window.__mermaid) {
    window.__mermaid.initialize({ startOnLoad: false, theme: next === 'dark' ? 'dark' : 'default' });
    renderMermaidBlocks();
  }
}

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
initTheme();

// --- Configure marked ---
marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    code(obj) {
      const text = typeof obj === 'string' ? obj : (obj.text || '');
      const lang = typeof obj === 'string' ? '' : (obj.lang || '');
      if (lang === 'mermaid') {
        const id = 'mermaid-' + Math.random().toString(36).slice(2, 9);
        return '<div class="mermaid-container" data-mermaid-id="' + id + '">'
          + '<pre class="mermaid-source">' + escapeForHTML(text) + '</pre>'
          + '<div class="mermaid-render"></div>'
          + '</div>';
      }
      const langClass = lang ? ' class="language-' + escapeForHTML(lang) + '"' : '';
      return '<pre><code' + langClass + '>' + escapeForHTML(text) + '</code></pre>';
    },
    listitem(obj) {
      const text = typeof obj === 'string' ? obj : (obj.text || '');
      const task = typeof obj === 'string' ? undefined : obj.task;
      const checked = typeof obj === 'string' ? false : obj.checked;
      if (task) {
        const checkbox = '<input type="checkbox"' + (checked ? ' checked' : '') + ' disabled> ';
        return '<li class="task-list-item">' + checkbox + text + '</li>\\n';
      }
      return '<li>' + text + '</li>\\n';
    }
  }
});

// --- Line Map ---
// Tracks { startLine, endLine, type, text } per block.
function buildLineMap(src) {
  const lines = src.split('\\n');
  const map = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // blank line
    if (line.trim() === '') { i++; continue; }

    // fenced code block
    const fenceMatch = line.match(/^\`\`\`(\\w*)/);
    if (fenceMatch) {
      const startLine = i + 1;
      const lang = fenceMatch[1] || '';
      i++;
      while (i < lines.length && !lines[i].startsWith('\`\`\`')) { i++; }
      const endLine = i + 1; // closing fence
      i++; // skip closing fence
      map.push({ startLine, endLine, type: lang === 'mermaid' ? 'mermaid' : 'code', text: '(code block)' });
      continue;
    }

    // heading
    const headingMatch = line.match(/^(#{1,6})\\s+(.+)/);
    if (headingMatch) {
      map.push({ startLine: i + 1, endLine: i + 1, type: 'heading', text: headingMatch[2] });
      i++; continue;
    }

    // hr
    if (/^(---|___|\\*\\*\\*)\\s*$/.test(line.trim())) {
      map.push({ startLine: i + 1, endLine: i + 1, type: 'hr', text: '---' });
      i++; continue;
    }

    // blockquote
    if (line.startsWith('> ') || line === '>') {
      const startLine = i + 1;
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) { i++; }
      map.push({ startLine, endLine: i, type: 'blockquote', text: lines[startLine - 1].replace(/^>\\s?/, '') });
      continue;
    }

    // table (header row + separator row)
    if (line.includes('|') && i + 1 < lines.length && /^[\\s|:\\-]+$/.test(lines[i + 1])) {
      const startLine = i + 1;
      i += 2; // skip header + separator
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') { i++; }
      map.push({ startLine, endLine: i, type: 'table', text: lines[startLine - 1] });
      continue;
    }

    // list (consume all contiguous list items)
    const listMatch = line.match(/^(\\s*)[\\-\\*\\+]\\s+/) || line.match(/^(\\s*)\\d+\\.\\s+/);
    if (listMatch) {
      const startLine = i + 1;
      while (i < lines.length) {
        const l = lines[i];
        if (l.trim() === '') { break; }
        if (/^\\s*[\\-\\*\\+]\\s+/.test(l) || /^\\s*\\d+\\.\\s+/.test(l) || /^\\s{2,}/.test(l)) {
          i++;
        } else { break; }
      }
      map.push({ startLine, endLine: i, type: 'list', text: lines[startLine - 1].replace(/^\\s*[\\-\\*\\+\\d\\.]+\\s+/, '') });
      continue;
    }

    // paragraph (contiguous non-blank, non-special lines)
    {
      const startLine = i + 1;
      let paraText = '';
      while (i < lines.length && lines[i].trim() !== '' &&
             !lines[i].match(/^#{1,6}\\s/) &&
             !lines[i].match(/^\`\`\`/) &&
             !lines[i].match(/^\\s*[\\-\\*\\+]\\s/) &&
             !lines[i].match(/^\\s*\\d+\\.\\s/) &&
             !lines[i].startsWith('> ') &&
             !(lines[i].includes('|') && i + 1 < lines.length && /^[\\s|:\\-]+$/.test(lines[i + 1] || '')) &&
             !(/^(---|___|\\*\\*\\*)\\s*$/.test(lines[i].trim()))) {
        paraText += (paraText ? ' ' : '') + lines[i];
        i++;
      }
      map.push({ startLine, endLine: i, type: 'paragraph', text: paraText });
    }
  }
  return map;
}

// --- Block matching ---
// Uses _used flag for sequential matching of code/table/mermaid blocks.
function matchBlockToMap(el, lineMap) {
  const tag = el.tagName.toLowerCase();

  // mermaid container
  if (el.classList.contains('mermaid-container')) {
    const entry = lineMap.find(m => m.type === 'mermaid' && !m._used);
    if (entry) { entry._used = true; return entry; }
    return null;
  }

  // code block
  if (tag === 'pre' && !el.classList.contains('mermaid-source')) {
    const entry = lineMap.find(m => m.type === 'code' && !m._used);
    if (entry) { entry._used = true; return entry; }
    return null;
  }

  // table
  if (tag === 'table') {
    const entry = lineMap.find(m => m.type === 'table' && !m._used);
    if (entry) { entry._used = true; return entry; }
    return null;
  }

  // hr
  if (tag === 'hr') {
    const entry = lineMap.find(m => m.type === 'hr' && !m._used);
    if (entry) { entry._used = true; return entry; }
    return null;
  }

  const text = (el.textContent || '').trim();
  const first40 = text.slice(0, 40);

  // heading
  if (/^h[1-6]$/.test(tag)) {
    const entry = lineMap.find(m => m.type === 'heading' && !m._used && first40.startsWith(m.text.slice(0, 30)));
    if (entry) { entry._used = true; return entry; }
  }

  // blockquote
  if (tag === 'blockquote') {
    const entry = lineMap.find(m => m.type === 'blockquote' && !m._used);
    if (entry) { entry._used = true; return entry; }
    return null;
  }

  // list
  if (tag === 'ul' || tag === 'ol') {
    const entry = lineMap.find(m => m.type === 'list' && !m._used);
    if (entry) { entry._used = true; return entry; }
    return null;
  }

  // paragraph — text content match
  if (tag === 'p') {
    const entry = lineMap.find(m => m.type === 'paragraph' && !m._used && first40 && m.text.slice(0, 30).trim() !== '' && first40.startsWith(m.text.slice(0, 30).trim()));
    if (entry) { entry._used = true; return entry; }
    // fallback: next unused paragraph
    const fallback = lineMap.find(m => m.type === 'paragraph' && !m._used);
    if (fallback) { fallback._used = true; return fallback; }
  }

  return null;
}

// --- Mermaid rendering ---
async function renderMermaidBlocks() {
  if (!window.__mermaid) return;
  const containers = document.querySelectorAll('.mermaid-container');
  for (const container of containers) {
    const source = container.querySelector('.mermaid-source');
    const renderDiv = container.querySelector('.mermaid-render');
    if (!source || !renderDiv) continue;
    const code = source.textContent || '';
    const id = container.getAttribute('data-mermaid-id') || 'mermaid-' + Math.random().toString(36).slice(2, 9);
    try {
      const { svg } = await window.__mermaid.render(id, code);
      renderDiv.innerHTML = svg;
    } catch (e) {
      renderDiv.innerHTML = '<pre style="color:var(--red);font-size:0.8rem;">Mermaid error: ' + escapeForHTML(e.message || String(e)) + '</pre>';
    }
  }
}

// --- Selection-based commenting ---
let pendingSelection = null; // { startLine, endLine, block, selectedText }

function findAnnotatableAncestor(node) {
  let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (el && el.id !== 'content-area') {
    if (el.hasAttribute && el.hasAttribute('data-start-line')) return el;
    el = el.parentElement;
  }
  return null;
}

function handleSelectionChange() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.toString().trim()) { hideFloatBtn(); return; }

  const contentArea = document.getElementById('content-area');
  if (!contentArea.contains(sel.anchorNode) || !contentArea.contains(sel.focusNode)) { hideFloatBtn(); return; }

  const anchorBlock = findAnnotatableAncestor(sel.anchorNode);
  const focusBlock = findAnnotatableAncestor(sel.focusNode);
  if (!anchorBlock || !focusBlock) { hideFloatBtn(); return; }

  const aStart = parseInt(anchorBlock.getAttribute('data-start-line'), 10);
  const aEnd = parseInt(anchorBlock.getAttribute('data-end-line'), 10);
  const fStart = parseInt(focusBlock.getAttribute('data-start-line'), 10);
  const fEnd = parseInt(focusBlock.getAttribute('data-end-line'), 10);

  const startLine = Math.min(aStart, fStart);
  const endLine = Math.max(aEnd, fEnd);
  const laterBlock = anchorBlock.offsetTop > focusBlock.offsetTop ? anchorBlock : focusBlock;

  pendingSelection = { startLine, endLine, block: laterBlock, selectedText: sel.toString().trim() };

  const range = sel.getRangeAt(0);
  showFloatBtn(range);
}

function showFloatBtn(range) {
  const btn = document.getElementById('comment-float-btn');
  const contentArea = document.getElementById('content-area');
  const rect = range.getBoundingClientRect();
  const areaRect = contentArea.getBoundingClientRect();

  btn.style.top = (rect.bottom - areaRect.top + 6) + 'px';
  btn.style.left = (rect.left - areaRect.left + rect.width / 2 - 30) + 'px';
  btn.style.display = 'block';
}

function hideFloatBtn() {
  const btn = document.getElementById('comment-float-btn');
  btn.style.display = 'none';
  pendingSelection = null;
}

function initSelectionListener() {
  const contentArea = document.getElementById('content-area');
  const btn = document.getElementById('comment-float-btn');

  contentArea.addEventListener('mouseup', () => {
    setTimeout(handleSelectionChange, 10);
  });

  document.addEventListener('mousedown', (e) => {
    if (e.target === btn) return;
    hideFloatBtn();
  });

  btn.addEventListener('click', () => {
    if (!pendingSelection) return;
    const { startLine, endLine, block, selectedText } = pendingSelection;
    hideFloatBtn();
    highlightRange(startLine, endLine);
    openCommentForm(block, startLine, endLine, selectedText);
    window.getSelection().removeAllRanges();
  });
}

function highlightRange(startLine, endLine) {
  clearRangeSelection();
  const blocks = document.querySelectorAll('#content-area [data-start-line]');
  blocks.forEach(block => {
    const bStart = parseInt(block.getAttribute('data-start-line'), 10);
    const bEnd = parseInt(block.getAttribute('data-end-line'), 10);
    if (bStart >= startLine && bEnd <= endLine) {
      block.classList.add('range-selected');
    }
  });
}

function clearRangeSelection() {
  document.querySelectorAll('.range-selected').forEach(el => el.classList.remove('range-selected'));
}

// --- Comment Form ---
function openCommentForm(block, startLine, endLine, selectedContext) {
  // remove any existing form
  const existing = document.querySelector('.comment-form-wrapper');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.className = 'comment-form-wrapper';

  // range label
  const rangeLabel = document.createElement('div');
  rangeLabel.className = 'range-label';
  rangeLabel.textContent = startLine === endLine ? 'L' + startLine : 'L' + startLine + '-' + endLine;
  wrapper.appendChild(rangeLabel);

  const form = document.createElement('div');
  form.className = 'comment-form';

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Add comment...';
  textarea.rows = 1;

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-save';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = '\\u00d7';

  form.appendChild(textarea);
  form.appendChild(saveBtn);
  form.appendChild(cancelBtn);
  wrapper.appendChild(form);

  // place form AFTER the block, not inside it
  block.insertAdjacentElement('afterend', wrapper);
  textarea.focus();

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
    if (e.key === 'Escape') { wrapper.remove(); clearRangeSelection(); hideFloatBtn(); }
  });

  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', () => { wrapper.remove(); clearRangeSelection(); hideFloatBtn(); });

  function save() {
    const text = textarea.value.trim();
    if (!text) return;
    const context = selectedContext || (block.textContent || '').trim().slice(0, 60);
    comments.push({ startLine, endLine, context, text });
    block.classList.add('has-comment');
    wrapper.remove();
    clearRangeSelection();
    pendingSelection = null;
    renderSidebar();
  }
}

// --- Render (async) ---
async function render() {
  const contentArea = document.getElementById('content-area');
  const renderedHTML = marked.parse(rawMarkdown);
  contentArea.innerHTML = renderedHTML;

  // syntax highlighting
  if (typeof hljs !== 'undefined') {
    contentArea.querySelectorAll('pre code[class*="language-"]').forEach(block => {
      hljs.highlightElement(block);
    });
  }

  // mermaid: wait for module if not loaded yet
  if (!window.__mermaid) {
    await new Promise(resolve => {
      window.addEventListener('mermaid-ready', resolve, { once: true });
      // timeout fallback
      setTimeout(resolve, 5000);
    });
  }
  await renderMermaidBlocks();

  // build line map and assign data attributes
  const lineMap = buildLineMap(rawMarkdown);

  const blocks = Array.from(contentArea.children).filter(el => {
    const tag = el.tagName.toLowerCase();
    return /^(h[1-6]|p|ul|ol|blockquote|pre|table|hr)$/.test(tag)
      || el.classList.contains('mermaid-container');
  });

  blocks.forEach(block => {
    const entry = matchBlockToMap(block, lineMap);
    if (entry) {
      block.classList.add('annotatable');
      block.setAttribute('data-start-line', entry.startLine);
      block.setAttribute('data-end-line', entry.endLine);
    }
  });

}

// --- Sidebar ---
function renderSidebar() {
  const list = document.getElementById('comment-list');
  const countEl = document.getElementById('comment-count');
  countEl.textContent = comments.length;

  if (comments.length === 0) {
    list.innerHTML = '<div class="empty-state">Select text in the document<br>to add a comment</div>';
    return;
  }

  list.innerHTML = '';
  comments.forEach((c, idx) => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    const ref = c.startLine === c.endLine ? 'L' + c.startLine : 'L' + c.startLine + '-' + c.endLine;
    item.innerHTML =
      '<div class="comment-ref">' + ref + '</div>' +
      '<div class="comment-context">' + escapeForHTML(c.context) + '</div>' +
      '<div class="comment-text">' + escapeForHTML(c.text) + '</div>' +
      '<div class="comment-actions">' +
        '<button class="edit-btn">edit</button>' +
        '<button class="del-btn">delete</button>' +
      '</div>';

    item.querySelector('.edit-btn').addEventListener('click', (e) => { e.stopPropagation(); editComment(idx); });
    item.querySelector('.del-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteComment(idx); });
    item.addEventListener('click', () => {
      const target = document.querySelector('[data-start-line="' + c.startLine + '"]');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    list.appendChild(item);
  });
}

function editComment(idx) {
  const c = comments[idx];
  const newText = prompt('Edit comment:', c.text);
  if (newText !== null && newText.trim() !== '') {
    comments[idx].text = newText.trim();
    renderSidebar();
  }
}

function deleteComment(idx) {
  const c = comments[idx];
  comments.splice(idx, 1);
  // remove highlight if no more comments on that line range
  if (!comments.some(x => x.startLine === c.startLine)) {
    const el = document.querySelector('[data-start-line="' + c.startLine + '"]');
    if (el) el.classList.remove('has-comment');
  }
  renderSidebar();
}

function escapeForHTML(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// --- Feedback Formatting ---
function buildFeedback() {
  let out = 'Feedback on: ' + filename + '\\n\\n';

  const sorted = [...comments].sort((a, b) => a.startLine - b.startLine);
  sorted.forEach(c => {
    const ctx = c.context.length > 50 ? c.context.slice(0, 50) + '...' : c.context;
    const ref = c.startLine === c.endLine ? 'L' + c.startLine : 'L' + c.startLine + '-' + c.endLine;
    out += ref + ' [' + ctx + ']: ' + c.text + '\\n';
  });

  const general = document.getElementById('general-text').value.trim();
  if (general) {
    out += '\\nGeneral: ' + general + '\\n';
  }

  return { feedback: out, count: sorted.length + (general ? 1 : 0) };
}

// --- Done & Copy ---
document.getElementById('done-btn').addEventListener('click', async () => {
  const { feedback, count } = buildFeedback();
  try {
    await fetch('/done', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback, count }),
    });
  } catch {}
  window.close();
  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:var(--text-secondary);font-size:1.1rem;">Feedback copied. You can close this tab.</div>';
});

// --- Fallback: beforeunload beacon ---
let beaconSent = false;
window.addEventListener('beforeunload', () => {
  if (!beaconSent) {
    beaconSent = true;
    const { feedback, count } = buildFeedback();
    navigator.sendBeacon('/done', JSON.stringify({ feedback, count }));
  }
});

// --- Init ---
render().then(() => {
  renderSidebar();
  initSelectionListener();
});
<\/script>
</body>
</html>`
}
