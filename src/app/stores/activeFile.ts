import { createSignal } from "solid-js";

const [activeFile, setActiveFile] = createSignal<string | null>(null);

export { activeFile, setActiveFile };
