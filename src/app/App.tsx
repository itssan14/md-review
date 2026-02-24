import { createSignal, createEffect, onMount, onCleanup, Show } from "solid-js";
import { useSystemTheme } from "./hooks/useSystemTheme";
import { reinitMermaid } from "./lib/mermaid";
import ContentArea from "./components/ContentArea";
import type { CommentRequest } from "./components/ContentArea";
import MarginCommentList from "./components/MarginCommentList";
import type { PendingFormData } from "./components/MarginCommentList";
import GeneralComment from "./components/GeneralComment";
import Toolbar from "./components/Toolbar";
import Toast from "./components/Toast";
import FileSidebar from "./components/FileSidebar";
import { activeFile, setActiveFile } from "./stores/activeFile";
import type { FolderNode } from "../cli/folder";

// Import highlight.js themes as raw CSS strings
import hljsLight from "highlight.js/styles/github.css?raw";
import hljsDark from "highlight.js/styles/github-dark.css?raw";

interface FileInjectedData {
  type: "file";
  rawMarkdown: string;
  filename: string;
}

interface FolderInjectedData {
  type: "folder";
  folderName: string;
  tree: FolderNode;
}

type InjectedData = FileInjectedData | FolderInjectedData;

function readInjectedData(): InjectedData {
  const el = document.getElementById("md-review-data");
  const raw = el?.textContent?.trim();
  // Valid injected data is JSON starting with '{'. The build-time placeholder is not.
  if (!raw || raw.charAt(0) !== "{") {
    return {
      type: "file",
      rawMarkdown: "# No data\n\nNo markdown data was injected.",
      filename: "unknown",
    };
  }
  const parsed = JSON.parse(raw);
  // Backward compat: old injected data has no type field
  if (!parsed.type) parsed.type = "file";
  return parsed as InjectedData;
}

function findFirstFile(node: FolderNode): string | null {
  if (node.type === "file") return node.relativePath;
  for (const child of node.children ?? []) {
    const found = findFirstFile(child);
    if (found) return found;
  }
  return null;
}

