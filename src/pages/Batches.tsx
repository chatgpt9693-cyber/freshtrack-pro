import { batches, getDaysLeft, getPercentLeft, type BatchStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const filterOptions: { value: BatchStatus | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "active", label: "🟢 Активные" },
  { value: "hurry_up", label: "🟡 Успей купить" },
  { value: "urgent_sale", label: "🔴 Срочная распродажа" },
  { value: "expired", label: "⚫ Просрочено" },
];

export default function Batches() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BatchStatus | "all">("all");

  const filtered = batches.filter((b) => {
    const matchesSearch =
      b.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      b.batchNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Партии</h1>
        <p className="text-muted-foreground text-sm mt-1">Отслеживание сроков годности</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((batch) => {
          const daysLeft = getDaysLeft(batch.expirationDate);
          const percentLeft = getPercentLeft(batch.productionDate, batch.product?.shelfLifeDays || 0);
          const progressColor =
            batch.currentStatus === "active" ? "bg-status-active"
            : batch.currentStatus === "hurry_up" ? "bg-status-hurry"
            : batch.currentStatus === "urgent_sale" ? "bg-status-urgent"
            : "bg-status-expired";

          return (
            <Card key={batch.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={batch.currentStatus} />
                      <span className="font-semibold text-sm">{batch.product?.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">#{batch.batchNumber}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>📅 Произв: {format(batch.productionDate, "dd.MM.yyyy")}</span>
                      <span>⏳ Истекает: {format(batch.expirationDate, "dd.MM.yyyy")}</span>
                      <span>📍 {batch.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:text-right">
                    <div className="w-24">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${percentLeft}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{percentLeft}% осталось</p>
                    </div>
                    <div>
                      <p className={`text-xl font-bold font-mono ${daysLeft <= 0 ? "text-status-urgent" : daysLeft <= 3 ? "text-status-hurry" : "text-foreground"}`}>
                        {daysLeft <= 0 ? "0" : daysLeft}
                      </p>
                      <p className="text-xs text-muted-foreground">дней</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold font-mono">{batch.quantity}</p>
                      <p className="text-xs text-muted-foreground">шт.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
