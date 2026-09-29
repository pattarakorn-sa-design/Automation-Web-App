export type MachineStatus = "Running" | "Stop" | "Alarm" | "Maintenance";

const STATUS_STYLES: Record<MachineStatus, { badge: string; dot: string }> = {
  Running: {
    badge:
      "bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-950 dark:text-green-300 dark:ring-green-400/30",
    dot: "bg-green-500",
  },
  Stop: {
    badge:
      "bg-gray-100 text-gray-700 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-400/30",
    dot: "bg-gray-500",
  },
  Alarm: {
    badge:
      "bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-950 dark:text-red-300 dark:ring-red-400/30",
    dot: "bg-red-500",
  },
  Maintenance: {
    badge:
      "bg-yellow-100 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-950 dark:text-yellow-300 dark:ring-yellow-400/30",
    dot: "bg-yellow-500",
  },
};

type StatusBadgeProps = {
  status: MachineStatus;
  className?: string;
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}${className ? ` ${className}` : ""}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
      />
      {status}
    </span>
  );
}