export default function App() {
  const data = readInjectedData();
  const theme = useSystemTheme();
  const [toastMsg, setToastMsg] = createSignal("");
  const [pendingForm, setPendingForm] = createSignal<PendingFormData | null>(
    null,
  );

  let contentAreaEl: HTMLElement | undefined;
  let containerEl: HTMLDivElement | undefined;
  let generalTextEl: HTMLTextAreaElement | undefined;
  let marginListEl: HTMLElement | undefined;
  let clearRangeSelectionFn: (() => void) | undefined;

  // Inject highlight.js theme styles
  onMount(() => {
    const lightStyle = document.createElement("style");
    lightStyle.id = "hljs-light";
    lightStyle.textContent = hljsLight;
    document.head.appendChild(lightStyle);

    const darkStyle = document.createElement("style");
    darkStyle.id = "hljs-dark";
    darkStyle.textContent = hljsDark;
    document.head.appendChild(darkStyle);
  });

  // Reactively toggle highlight.js themes and dark class
  createEffect(() => {
    const isDark = theme() === "dark";
    document.documentElement.classList.toggle("dark", isDark);

    const lightEl = document.getElementById(
      "hljs-light",
    ) as HTMLStyleElement | null;
    const darkEl = document.getElementById(
      "hljs-dark",
    ) as HTMLStyleElement | null;
    if (lightEl) lightEl.disabled = isDark;
    if (darkEl) darkEl.disabled = !isDark;

    // Re-init mermaid with matching theme
    if (contentAreaEl) {
      reinitMermaid(theme(), contentAreaEl);
    }
  });

  // Folder mode: auto-open first file on mount
  if (data.type === "folder") {
    onMount(() => {
      if (!activeFile()) {
        const first = findFirstFile(data.tree);
        if (first) setActiveFile(first);
      }
    });
  }

  function handleCommentRequest({
    block,
    startLine,
    endLine,
    context,
    filename,
  }: CommentRequest) {
    if (!marginListEl) return;
    const blockRect = block.getBoundingClientRect();
    const listRect = marginListEl.getBoundingClientRect();
    const y = blockRect.top - listRect.top;
    setPendingForm({ y, startLine, endLine, context, filename });
  }

  function handleFormClose() {
    setPendingForm(null);
    clearRangeSelectionFn?.();
  }

  // ── File mode ────────────────────────────────────────────────────────────
  if (data.type === "file") {
    const { rawMarkdown, filename } = data;
    return (
      <div
        ref={containerEl}
        class="min-h-screen bg-stone-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
      >
        <div class="max-w-[1200px] mx-auto grid grid-cols-[1fr_320px]">
          {/* Content column */}
          <div class="max-w-[840px]">
            <ContentArea
              rawMarkdown={rawMarkdown}
              filename={filename}
              contentRef={(el) => (contentAreaEl = el)}
              containerRef={() => containerEl}
              onCommentRequest={handleCommentRequest}
              onClearRangeRef={(fn) => (clearRangeSelectionFn = fn)}
            />
            <GeneralComment textRef={(el) => (generalTextEl = el)} />
          </div>

          {/* Margin column */}
          <div class="pt-12">
            <MarginCommentList
              filename={filename}
              contentAreaRef={() => contentAreaEl}
              containerRef={() => containerEl}
              listRef={(el) => (marginListEl = el)}
              pendingForm={pendingForm}
              onFormClose={handleFormClose}
            />
          </div>
        </div>

        <Toolbar
          mode="file"
          filename={filename}
          generalTextRef={() => generalTextEl}
          onToast={setToastMsg}
        />
        <Toast message={toastMsg} onDismiss={() => setToastMsg("")} />
      </div>
    );
  }

  // ── Folder mode ───────────────────────────────────────────────────────────
  const { folderName, tree } = data;

  // Folder mode: loaded markdown for current file
  const [loadedMarkdown, setLoadedMarkdown] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  // Folder mode: load file content when activeFile changes
  createEffect(() => {
    const path = activeFile();
    if (!path) return;
    const controller = new AbortController();
    setIsLoading(true);
    fetch(`/file?path=${encodeURIComponent(path)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { rawMarkdown: string }) => setLoadedMarkdown(json.rawMarkdown))
      .catch((err: Error) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setIsLoading(false));
    onCleanup(() => controller.abort());
  });

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

  onCleanup(() => {
    document.removeEventListener("mousemove", onSidebarDragMove);
    document.removeEventListener("mouseup", onSidebarDragEnd);
  });

  return (
    <div
      ref={containerEl}
      class="h-screen overflow-hidden bg-stone-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex"
    >
      {/* Sidebar */}
      <div
        class="h-full border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col flex-shrink-0 relative"
        style={{ width: `${sidebarWidth()}px` }}
      >
        <div class="flex-1 overflow-y-auto overflow-x-auto">
          <FileSidebar tree={tree} rootName={folderName} />
        </div>
        {/* General comment */}
        <div class="px-2 py-2 border-t border-neutral-200 dark:border-neutral-700">
          <GeneralComment compact defaultExpanded textRef={(el) => (generalTextEl = el)} />
        </div>

        {/* Inline toolbar */}
        <Toolbar
          variant="inline"
          mode="folder"
          folderName={folderName}
          generalTextRef={() => generalTextEl}
          onToast={setToastMsg}
        />

        {/* Resize handle */}
        <div
          class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400/40 active:bg-blue-500/50 transition-colors z-10"
          onMouseDown={onSidebarDragStart}
        />
      </div>

      {/* Main panel */}
      <div class="flex-1 overflow-hidden grid grid-cols-[1fr_320px] min-w-0 h-full">
        {/* Content column */}
        <div class="overflow-y-auto overflow-x-auto h-full min-w-0">
          <Show
            when={activeFile()}
            keyed
            fallback={
              <div class="flex items-center justify-center h-64 text-neutral-400 dark:text-neutral-500 text-sm">
                Select a file to review
              </div>
            }
          >
            {(filename) => (
              <Show
                when={!isLoading()}
                fallback={
                  <div class="px-10 pt-12 text-neutral-400 text-sm">
                    Loading…
                  </div>
                }
              >
                <ContentArea
                  rawMarkdown={loadedMarkdown()}
                  filename={filename}
                  contentRef={(el) => (contentAreaEl = el)}
                  containerRef={() => containerEl}
                  onCommentRequest={handleCommentRequest}
                  onClearRangeRef={(fn) => (clearRangeSelectionFn = fn)}
                />
              </Show>
            )}
          </Show>
        </div>

        {/* Margin column */}
        <div class="pt-12 overflow-y-auto h-full pr-3">
          {/* Not keyed: MarginCommentList filters by filename prop reactively — no need to destroy/recreate on file switch */}
          <Show when={activeFile()}>
            {(filename) => (
              <MarginCommentList
                filename={filename()}
                contentAreaRef={() => contentAreaEl}
                containerRef={() => containerEl}
                listRef={(el) => (marginListEl = el)}
                pendingForm={pendingForm}
                onFormClose={handleFormClose}
              />
            )}
          </Show>
        </div>
      </div>

      <Toast message={toastMsg} onDismiss={() => setToastMsg("")} />
    </div>
  );
}
