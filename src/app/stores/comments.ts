import { createStore, produce } from "solid-js/store";
import type { Comment } from "../lib/feedback";

const [comments, setComments] = createStore<Comment[]>([]);

export { comments };

export function addComment(comment: Omit<Comment, "id">) {
  const id = Math.random().toString(36).slice(2, 9);
  setComments((prev) => [...prev, { ...comment, id }]);
}

export function editComment(id: string, text: string) {
  setComments(
    produce((draft) => {
      const c = draft.find((x) => x.id === id);
      if (c) c.text = text;
    }),
  );
}

export function deleteComment(id: string) {
  setComments((prev) => prev.filter((c) => c.id !== id));
}
