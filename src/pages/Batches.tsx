import { type BatchStatus, BATCH_STATUS_CONFIG } from "@/types/database";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin, Loader2, PackageX } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { motion } from "framer-motion";
import { useBatches } from "@/lib/queries";
import { getDaysLeft, getPercentLeft, formatDate } from "@/lib/date-utils";

// ------------------------------------------------------------
// Конфиг фильтров
// ------------------------------------------------------------

const filterOptions: { value: BatchStatus | "all"; label: string }[] = [
  { value: "all",          label: "Все"              },
  { value: "ACTIVE",       label: "🟢 Активные"      },
  { value: "HURRY_UP",     label: "🟡 Успей купить"  },
  { value: "URGENT_SALE",  label: "🔴 Срочная"       },
  { value: "EXPIRED",      label: "⚫ Просрочено"    },
];

const progressColors: Record<BatchStatus, string> = {
  ACTIVE:      "bg-status-active",
  HURRY_UP:    "bg-status-hurry",
  URGENT_SALE: "bg-status-urgent",
  EXPIRED:     "bg-status-expired",
};

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function Batches() {
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<BatchStatus | "all">("all");

  const { data, isLoading } = useBatches(
    statusFilter !== "all" ? { status: statusFilter, search } : { search },
    0,
    100
  );

  const batches = data?.data ?? [];

  return (
    <div className="p-4 md:p-8 space-y-6 gradient-mesh min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Партии</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Отслеживание сроков годности
          {!isLoading && data && (
            <span className="ml-1">· {data.count} позиций</span>
          )}
        </p>
      </motion.div>

      {/* Фильтры */}
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

      {/* Список */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <PackageX className="w-12 h-12 opacity-30" />
          <p className="text-sm">Партии не найдены</p>
        </div>
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.03 } },
          }}
        >
          {batches.map((batch) => {
            const daysLeft   = getDaysLeft(batch.expiration_date_effective);
            const percentLeft = getPercentLeft(
              batch.production_date,
              batch.expiration_date_effective
            );

            return (
              <motion.div
                key={batch.id}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              >
                <Card className="hover:shadow-md transition-all duration-200 cursor-default group">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Информация */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <StatusBadge status={batch.current_status} />
                          <span className="font-semibold text-[15px]">
                            {batch.product?.name ?? '—'}
                          </span>
                          {batch.batch_number && (
                            <span className="text-[11px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                              #{batch.batch_number}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2.5 text-[12px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(batch.production_date)} → {formatDate(batch.expiration_date_effective)}
                          </span>
                          {batch.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {batch.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Метрики */}
                      <div className="flex items-center gap-5">
                        {/* Прогресс-бар */}
                        <div className="w-28">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Остаток</span>
                            <span className="font-mono font-semibold">{percentLeft}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressColors[batch.current_status]}`}
                              style={{ width: `${percentLeft}%` }}
                            />
                          </div>
                        </div>

                        {/* Дней */}
                        <div className="text-center w-14">
                          <p className={`text-2xl font-bold font-mono leading-none ${
                            daysLeft <= 0 ? "text-status-urgent"
                            : daysLeft <= 3 ? "text-status-hurry"
                            : "text-foreground"
                          }`}>
                            {daysLeft <= 0 ? "0" : daysLeft}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                            дней
                          </p>
                        </div>

                        {/* Количество */}
                        <div className="text-center w-14">
                          <p className="text-2xl font-bold font-mono leading-none">
                            {batch.quantity}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                            шт
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
