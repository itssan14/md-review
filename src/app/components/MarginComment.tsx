import { createSignal, Show } from "solid-js";
import { editComment, deleteComment } from "../stores/comments";
import type { Comment } from "../lib/feedback";

interface MarginCommentProps {
  comment: Comment;
  top: number;
}

export default function MarginComment(props: MarginCommentProps) {
  const [editing, setEditing] = createSignal(false);
  let editRef!: HTMLTextAreaElement;

  const ref = () =>
    props.comment.startLine === props.comment.endLine
      ? `L${props.comment.startLine}`
      : `L${props.comment.startLine}-${props.comment.endLine}`;

  const contextPreview = () => {
    const ctx = props.comment.context;
    return ctx.length > 55 ? ctx.slice(0, 55) + "…" : ctx;
  };

  function scrollToBlock() {
    const target = document.querySelector(`[data-start-line="${props.comment.startLine}"]`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function saveEdit() {
    const text = editRef.value.trim();
    if (!text) return;
    editComment(props.comment.id, text);
    setEditing(false);
  }

  function handleEditKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
    if (e.key === "Escape") setEditing(false);
  }

  return (
    <div
      class="group absolute w-full bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-xl shadow-sm hover:shadow-md transition-[top,box-shadow] duration-150 overflow-hidden"
      style={{ top: `${props.top}px` }}
    >
      {/* Line ref — clickable, scrolls to block */}
      <div class="px-3 pt-2.5 pb-1">
        <button
          class="font-mono text-[0.7rem] text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline bg-transparent border-none p-0"
          onClick={scrollToBlock}
        >
          {ref()}
        </button>
      </div>

      {/* Context quote — yellow background strip */}
      {props.comment.context && (
        <div class="mx-3 mb-1.5 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded text-[0.7rem] italic text-neutral-500 dark:text-neutral-400 leading-snug">
          "{contextPreview()}"
        </div>
      )}

      {/* Comment text or inline edit form */}
      <Show
        when={!editing()}
        fallback={
          <div class="px-3 pb-2.5">
            <textarea
              ref={(el) => { editRef = el; setTimeout(() => el.focus(), 0); }}
              class="w-full text-sm px-2.5 py-2 border border-blue-400 dark:border-blue-600 rounded-lg resize-none min-h-[48px] outline-none bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:border-blue-600"
              value={props.comment.text}
              rows={2}
              onKeyDown={handleEditKeyDown}
            />
            <div class="flex items-center justify-end gap-3 mt-1.5">
              <button
                class="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer bg-transparent border-none"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button
                class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer border-none"
                onClick={saveEdit}
              >
                Save
              </button>
            </div>
          </div>
        }
      >
        <div class="px-3 pb-1.5 text-sm leading-snug text-neutral-800 dark:text-neutral-200">
          {props.comment.text}
        </div>

        {/* Actions — visible on hover */}
        <div class="px-3 pb-2.5 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            class="text-[0.7rem] text-neutral-400 hover:text-blue-500 cursor-pointer bg-transparent border-none p-0"
            onClick={() => setEditing(true)}
          >
            edit
          </button>
          <button
            class="text-[0.7rem] text-neutral-400 hover:text-red-500 cursor-pointer bg-transparent border-none p-0"
            onClick={() => deleteComment(props.comment.id)}
          >
            delete
          </button>
        </div>
      </Show>
    </div>
  );
}
