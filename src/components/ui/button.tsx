import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors duration-[var(--dur-fast)] cursor-pointer disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-accent text-ink hover:bg-accent/90 active:bg-accent/80",
        secondary: "bg-surface-2 text-text border border-control-border hover:bg-surface-3 active:bg-surface-3",
        ghost: "text-text hover:bg-surface-2 active:bg-surface-3",
        danger: "bg-danger text-ink hover:bg-danger/90 active:bg-danger/80",
        sos: "bg-sos text-ink font-semibold uppercase tracking-wide hover:bg-sos/90 active:bg-sos/80",
      },
      size: {
        md: "h-12 px-5 text-body rounded-[var(--radius)] min-w-12",
        lg: "h-14 px-6 text-h2 rounded-[var(--radius)] min-w-14",
        // Desktop consoles only; trekker screens use md.
        sm: "h-10 px-3 text-small rounded-[var(--radius)]",
        sos: "size-[72px] rounded-full p-0 text-h2",
        icon: "size-12 p-0 rounded-[var(--radius)]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  state?: "idle" | "busy" | "done" | "error";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, state, asChild = false, children, disabled, ...props }, ref) => {
    const current = state ?? "idle";
    const busy = current === "busy";
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
      return (
        <Slot.Root className={classes} ref={ref}>
          {children}
        </Slot.Root>
      );
    }
    return (
      <button className={classes} ref={ref} disabled={disabled || busy} aria-busy={busy || undefined} {...props}>
        {busy && <Loader2 className="absolute size-5 animate-spin" aria-hidden />}
        {current === "done" && <Check className="size-5" aria-hidden />}
        {/* invisible (not removed) so the button keeps its width while busy */}
        <span className={cn("inline-flex items-center justify-center gap-2", busy && "invisible")}>{children}</span>
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
