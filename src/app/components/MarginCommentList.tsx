import { createEffect, on, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import type { Accessor } from "solid-js";
import { comments } from "../stores/comments";
import MarginComment from "./MarginComment";
import CommentForm from "./CommentForm";

export interface PendingFormData {
  y: number;
  startLine: number;
  endLine: number;
  context: string;
}

interface MarginCommentListProps {
  contentAreaRef: () => HTMLElement | undefined;
  containerRef?: () => HTMLElement | undefined;
  listRef?: (el: HTMLElement) => void;
  pendingForm?: Accessor<PendingFormData | null>;
  onFormClose?: () => void;
}

interface PositionedComment {
  id: string;
  top: number;
}

export default function MarginCommentList(props: MarginCommentListProps) {
  let listEl!: HTMLDivElement;
  const [positions, setPositions] = createStore<PositionedComment[]>([]);

  function recomputePositions() {
    const area = props.contentAreaRef();
    if (!area || !listEl) return;

    // Sort comments by startLine
    const sorted = [...comments].sort((a, b) => a.startLine - b.startLine);

    // Measure desired Y for each comment relative to listEl (not containerEl)
    const measured: { id: string; desiredY: number; height: number }[] = [];
    const listRect = listEl.getBoundingClientRect();

    for (const c of sorted) {
      const block = area.querySelector(`[data-start-line="${c.startLine}"]`);
      if (!block) continue;
      const blockRect = block.getBoundingClientRect();
      const desiredY = blockRect.top - listRect.top;
      measured.push({ id: c.id, desiredY, height: 0 });
    }

    // First pass: set initial positions with estimated card height
    const GAP = 8;
    const result: PositionedComment[] = [];
    let prevBottom = -Infinity;

    for (const m of measured) {
      let top = m.desiredY;
      if (top < prevBottom + GAP) top = prevBottom + GAP;
      result.push({ id: m.id, top });
      prevBottom = top + 100; // estimated height
    }

    setPositions(result);

    // After DOM paint, re-measure actual card heights and adjust
    requestAnimationFrame(() => {
      if (!listEl) return;
      const cards = listEl.querySelectorAll<HTMLElement>("[data-margin-card]");
      if (cards.length === 0) return;

      const cardHeights = new Map<string, number>();
      cards.forEach((card) => {
        const id = card.getAttribute("data-margin-card")!;
        cardHeights.set(id, card.offsetHeight);
      });

      const adjusted: PositionedComment[] = [];
      let prev = -Infinity;

      for (const m of measured) {
        const height = cardHeights.get(m.id) || 100;
        let top = m.desiredY;
        if (top < prev + GAP) top = prev + GAP;
        adjusted.push({ id: m.id, top });
        prev = top + height;
      }

      setPositions(adjusted);
    });
  }

  // Recompute on comment changes
  createEffect(
    on(
      () => comments.map((c) => `${c.id}:${c.startLine}`).join(","),
      () => requestAnimationFrame(recomputePositions),
    ),
  );

  // ResizeObserver for layout changes
  createEffect(() => {
    const area = props.contentAreaRef();
    if (!area) return;
    const observer = new ResizeObserver(() => recomputePositions());
    observer.observe(area);
    return () => observer.disconnect();
  });

  function getTop(id: string): number {
    return positions.find((p) => p.id === id)?.top ?? 0;
  }

  return (
    <div
      data-margin-list
      class="relative"
      ref={(el) => {
        listEl = el;
        props.listRef?.(el);
      }}
    >
      <For each={[...comments].sort((a, b) => a.startLine - b.startLine)}>
        {(comment) => (
          <div data-margin-card={comment.id}>
            <MarginComment comment={comment} top={getTop(comment.id)} />
          </div>
        )}
      </For>
      <Show when={props.pendingForm?.()}>
        {(form) => (
          <div style={{ position: "absolute", top: `${form().y}px`, width: "100%" }}>
            <CommentForm
              startLine={form().startLine}
              endLine={form().endLine}
              context={form().context}
              onClose={props.onFormClose ?? (() => {})}
            />
          </div>
        )}
      </Show>
    </div>
  );
}
