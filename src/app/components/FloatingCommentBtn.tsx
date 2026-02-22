import { Show } from "solid-js";
import type { PendingSelection } from "../hooks/useSelection";

interface FloatingCommentBtnProps {
  pending: () => PendingSelection | null;
  contentAreaRef: () => HTMLElement | undefined;
  onClick: () => void;
}

export default function FloatingCommentBtn(props: FloatingCommentBtnProps) {
  function getPosition() {
    const p = props.pending();
    const area = props.contentAreaRef();
    if (!p || !area) return { top: 0, left: 0 };
    const areaRect = area.getBoundingClientRect();
    return {
      top: p.rect.bottom - areaRect.top + 6,
      left: p.rect.left - areaRect.left + p.rect.width / 2 - 30,
    };
  }

  return (
    <Show when={props.pending()}>
      <button
        data-comment-btn
        class="absolute z-50 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md shadow-lg cursor-pointer hover:bg-blue-700 select-none"
        style={{
          top: `${getPosition().top}px`,
          left: `${getPosition().left}px`,
        }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={props.onClick}
      >
        Comment
      </button>
    </Show>
  );
}
