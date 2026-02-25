import { createSignal, Show } from "solid-js";

interface GeneralCommentProps {
  textRef: (el: HTMLTextAreaElement) => void;
  compact?: boolean;
  defaultExpanded?: boolean;
}

export default function GeneralComment(props: GeneralCommentProps) {
  const [expanded, setExpanded] = createSignal(props.defaultExpanded ?? false);

  if (props.compact) {
    return (
      <div>
        <button
          class="w-full flex items-center gap-1 py-1 text-[13px] text-neutral-500 dark:text-neutral-400 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded bg-transparent border-none text-left select-none"
          onClick={() => setExpanded(!expanded())}
        >
          {expanded() ? "▾" : "▸"} General comment
        </button>
        <Show when={expanded()}>
          <textarea
            ref={props.textRef}
            class="w-full mt-1.5 text-sm px-2 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-md resize-y min-h-[72px] outline-none leading-snug bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:border-blue-500"
            placeholder="Overall thoughts on the document..."
          />
        </Show>
      </div>
    );
  }

  return (
    <div class="mx-10 my-6 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      <button
        class="w-full px-4 py-2.5 text-left text-sm font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 border-none"
        onClick={() => setExpanded(!expanded())}
      >
        General comment {expanded() ? "▾" : "▸"}
      </button>
      <Show when={expanded()}>
        <div class="px-4 py-3">
          <textarea
            ref={props.textRef}
            class="w-full text-sm px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md resize-y min-h-[60px] outline-none leading-snug bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:border-blue-500"
            placeholder="Overall thoughts on the document..."
          />
        </div>
      </Show>
    </div>
  );
}
