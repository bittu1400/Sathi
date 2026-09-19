import { toast } from "./toast";

const UNDO_MS = 8000;

interface UndoOptions {
  /** Optimistic change, applied at once. */
  apply: () => void;
  /** Puts things back if the user taps Undo. */
  revert: () => void;
  /** The real write; runs after 8 s if not undone. */
  commit: () => void | Promise<void>;
  message: string;
}

/**
 * For reversible actions (remove an offline pack, dismiss an alert, clear filters).
 * Not for SOS, delete-my-data, resolving an incident or regenerating a share link.
 */
export function runWithUndo({ apply, revert, commit, message }: UndoOptions) {
  let undone = false;
  apply();
  toast.info(message, {
    action: {
      label: "Undo",
      onClick: () => {
        undone = true;
        revert();
      },
    },
  });
  // ponytail: commit is lost if the tab closes within 8 s; flush on pagehide if that matters.
  setTimeout(() => {
    if (!undone) void Promise.resolve(commit()).catch(() => toast.error("Couldn't save that change"));
  }, UNDO_MS);
}

export const useUndo = () => runWithUndo;
