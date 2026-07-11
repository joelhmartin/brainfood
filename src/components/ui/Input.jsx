import { forwardRef, useId } from "react";
import { clsx } from "clsx";

/**
 * The label used to be a bare <label> with no htmlFor, and the input had no id, so the
 * two were never associated: screen readers announced an unlabelled field, and clicking
 * the label did not focus the input. useId() wires them together, and the error message
 * is linked with aria-describedby so it is announced too.
 */
export const Input = forwardRef(function Input({ label, error, className, id, ...props }, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors",
          "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
          error ? "border-red-300" : "border-gray-300",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});
