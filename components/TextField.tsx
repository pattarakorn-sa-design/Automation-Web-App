import type { ComponentPropsWithoutRef } from "react";

type TextFieldProps = ComponentPropsWithoutRef<"input"> & {
  label: string;
  name: string;
  // Validation message shown under the field, telling the user how to fix it.
  error?: string;
  hint?: string;
};

export default function TextField({
  label,
  name,
  id: idProp,
  error,
  hint,
  className,
  ...inputProps
}: TextFieldProps) {
  // Defaults to `field-<name>`. Pass a unique `id` when one page has several
  // forms with a field of the same name (e.g. one row per user), because ids
  // must be unique for the label and the error message to point at the right input.
  const id = idProp ?? `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-900 dark:text-gray-100"
      >
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 ${
          error
            ? "border-red-500 dark:border-red-400"
            : "border-gray-300 dark:border-gray-700"
        }${className ? ` ${className}` : ""}`}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-gray-600 dark:text-gray-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
