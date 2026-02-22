export function findAnnotatableAncestor(node: Node): HTMLElement | null {
  let el: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE
      ? node.parentElement
      : (node as HTMLElement);
  while (el && el.id !== "content-area") {
    if (el.hasAttribute("data-start-line")) return el;
    el = el.parentElement;
  }
  return null;
}

export function getIntAttr(el: Element, name: string, fallback = 0): number {
  const val = el.getAttribute(name);
  if (val === null) return fallback;
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}
