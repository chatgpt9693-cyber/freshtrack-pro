import { Package, AlertTriangle, XCircle, CheckCircle, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { batches, statusConfig, getDaysLeft, type BatchStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { motion } from "framer-motion";

const statusCounts = batches.reduce(
  (acc, b) => {
    acc[b.currentStatus] = (acc[b.currentStatus] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

const pieData = [
  { name: "Активные", value: statusCounts.active || 0, color: "hsl(152, 60%, 48%)" },
  { name: "Успей купить", value: statusCounts.hurry_up || 0, color: "hsl(38, 92%, 50%)" },
  { name: "Срочная распродажа", value: statusCounts.urgent_sale || 0, color: "hsl(0, 76%, 57%)" },
  { name: "Просрочено", value: statusCounts.expired || 0, color: "hsl(225, 10%, 35%)" },
];

const summaryCards = [
  { label: "Всего партий", value: batches.length, icon: Package, color: "primary" as const },
  { label: "Активные", value: statusCounts.active || 0, icon: CheckCircle, color: "active" as const },
  { label: "Требуют внимания", value: (statusCounts.hurry_up || 0) + (statusCounts.urgent_sale || 0), icon: AlertTriangle, color: "warning" as const },
  { label: "Просрочено", value: statusCounts.expired || 0, icon: XCircle, color: "danger" as const },
];

const colorMap = {
  primary: { bg: "bg-accent", icon: "text-primary", border: "border-primary/10" },
  active: { bg: "bg-status-active-bg", icon: "text-status-active", border: "border-status-active/10" },
  warning: { bg: "bg-status-hurry-bg", icon: "text-status-hurry", border: "border-status-hurry/10" },
  danger: { bg: "bg-status-urgent-bg", icon: "text-status-urgent", border: "border-status-urgent/10" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  const urgentBatches = batches
    .filter((b) => b.currentStatus !== "active")
    .sort((a, b) => getDaysLeft(a.expirationDate) - getDaysLeft(b.expirationDate));

  return (
    <div className="p-4 md:p-8 space-y-8 gradient-mesh min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Дашборд</h1>
        <p className="text-muted-foreground text-sm mt-1">Обзор сроков годности · {format(new Date(), "dd.MM.yyyy")}</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={container} initial="hidden" animate="show">
        {summaryCards.map(({ label, value, icon: Icon, color }) => {
          const colors = colorMap[color];
          return (
            <motion.div key={label} variants={item}>
              <Card className={`border ${colors.border} hover:shadow-lg transition-all duration-300 group cursor-default`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
                      <p className="text-3xl font-bold font-mono mt-2 tracking-tighter">{value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
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
        {/* Pie Chart */}
        <motion.div className="lg:col-span-2" variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Распределение</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                    <span className="text-xs font-mono font-semibold ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Urgent Batches */}
        <motion.div className="lg:col-span-3" variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Требуют внимания</CardTitle>
                <span className="text-xs font-mono bg-status-urgent-bg text-status-urgent-foreground px-2 py-1 rounded-full">
                  {urgentBatches.length} позиций
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {urgentBatches.length === 0 && (
                  <p className="p-6 text-muted-foreground text-sm text-center">Все продукты в норме ✓</p>
                )}
                {urgentBatches.slice(0, 7).map((batch, i) => {
                  const daysLeft = getDaysLeft(batch.expirationDate);
                  return (
                    <motion.div
                      key={batch.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-default"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusBadge status={batch.currentStatus} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{batch.product?.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            #{batch.batchNumber} · {batch.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className={`text-lg font-bold font-mono ${
                          daysLeft <= 0 ? "text-status-urgent" : daysLeft <= 3 ? "text-status-hurry" : "text-muted-foreground"
                        }`}>
                          {daysLeft <= 0 ? "—" : daysLeft}
                          <span className="text-xs font-normal ml-0.5">{daysLeft > 0 ? "дн" : ""}</span>
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
