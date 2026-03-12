import { BatchStatus, statusConfig } from "@/lib/mock-data";

interface StatusBadgeProps {
  status: BatchStatus;
  size?: "sm" | "md";
  showEmoji?: boolean;
}

export function StatusBadge({ status, size = "sm", showEmoji = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${config.className} ${
        status === "urgent_sale" ? "animate-pulse-status" : ""
      }`}
    >
      {showEmoji && <span>{config.emoji}</span>}
      {config.label}
    </span>
  );
}
