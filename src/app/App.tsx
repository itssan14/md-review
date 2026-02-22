import { createSignal, createEffect, onMount } from "solid-js";
import { useSystemTheme } from "./hooks/useSystemTheme";
import { reinitMermaid } from "./lib/mermaid";
import ContentArea from "./components/ContentArea";
import type { CommentRequest } from "./components/ContentArea";
import MarginCommentList from "./components/MarginCommentList";
import type { PendingFormData } from "./components/MarginCommentList";
import GeneralComment from "./components/GeneralComment";
import Toolbar from "./components/Toolbar";
import Toast from "./components/Toast";

// Import highlight.js themes as raw CSS strings
import hljsLight from "highlight.js/styles/github.css?raw";
import hljsDark from "highlight.js/styles/github-dark.css?raw";

interface ReviewData {
  rawMarkdown: string;
  filename: string;
}

function readInjectedData(): ReviewData {
  const el = document.getElementById("md-review-data");
  const raw = el?.textContent?.trim();
  // Valid injected data is JSON starting with '{'. The build-time placeholder is not.
  if (!raw || raw.charAt(0) !== "{") {
    return {
      rawMarkdown: "# No data\n\nNo markdown data was injected.",
      filename: "unknown",
    };
  }
  return JSON.parse(raw);
}

export default function App() {
  const { rawMarkdown, filename } = readInjectedData();
  const theme = useSystemTheme();
  const [toastMsg, setToastMsg] = createSignal("");
  const [pendingForm, setPendingForm] = createSignal<PendingFormData | null>(
    null,
  );

  let contentAreaEl: HTMLElement | undefined;
  let containerEl: HTMLElement | undefined;
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

  function handleCommentRequest({
    block,
    startLine,
    endLine,
    context,
  }: CommentRequest) {
    if (!marginListEl) return;
    const blockRect = block.getBoundingClientRect();
    const listRect = marginListEl.getBoundingClientRect();
    const y = blockRect.top - listRect.top;
    setPendingForm({ y, startLine, endLine, context });
  }

  function handleFormClose() {
    setPendingForm(null);
    clearRangeSelectionFn?.();
  }

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
            contentAreaRef={() => contentAreaEl}
            containerRef={() => containerEl}
            listRef={(el) => (marginListEl = el)}
            pendingForm={pendingForm}
            onFormClose={handleFormClose}
          />
        </div>
      </div>

      <Toolbar
        filename={filename}
        generalTextRef={() => generalTextEl}
        onToast={setToastMsg}
      />
      <Toast message={toastMsg} onDismiss={() => setToastMsg("")} />
    </div>
  );
}
