import { For, Show } from "solid-js";
import { File, ChevronDown } from "lucide-solid";
import { activeFile, setActiveFile } from "../stores/activeFile";
import { comments } from "../stores/comments";
import type { FolderNode } from "../../cli/folder";

function FileNode(props: { node: FolderNode; depth: number }) {
  if (props.node.type === "file") {
    const count = () =>
      comments.filter((c) => c.filename === props.node.relativePath).length;
    const isActive = () => activeFile() === props.node.relativePath;

    return (
      <button
        class="w-full flex items-center gap-1.5 py-1 pr-3 text-sm text-left cursor-pointer border-l-2 transition-colors"
        classList={{
          "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium":
            isActive(),
          "border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800":
            !isActive(),
        }}
        style={{ "padding-left": `${props.depth * 16 + 6}px` }}
        title={props.node.relativePath}
        onClick={() => setActiveFile(props.node.relativePath)}
      >
        <File size={13} stroke-width={1.5} class="flex-shrink-0" />
        <span class="truncate flex-1">{props.node.name}</span>
        <Show when={count() > 0}>
          <span class="inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 bg-blue-600 text-white text-[0.65rem] font-semibold rounded-full flex-shrink-0">
            {count()}
          </span>
        </Show>
      </button>
    );
  }

  // Directory node: chevron + name + recurse children
  return (
    <div>
      <div
        class="flex items-center gap-1 py-1 text-[13px] text-neutral-500 dark:text-neutral-400 select-none"
        style={{ "padding-left": `${props.depth * 16 + 8}px` }}
      >
        <ChevronDown size={10} stroke-width={1.5} class="flex-shrink-0" />
        {props.node.name}
      </div>
      <For each={props.node.children ?? []}>
        {(child) => <FileNode node={child} depth={props.depth + 1} />}
      </For>
    </div>
  );
}

export default function FileSidebar(props: {
  tree: FolderNode;
  rootName?: string;
}) {
  const startDepth = () => (props.rootName ? 1 : 0);
  return (
    <nav class="py-2 overflow-x-auto">
      <div style={{ "min-width": "max-content" }}>
        <Show when={props.rootName}>
          {(name) => (
            <div
              class="flex items-center gap-1 py-1 text-[13px] text-neutral-500 dark:text-neutral-400 select-none"
              style={{ "padding-left": "8px" }}
            >
              <ChevronDown size={10} stroke-width={1.5} class="flex-shrink-0" />
              {name()}
            </div>
          )}
        </Show>
        <For each={props.tree.children ?? []}>
          {(node) => <FileNode node={node} depth={startDepth()} />}
        </For>
      </div>
    </nav>
  );
}
