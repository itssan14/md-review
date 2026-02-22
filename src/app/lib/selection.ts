export function findAnnotatableAncestor(node: Node): HTMLElement | null {
  let el: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE
      ? node.parentElement
      : (node as HTMLElement);
  while (el && el.id !== "content-area") {
    if (el.hasAttribute?.("data-start-line")) return el;
    el = el.parentElement;
  }
  return null;
}
