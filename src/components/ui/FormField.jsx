import { useId, cloneElement } from "react";

/**
 * Associates a label with its control.
 *
 * The admin forms previously rendered a bare <label> next to an <input> with no
 * htmlFor/id link, so assistive tech announced unlabelled fields and clicking a label
 * did nothing. This injects a generated id into the child control and points the label
 * at it, which keeps the call sites as terse as they were.
 */
export function FormField({ label, hint, children, className = "" }) {
  const id = useId();

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy/50"
      >
        {label}
      </label>
      {cloneElement(children, { id })}
      {hint && <p className="mt-1 text-xs text-navy/30">{hint}</p>}
    </div>
  );
}
