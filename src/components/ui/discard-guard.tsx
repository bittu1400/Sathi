"use client";

import * as React from "react";
import { ConfirmDialog } from "./confirm-dialog";

/**
 * Closing a dialog whose form has changed asks first.
 * `guard(close)` runs `close` at once when clean, otherwise after "Discard".
 * Render `dialog` anywhere in the tree.
 */
export function useDiscardGuard(dirty: boolean) {
  const [pending, setPending] = React.useState<(() => void) | null>(null);
  const guard = (close: () => void) => (dirty ? setPending(() => close) : close());
  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(open) => !open && setPending(null)}
      title="Discard your answers?"
      body="You've made changes that haven't been saved."
      confirmLabel="Discard"
      tone="danger"
      onConfirm={() => pending?.()}
    />
  );
  return { guard, dialog };
}
