# Sidebar Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** In folder mode, move the Copy/Post toolbar into the sidebar, make the sidebar width user-resizable via drag, and show the general comment textarea open by default.

**Architecture:** All three changes are isolated to `App.tsx`, `Toolbar.tsx`, and `GeneralComment.tsx`. No new files needed. The Toolbar gets an `variant="inline"` path that renders a compact button row instead of a fixed overlay. The sidebar gets a drag handle div + SolidJS signal for width. GeneralComment gets a `defaultExpanded` prop.

**Tech Stack:** SolidJS signals, Tailwind CSS v4, TypeScript

---

## Context

The current folder mode layout:

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (w-64, fixed)  │  Content  │  Margin (320px) │
│  - file tree            │           │                 │
│  - GeneralComment       │           │                 │
├─────────────────────────┴───────────┴─────────────────┤
│         fixed bottom bar: [N comments] [Copy] [Post]  │
└──────────────────────────────────────────────────────┘
```

Target layout:

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (resizable)    │  Content  │  Margin (320px) │
│  - file tree            │           │                 │
│  - General comment ▾    │           │                 │  ← open by default
│    [textarea]           │           │                 │
│  ──────────────────     │           │                 │
│  [N] [     Copy] [Post] │           │                 │  ← toolbar moved here
│                       ↕ drag handle                   │
└──────────────────────────────────────────────────────┘
```

No fixed bottom bar in folder mode. File mode is unchanged.

---

## Task 1 — Add `variant="inline"` to Toolbar

**Files:**
- Modify: `src/app/components/Toolbar.tsx`

The Toolbar currently always renders as `fixed bottom-0 left-0 right-0`. Add a `variant?: "inline"` prop so it can render as a normal in-flow element when placed inside the sidebar.

**Step 1: Add `variant` to the props interface**

```tsx
interface ToolbarProps {
  mode: "file" | "folder";
  variant?: "inline";        // ← add this
  filename?: string;
  folderName?: string;
  generalTextRef: () => HTMLTextAreaElement | undefined;
  onToast: (msg: string) => void;
}
```

**Step 2: Add the inline render path before the existing `return`**

The inline toolbar is a compact row: comment count badge + label on the left, Copy + Post buttons on the right. No fixed positioning, no backdrop blur, no `max-w-[1200px]` centering wrapper.

```tsx
if (props.variant === "inline") {
  return (
    <div class="border-t border-neutral-200 dark:border-neutral-700 px-2 py-2 flex items-center gap-2">
      <span class="inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 bg-blue-600 text-white text-[0.65rem] font-semibold rounded-full flex-shrink-0">
        {comments.length}
      </span>
      <span class="text-[13px] text-neutral-500 dark:text-neutral-400 flex-1">
        comment{comments.length === 1 ? "" : "s"}
      </span>
      <button
        class="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-md text-xs font-medium cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900"
        onClick={handleCopy}
      >
        Copy
      </button>
      <button
        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold cursor-pointer border-none"
        onClick={handlePost}
      >
        Post
      </button>
    </div>
  );
}
```

Place this block after `handlePost` and before the existing `return (`.

**Step 3: Verify build passes**

```sh
bun run build
```

Expected: build succeeds, no TypeScript errors.

---

## Task 2 — Move toolbar into sidebar in `App.tsx`

**Files:**
- Modify: `src/app/App.tsx`

**Step 1: Replace the standalone `<Toolbar>` at the bottom of folder mode with the inline variant inside the sidebar**

In the folder mode JSX, the current sidebar footer is:

```tsx
<div class="px-2 py-2">
  <GeneralComment compact textRef={(el) => (generalTextEl = el)} />
</div>
```

And below the main div:

```tsx
<Toolbar
  mode="folder"
  folderName={folderName}
  generalTextRef={() => generalTextEl}
  onToast={setToastMsg}
/>
```

Replace the sidebar footer + standalone Toolbar with:

```tsx
{/* GeneralComment — now its own section */}
<div class="px-2 py-2 border-t border-neutral-200 dark:border-neutral-700">
  <GeneralComment compact defaultExpanded textRef={(el) => (generalTextEl = el)} />
</div>

{/* Inline toolbar — replaces fixed bottom bar */}
<Toolbar
  variant="inline"
  mode="folder"
  folderName={folderName}
  generalTextRef={() => generalTextEl}
  onToast={setToastMsg}
/>
```

And **remove** the standalone `<Toolbar ... />` that was sitting outside the sidebar div (below the main panel div).

**Step 2: Remove `pb-16` from content and margin columns, remove `pb-14` from sidebar**

