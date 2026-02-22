import { Show, createEffect, on } from "solid-js";
import type { Accessor } from "solid-js";

interface ToastProps {
  message: Accessor<string>;
  onDismiss: () => void;
}

export default function Toast(props: ToastProps) {
  createEffect(
    on(props.message, (msg) => {
      if (msg) {
        setTimeout(props.onDismiss, 3000);
      }
    }),
  );

  return (
    <Show when={props.message()}>
      <div class="fixed bottom-4 right-4 z-[999] bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-[fadeIn_0.2s_ease-out]">
        {props.message()}
      </div>
    </Show>
  );
}
