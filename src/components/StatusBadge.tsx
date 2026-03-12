import { BatchStatus, statusConfig } from "@/lib/mock-data";

interface StatusBadgeProps {
  status: BatchStatus;
  size?: "sm" | "md" | "lg";
  showEmoji?: boolean;
  pulse?: boolean;
}

export function StatusBadge({ status, size = "sm", showEmoji = true, pulse }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = {
    sm: "px-2.5 py-1 text-[11px]",
    md: "px-3 py-1.5 text-xs",
    lg: "px-4 py-2 text-sm",
  };

  const shouldPulse = pulse ?? status === "urgent_sale";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${sizeClasses[size]} ${config.className} ${
        shouldPulse ? "animate-pulse-status" : ""
      }`}
    >
      {showEmoji && <span className="text-xs">{config.emoji}</span>}
      {config.label}
    </span>
  );
}
