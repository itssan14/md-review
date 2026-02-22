import { onMount } from "solid-js";
import { addComment } from "../stores/comments";

interface CommentFormProps {
  startLine: number;
  endLine: number;
  block?: HTMLElement;
  context: string;
  onClose: () => void;
  /** For editing an existing comment */
  initialText?: string;
  onSave?: (text: string) => void;
}

export default function CommentForm(props: CommentFormProps) {
  let textareaRef!: HTMLTextAreaElement;

  onMount(() => textareaRef.focus());

  function save() {
    const text = textareaRef.value.trim();
    if (!text) return;
    if (props.onSave) {
      props.onSave(text);
    } else {
      addComment({
        startLine: props.startLine,
        endLine: props.endLine,
        context:
          props.context || (props.block?.textContent || "").trim().slice(0, 60),
        text,
      });
    }
    props.onClose();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") props.onClose();
  }

  const ref = () =>
    props.startLine === props.endLine
      ? `L${props.startLine}`
      : `L${props.startLine}-${props.endLine}`;

  const contextPreview = () => {
    const ctx = props.context || "";
    return ctx.length > 55 ? ctx.slice(0, 55) + "…" : ctx;
  };

  return (
    <div class="bg-white dark:bg-neutral-800 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* Header: line ref + context snippet */}
      <div class="px-3 pt-2.5 pb-2">
        <span class="font-mono text-[0.7rem] text-neutral-400 dark:text-neutral-500">
          {ref()}
        </span>
        {props.context && (
          <span class="text-[0.7rem] text-neutral-400 dark:text-neutral-500 italic ml-1.5">
            · "{contextPreview()}"
          </span>
        )}
      </div>

      <hr class="border-neutral-100 dark:border-neutral-700" />

      {/* Borderless textarea */}
      <textarea
        ref={textareaRef}
        class="w-full px-3 py-2.5 text-sm resize-none outline-none bg-transparent text-neutral-900 dark:text-neutral-100 leading-snug min-h-[72px] block border-none"
        placeholder="Add a comment…"
        rows={3}
        value={props.initialText || ""}
        onKeyDown={handleKeyDown}
      />

      {/* Footer: Cancel text link + Comment primary button */}
      <div class="px-3 pb-2.5 pt-1 flex items-center justify-end gap-3">
        <button
          class="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer bg-transparent border-none"
          onClick={props.onClose}
        >
          Cancel
        </button>
        <button
          class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer border-none"
          onClick={save}
        >
          Comment
        </button>
      </div>
    </div>
  );
}
