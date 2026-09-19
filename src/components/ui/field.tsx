import * as React from "react";
import { cn } from "cn";
import { AlertCircle } from "lucide-react";

const control =
  "w-full rounded-[var(--radius)] border border-control-border bg-surface-2 px-3 text-body text-text placeholder:text-text-muted disabled:opacity-40 aria-[invalid=true]:border-danger";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-small font-medium text-text", className)} {...props} />;
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(control, "h-12", className)} {...props} />
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(control, "min-h-24 py-3", className)} {...props} />
);
Textarea.displayName = "Textarea";

/** A styled native `<select>`. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn(control, "h-12", className)} {...props} />
);
Select.displayName = "Select";

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /** Receives the id and aria props to spread onto the control. */
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string; required?: boolean }) => React.ReactNode;
}

/** Visible label, hint, and an error below the control with an icon. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = React.useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-text-muted"> (required)</span>}
      </Label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, required })}
      {hint && (
        <p id={`${id}-hint`} className="text-small text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-small text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
