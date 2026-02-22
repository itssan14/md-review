import { onMount, createEffect, on } from "solid-js";
import { configureMarked, renderMarkdown, highlightCodeBlocks } from "../lib/markdown";
import { buildLineMap, matchBlockToMap } from "../lib/line-map";
import { waitForMermaid, renderMermaidBlocks } from "../lib/mermaid";
import { useSelection } from "../hooks/useSelection";
import { comments } from "../stores/comments";
import FloatingCommentBtn from "./FloatingCommentBtn";

export interface CommentRequest {
  block: HTMLElement;
  startLine: number;
  endLine: number;
  context: string;
}

interface ContentAreaProps {
  rawMarkdown: string;
  contentRef: (el: HTMLElement) => void;
  containerRef: () => HTMLElement | undefined;
  onCommentRequest: (req: CommentRequest) => void;
  onClearRangeRef: (fn: () => void) => void;
}

export default function ContentArea(props: ContentAreaProps) {
  let areaRef!: HTMLDivElement;

  const { pending, clearPending, setup } = useSelection(() => areaRef);

  onMount(async () => {
    props.contentRef(areaRef);
    props.onClearRangeRef(clearRangeSelection);

    configureMarked();
    const html = renderMarkdown(props.rawMarkdown);
    areaRef.innerHTML = html;

    highlightCodeBlocks(areaRef);

    await waitForMermaid();
    await renderMermaidBlocks(areaRef);

    // Build line map and assign data attributes
    const lineMap = buildLineMap(props.rawMarkdown);
    const blocks = Array.from(areaRef.children).filter((el) => {
      const tag = el.tagName.toLowerCase();
      return /^(h[1-6]|p|ul|ol|blockquote|pre|table|hr)$/.test(tag) || el.classList.contains("mermaid-container");
    });

    for (const block of blocks) {
      const entry = matchBlockToMap(block, lineMap);
      if (entry) {
        block.classList.add("annotatable");
        block.setAttribute("data-start-line", String(entry.startLine));
        block.setAttribute("data-end-line", String(entry.endLine));
      }
    }

    setup();
  });

  // Reactively update .has-comment class on blocks
  createEffect(
    on(
      () => comments.length,
      () => {
        const blocks = areaRef.querySelectorAll("[data-start-line]");
        const commentedLines = new Set(comments.map((c) => c.startLine));
        blocks.forEach((block) => {
          const line = parseInt(block.getAttribute("data-start-line")!, 10);
          block.classList.toggle("has-comment", commentedLines.has(line));
        });
      },
    ),
  );

  function handleCommentClick() {
    const p = pending();
    if (!p) return;
    clearPending();
    highlightRange(p.startLine, p.endLine);
    props.onCommentRequest({
      block: p.block,
      startLine: p.startLine,
      endLine: p.endLine,
      context: p.selectedText,
    });
    window.getSelection()?.removeAllRanges();
  }

  function highlightRange(startLine: number, endLine: number) {
    clearRangeSelection();
    areaRef.querySelectorAll("[data-start-line]").forEach((block) => {
      const bStart = parseInt(block.getAttribute("data-start-line")!, 10);
      const bEnd = parseInt(block.getAttribute("data-end-line")!, 10);
      if (bStart >= startLine && bEnd <= endLine) {
        block.classList.add("range-selected");
      }
    });
  }

  function clearRangeSelection() {
    areaRef.querySelectorAll(".range-selected").forEach((el) => el.classList.remove("range-selected"));
  }

  return (
    <div class="relative">
      <div ref={areaRef} id="content-area" class="px-10 pt-12 pb-32" />

      <FloatingCommentBtn
        pending={pending}
        contentAreaRef={() => areaRef}
        onClick={handleCommentClick}
      />
    </div>
  );
}
