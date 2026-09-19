"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export interface DialogContentProps extends Omit<React.ComponentProps<typeof RadixDialog.Content>, "title"> {
  title: string;
  description?: string;
  /** Keep the title for screen readers but don't show it. */
  hideTitle?: boolean;
  /** "dialog": centred from 768 px, bottom sheet below. "sheet": bottom sheet on mobile, right panel from 1024 px. */
  variant?: "dialog" | "sheet";
}

const scrim =
  "fixed inset-0 z-[var(--z-overlay)] bg-[var(--scrim)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-[var(--dur)]";

const position = {
  dialog:
    "inset-x-0 bottom-0 rounded-t-[var(--radius-lg)] md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--radius-lg)]",
  sheet:
    "inset-x-0 bottom-0 rounded-t-[var(--radius-lg)] lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[28rem] lg:max-h-none lg:rounded-none lg:rounded-l-[var(--radius-lg)]",
};

/** Focus trap, scroll lock, Esc and focus return come from radix. */
export function DialogContent({ title, description, hideTitle, variant = "dialog", className, children, ...props }: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className={scrim} />
      <RadixDialog.Content
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "fixed z-[var(--z-overlay)] flex max-h-[90dvh] flex-col overflow-y-auto border border-line-strong bg-surface-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-overlay)] duration-[var(--dur)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          position[variant],
          className
        )}
        {...props}
      >
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong md:hidden" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <RadixDialog.Title className={cn("text-h2 text-text", hideTitle && "sr-only")}>{title}</RadixDialog.Title>
            {description && <RadixDialog.Description className="text-body text-text-muted">{description}</RadixDialog.Description>}
          </div>
          <RadixDialog.Close
            aria-label="Close"
            className="-mr-2 -mt-2 flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius)] text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <X className="size-5" strokeWidth={1.75} />
          </RadixDialog.Close>
        </div>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
