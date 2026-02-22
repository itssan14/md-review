import { createSignal, onCleanup } from "solid-js";
import { findAnnotatableAncestor } from "../lib/selection";

export interface PendingSelection {
  startLine: number;
  endLine: number;
  block: HTMLElement;
  selectedText: string;
  rect: DOMRect;
}

export function useSelection(contentAreaRef: () => HTMLElement | undefined) {
  const [pending, setPending] = createSignal<PendingSelection | null>(null);

  function handleSelectionChange() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setPending(null);
      return;
    }

    const area = contentAreaRef();
    if (
      !area ||
      !area.contains(sel.anchorNode) ||
      !area.contains(sel.focusNode)
    ) {
      setPending(null);
      return;
    }

    const anchorBlock = findAnnotatableAncestor(sel.anchorNode!);
    const focusBlock = findAnnotatableAncestor(sel.focusNode!);
    if (!anchorBlock || !focusBlock) {
      setPending(null);
      return;
    }

    const aStart = parseInt(anchorBlock.getAttribute("data-start-line")!, 10);
    const aEnd = parseInt(anchorBlock.getAttribute("data-end-line")!, 10);
    const fStart = parseInt(focusBlock.getAttribute("data-start-line")!, 10);
    const fEnd = parseInt(focusBlock.getAttribute("data-end-line")!, 10);

    const startLine = Math.min(aStart, fStart);
    const endLine = Math.max(aEnd, fEnd);
    const laterBlock =
      anchorBlock.offsetTop > focusBlock.offsetTop ? anchorBlock : focusBlock;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setPending({
      startLine,
      endLine,
      block: laterBlock,
      selectedText: sel.toString().trim(),
      rect,
    });
  }

  const onMouseUp = () => setTimeout(handleSelectionChange, 10);
  const onMouseDown = (e: MouseEvent) => {
    // Don't clear if clicking on the comment button
    if ((e.target as HTMLElement).closest("[data-comment-btn]")) return;
    setPending(null);
  };

  // Setup is called from ContentArea once the ref is available
  function setup() {
    const area = contentAreaRef();
    if (!area) return;
    area.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousedown", onMouseDown);
  }

  onCleanup(() => {
    const area = contentAreaRef();
    if (area) area.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("mousedown", onMouseDown);
  });

  return { pending, clearPending: () => setPending(null), setup };
}
