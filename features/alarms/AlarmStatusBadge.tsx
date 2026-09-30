import type { AlarmStatus } from "./status";

// Open is urgent (red), In Progress is being handled (yellow), Closed is done
// (green). Always shows the text too, not colour alone (NFR-USE-02).
const STYLES: Record<AlarmStatus, { badge: string; dot: string }> = {
  Open: {
    badge:
      "bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-950 dark:text-red-300 dark:ring-red-400/30",
    dot: "bg-red-500",
  },
  "In Progress": {
    badge:
      "bg-yellow-100 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-950 dark:text-yellow-300 dark:ring-yellow-400/30",
    dot: "bg-yellow-500",
  },
  Closed: {
    badge:
      "bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-950 dark:text-green-300 dark:ring-green-400/30",
    dot: "bg-green-500",
  },
};

export default function AlarmStatusBadge({
  status,
  className,
}: {
  status: AlarmStatus;
  className?: string;
}) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}${className ? ` ${className}` : ""}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
