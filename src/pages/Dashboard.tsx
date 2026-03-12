import { Package, AlertTriangle, XCircle, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDashboardStats, useBatches } from "@/lib/queries";
import { getDaysLeft, formatDaysLeft } from "@/lib/date-utils";
import { BATCH_STATUS_CONFIG } from "@/types/database";

// ------------------------------------------------------------
// Animation variants
// ------------------------------------------------------------

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ------------------------------------------------------------
// Color maps
// ------------------------------------------------------------

const colorMap = {
  primary: { bg: "bg-accent",           icon: "text-primary",       border: "border-primary/10"      },
  active:  { bg: "bg-status-active-bg", icon: "text-status-active", border: "border-status-active/10" },
  warning: { bg: "bg-status-hurry-bg",  icon: "text-status-hurry",  border: "border-status-hurry/10"  },
  danger:  { bg: "bg-status-urgent-bg", icon: "text-status-urgent", border: "border-status-urgent/10" },
} as const;

// ------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------

export default function Dashboard() {
  // Статистика для карточек и диаграммы
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  // Партии требующие внимания (не ACTIVE) — сортируем по срочности
  const { data: urgentData, isLoading: urgentLoading } = useBatches({
    status: ['HURRY_UP', 'URGENT_SALE', 'EXPIRED'],
  });

  const urgentBatches = (urgentData?.data ?? [])
    .sort((a, b) => getDaysLeft(a.expiration_date_effective) - getDaysLeft(b.expiration_date_effective));

  // Данные для сводных карточек
  const summaryCards = [
    {
      label: "Всего партий",
      value: stats?.total ?? 0,
      icon: Package,
      color: "primary" as const,
    },
    {
      label: "Активные",
      value: stats?.active ?? 0,
      icon: CheckCircle,
      color: "active" as const,
    },
    {
      label: "Требуют внимания",
      value: (stats?.hurry_up ?? 0) + (stats?.urgent_sale ?? 0),
      icon: AlertTriangle,
      color: "warning" as const,
    },
    {
      label: "Просрочено",
      value: stats?.expired ?? 0,
      icon: XCircle,
      color: "danger" as const,
    },
  ];

  // Данные для круговой диаграммы
  const pieData = [
    { name: "Активные",          value: stats?.active      ?? 0, color: "hsl(152, 60%, 48%)" },
    { name: "Успей купить",      value: stats?.hurry_up    ?? 0, color: "hsl(38, 92%, 50%)"  },
    { name: "Срочная распродажа",value: stats?.urgent_sale ?? 0, color: "hsl(0, 76%, 57%)"   },
    { name: "Просрочено",        value: stats?.expired     ?? 0, color: "hsl(225, 10%, 35%)" },
  ].filter((d) => d.value > 0); // скрываем нулевые сегменты

  return (
    <div className="p-4 md:p-8 space-y-8 gradient-mesh min-h-screen">
      {/* Заголовок */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Дашборд</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Обзор сроков годности · {format(new Date(), "dd.MM.yyyy")}
        </p>
      </motion.div>

      {/* Сводные карточки */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {summaryCards.map(({ label, value, icon: Icon, color }) => {
          const colors = colorMap[color];
          return (
            <motion.div key={label} variants={item}>
              <Card
                className={`border ${colors.border} hover:shadow-lg transition-all duration-300 group cursor-default`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                        {label}
                      </p>
                      {statsLoading ? (
                        <div className="h-9 flex items-center mt-2">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <p className="text-3xl font-bold font-mono mt-2 tracking-tighter">
                          {value}
                        </p>
                      )}
                    </div>
                    <div
                      className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Круговая диаграмма */}
        <motion.div className="lg:col-span-2" variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Распределение
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-[240px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                          fontSize: "13px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: d.color }}
                        />
                        <span className="text-xs text-muted-foreground truncate">{d.name}</span>
                        <span className="text-xs font-mono font-semibold ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Список срочных партий */}
        <motion.div className="lg:col-span-3" variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Требуют внимания
              </CardTitle>
              {!urgentLoading && urgentBatches.length > 0 && (
                <span className="text-xs font-mono text-muted-foreground">
                  {urgentBatches.length} позиций
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {urgentLoading ? (
                <div className="h-[240px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : urgentBatches.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-10 h-10 text-status-active opacity-50" />
                  <p className="text-sm">Все партии в порядке</p>
                </div>
              ) : (
                urgentBatches.slice(0, 8).map((batch) => {
                  const config = BATCH_STATUS_CONFIG[batch.current_status];
                  const daysLeft = getDaysLeft(batch.expiration_date_effective);

                  return (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusBadge status={batch.current_status} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {batch.product?.name ?? '—'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            #{batch.batch_number ?? batch.id.slice(0, 8)} · {batch.location ?? '—'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-mono font-semibold ml-2 flex-shrink-0 ${
                          daysLeft <= 0
                            ? 'text-status-expired-foreground'
                            : daysLeft <= 3
                            ? 'text-status-urgent-foreground'
                            : 'text-status-hurry-foreground'
                        }`}
                      >
                        {daysLeft <= 0
                          ? `−${Math.abs(daysLeft)} дн.`
                          : `${daysLeft} дн.`}
                      </span>
                    </div>
                  );
                })
              )}

              {!urgentLoading && urgentBatches.length > 8 && (
                <Link
                  to="/batches"
                  className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Показать все {urgentBatches.length} позиций
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
