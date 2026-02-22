import { comments } from "../stores/comments";
import { buildFeedback } from "../lib/feedback";

interface ToolbarProps {
  filename: string;
  generalTextRef: () => HTMLTextAreaElement | undefined;
  onToast: (msg: string) => void;
}

export default function Toolbar(props: ToolbarProps) {
  function getGeneralText() {
    return props.generalTextRef()?.value.trim() || "";
  }

  async function handleCopy() {
    const { feedback, count } = buildFeedback(comments, getGeneralText(), props.filename);
    try {
      await navigator.clipboard.writeText(feedback);
      props.onToast(count > 0 ? "Copied to clipboard" : "No comments to copy");
    } catch {
      props.onToast("Copy failed — clipboard access denied");
    }
  }

  async function handlePost() {
    const { feedback, count } = buildFeedback(comments, getGeneralText(), props.filename);
    try {
      await fetch("/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, count }),
      });
    } catch {
      // Server may be gone
    }
    document.body.innerHTML =
      `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#6b7280;font-size:14px;">Feedback posted. You can close this tab.</div>`;
    window.close();
  }

  return (
    <div class="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border-t border-neutral-200 dark:border-neutral-700">
      <div class="max-w-[1200px] mx-auto px-6 py-2.5 flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <span class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
            {comments.length}
          </span>
          <span>comment{comments.length === 1 ? "" : "s"}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-md text-sm font-medium cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900"
            onClick={handleCopy}
          >
            Copy
          </button>
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold cursor-pointer border-none"
            onClick={handlePost}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
