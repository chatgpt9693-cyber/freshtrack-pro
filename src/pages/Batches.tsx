import { batches, getDaysLeft, getPercentLeft, type BatchStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { motion } from "framer-motion";

const filterOptions: { value: BatchStatus | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "active", label: "🟢 Активные" },
  { value: "hurry_up", label: "🟡 Успей купить" },
  { value: "urgent_sale", label: "🔴 Срочная" },
  { value: "expired", label: "⚫ Просрочено" },
];

const progressColors: Record<BatchStatus, string> = {
  active: "bg-status-active",
  hurry_up: "bg-status-hurry",
  urgent_sale: "bg-status-urgent",
  expired: "bg-status-expired",
};

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
    <div className="p-4 md:p-8 space-y-6 gradient-mesh min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Партии</h1>
        <p className="text-muted-foreground text-sm mt-1">Отслеживание сроков годности</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск партии..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-card"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3.5 py-2 text-xs rounded-xl font-medium transition-all duration-200 ${
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-card text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        className="space-y-3"
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
      >
        {filtered.map((batch) => {
          const daysLeft = getDaysLeft(batch.expirationDate);
          const percentLeft = getPercentLeft(batch.productionDate, batch.product?.shelfLifeDays || 0);

          return (
            <motion.div
              key={batch.id}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            >
              <Card className="hover:shadow-md transition-all duration-200 cursor-default group">
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <StatusBadge status={batch.currentStatus} />
                        <span className="font-semibold text-[15px]">{batch.product?.name}</span>
                        <span className="text-[11px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                          #{batch.batchNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2.5 text-[12px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(batch.productionDate, "dd.MM.yy")} → {format(batch.expirationDate, "dd.MM.yy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {batch.location}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-5">
                      {/* Progress */}
                      <div className="w-28">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Остаток</span>
                          <span className="font-mono font-semibold">{percentLeft}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progressColors[batch.currentStatus]}`}
                            style={{ width: `${percentLeft}%` }}
                          />
                        </div>
                      </div>

                      {/* Days */}
                      <div className="text-center w-14">
                        <p className={`text-2xl font-bold font-mono leading-none ${
                          daysLeft <= 0 ? "text-status-urgent" : daysLeft <= 3 ? "text-status-hurry" : "text-foreground"
                        }`}>
                          {daysLeft <= 0 ? "0" : daysLeft}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">дней</p>
                      </div>

                      {/* Qty */}
                      <div className="text-center w-14">
                        <p className="text-2xl font-bold font-mono leading-none">{batch.quantity}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">шт</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
