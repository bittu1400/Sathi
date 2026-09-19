import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  // FND-2: sm size kept at 44px on touch via @media override below
  "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-ink hover:bg-accent/90 shadow-sm",
        secondary: "bg-surface-3 text-text hover:bg-surface-2 border border-border",
        ghost: "hover:bg-surface-2 text-text border border-transparent",
        // FND-1c: was text-white (3.27:1 on dark danger) — now uses danger-ink token
        danger: "bg-danger text-danger-ink hover:bg-danger/90",
        sos: "bg-sos text-sos-ink font-bold shadow-lg hover:bg-sos/90 tracking-wide uppercase",
        outline: "border border-border bg-transparent hover:bg-surface-2 text-text",
      },
      size: {
        default: "h-[48px] px-5 text-base rounded-[var(--radius)] min-w-[48px]",
        md: "h-[48px] px-5 text-base rounded-[var(--radius)] min-w-[48px]",
        lg: "h-[56px] px-6 text-lg font-semibold rounded-[var(--radius)] min-w-[56px]",
        // FND-2: sm is visually 36px but padded to 44px hit area on touch via CSS
        sm: "h-[36px] px-3 text-sm rounded-[var(--radius-sm)] min-h-[44px] @touch:min-h-[44px]",
        sos: "h-[72px] w-[72px] rounded-full p-0 text-lg flex items-center justify-center shadow-xl",
        icon: "h-[48px] w-[48px] p-0 rounded-[var(--radius)] flex items-center justify-center",
        "icon-sm": "h-[44px] w-[44px] p-0 rounded-[var(--radius-sm)] flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        // aria-busy signals loading state to assistive tech
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
