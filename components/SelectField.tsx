import type { ComponentPropsWithoutRef } from "react";

export type SelectOption = { value: string; label: string };

type SelectFieldProps = Omit<ComponentPropsWithoutRef<"select">, "children"> & {
  label: string;
  name: string;
  options: readonly SelectOption[];
  // Shown first with an empty value, e.g. "Select a machine".
  placeholder?: string;
  // Validation message shown under the field, telling the user how to fix it.
  error?: string;
  hint?: string;
};

// Select version of TextField with the same props, ids and styling.
export default function SelectField({
  label,
  name,
  id: idProp,
  options,
  placeholder,
  error,
  hint,
  className,
  ...selectProps
}: SelectFieldProps) {
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
      <select
        {...selectProps}
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900 dark:text-gray-100 ${
          error
            ? "border-red-500 dark:border-red-400"
            : "border-gray-300 dark:border-gray-700"
        }${className ? ` ${className}` : ""}`}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
