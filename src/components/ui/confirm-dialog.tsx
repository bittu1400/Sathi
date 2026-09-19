"use client";

import * as React from "react";
import { AlertDialog } from "radix-ui";
import { Button } from "./button";
import { Input } from "./field";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  /** A verb ("Delete data"), never "OK". */
  confirmLabel: string;
  tone?: "default" | "danger";
  /** The user must type this text to enable the confirm button, e.g. "DELETE". */
  requireText?: string;
  onConfirm: () => void | Promise<void>;
}

/** For irreversible or safety actions. Replaces window.confirm. Cancel has first focus. */
export function ConfirmDialog({ open, onOpenChange, title, body, confirmLabel, tone = "default", requireText, onConfirm }: ConfirmDialogProps) {
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const blocked = requireText !== undefined && typed !== requireText;

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setTyped("");
        onOpenChange(next);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--scrim)] data-[state=open]:animate-in data-[state=open]:fade-in-0 duration-[var(--dur)]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[var(--z-overlay)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-[var(--radius-lg)] border border-line-strong bg-surface-3 p-5 shadow-[var(--shadow-overlay)] data-[state=open]:animate-in data-[state=open]:fade-in-0 duration-[var(--dur)]">
          <AlertDialog.Title className="text-h2 text-text">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-body text-text-muted">{body}</AlertDialog.Description>
          {requireText !== undefined && (
            <label className="flex flex-col gap-1.5 text-small text-text">
              Type {requireText} to confirm
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="off" />
            </label>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialog.Cancel>
            <Button variant={tone === "danger" ? "danger" : "primary"} disabled={blocked} state={busy ? "busy" : "idle"} onClick={confirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
