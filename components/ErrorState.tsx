import type { ReactNode } from "react";

type ErrorStateProps = {
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
};

export default function ErrorState({
  title = "เกิดข้อผิดพลาด",
  message = "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center dark:border-red-900 dark:bg-red-950${className ? ` ${className}` : ""}`}
    >
      <p className="text-base font-medium text-red-800 dark:text-red-300">
        {title}
      </p>
      <p className="max-w-md text-sm text-red-700 dark:text-red-400">
        {message}
      </p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
