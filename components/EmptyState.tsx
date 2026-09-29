import type { ReactNode } from "react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title = "ไม่พบข้อมูล",
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700${className ? ` ${className}` : ""}`}
    >
      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
        {title}
      </p>
      {description ? (
        <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