These paddings existed solely to clear the fixed bottom toolbar. With the toolbar now in the sidebar's normal flow, they're not needed.

```diff
- <div class="w-64 h-full pb-14 border-r ...">
+ <div class="w-64 h-full border-r ...">

- <div class="overflow-y-auto overflow-x-auto h-full pb-16 min-w-0">
+ <div class="overflow-y-auto overflow-x-auto h-full min-w-0">

- <div class="pt-12 overflow-y-auto h-full pb-16 pr-3">
+ <div class="pt-12 overflow-y-auto h-full pr-3">
```

**Step 3: Verify build + visual check**

```sh
bun run build && bun src/cli/index.ts /tmp/md-review-test/
```

Expected: no fixed bottom bar in folder mode; sidebar shows file tree → general comment → Copy/Post buttons, all fitting within the sidebar without clipping. File mode still has the full-width toolbar.

---

## Task 3 — Resizable sidebar

**Files:**
- Modify: `src/app/App.tsx`

This adds a drag handle to the right edge of the sidebar. Dragging it adjusts a `sidebarWidth` signal. The handle uses raw DOM mouse events (not SolidJS event delegation) because the drag must track outside the sidebar element.

**Step 1: Add the `sidebarWidth` signal and drag constants near the top of the `App()` function (folder mode section, after `const { folderName, tree } = data`)**

```tsx
const MIN_SIDEBAR = 160;
const MAX_SIDEBAR = 600;
const [sidebarWidth, setSidebarWidth] = createSignal(256);

let dragStartX = 0;
let dragStartWidth = 0;

function onSidebarDragStart(e: MouseEvent) {
  dragStartX = e.clientX;
  dragStartWidth = sidebarWidth();
  document.addEventListener("mousemove", onSidebarDragMove);
  document.addEventListener("mouseup", onSidebarDragEnd);
  e.preventDefault();
}

function onSidebarDragMove(e: MouseEvent) {
  const delta = e.clientX - dragStartX;
  setSidebarWidth(
    Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, dragStartWidth + delta)),
  );
}

function onSidebarDragEnd() {
  document.removeEventListener("mousemove", onSidebarDragMove);
  document.removeEventListener("mouseup", onSidebarDragEnd);
}
```

**Step 2: Replace the sidebar's fixed `w-64` class with the dynamic signal width, and add the drag handle**

Change the sidebar outer `<div>` from:

```tsx
<div class="w-64 h-full border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col flex-shrink-0">
```

To:

```tsx
<div
  class="h-full border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col flex-shrink-0 relative"
  style={{ width: `${sidebarWidth()}px` }}
>
```

Then add the drag handle as the **last child** of the sidebar div (after the inline Toolbar), so it sits on top of the right border:

```tsx
{/* Resize handle */}
<div
  class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400/40 active:bg-blue-500/50 transition-colors z-10"
  onMouseDown={onSidebarDragStart}
/>
```

**Step 3: Verify build + manual drag test**

```sh
bun run build && bun src/cli/index.ts /tmp/md-review-test/
```

Expected:
- Hovering the right edge of the sidebar shows a `col-resize` cursor and a subtle blue highlight
- Dragging left/right resizes the sidebar between 160px and 600px
- File names that were previously truncated become visible when widened
- Layout reflows correctly as width changes

---

## Task 4 — General comment open by default

**Files:**
- Modify: `src/app/components/GeneralComment.tsx`

**Step 1: Add `defaultExpanded` prop**

```diff
 interface GeneralCommentProps {
   textRef: (el: HTMLTextAreaElement) => void;
   compact?: boolean;
+  defaultExpanded?: boolean;
 }
```

**Step 2: Use it to initialise the signal**

```diff
- const [expanded, setExpanded] = createSignal(false);
+ const [expanded, setExpanded] = createSignal(props.defaultExpanded ?? false);
```

This affects both the compact and default render paths.

**Step 3: Verify build + typecheck**

```sh
bun run typecheck && bun run build
```

Expected: no errors. In the browser, the general comment textarea is visible immediately when the sidebar loads; clicking the toggle collapses/expands it.

---

## Verification

```sh
# Full quality check
bun run typecheck && bun run lint && bun run build

# Launch folder mode
bun src/cli/index.ts /tmp/md-review-test/

# Checklist:
# ✓ No fixed bottom bar in folder mode
# ✓ Sidebar footer shows: general comment textarea (open) → Copy/Post row
# ✓ Drag the sidebar right edge → resizes smoothly between 160-600px
# ✓ File mode (bun src/cli/index.ts some-file.md) still shows the full-width toolbar
# ✓ Comment count badge in sidebar updates as comments are added
```
