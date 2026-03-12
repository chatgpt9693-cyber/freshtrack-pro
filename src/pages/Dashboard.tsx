import { Package, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { batches, statusConfig, getDaysLeft, type BatchStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const statusCounts = batches.reduce(
  (acc, b) => {
    acc[b.currentStatus] = (acc[b.currentStatus] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

const pieData = [
  { name: "Активные", value: statusCounts.active || 0, color: "hsl(142, 70%, 45%)" },
  { name: "Успей купить", value: statusCounts.hurry_up || 0, color: "hsl(45, 93%, 47%)" },
  { name: "Срочная распродажа", value: statusCounts.urgent_sale || 0, color: "hsl(0, 84%, 55%)" },
  { name: "Просрочено", value: statusCounts.expired || 0, color: "hsl(0, 0%, 20%)" },
];

const summaryCards = [
  { label: "Всего партий", value: batches.length, icon: Package, variant: "default" as const },
  { label: "Активные", value: statusCounts.active || 0, icon: CheckCircle, variant: "active" as const },
  { label: "Требуют внимания", value: (statusCounts.hurry_up || 0) + (statusCounts.urgent_sale || 0), icon: AlertTriangle, variant: "warning" as const },
  { label: "Просрочено", value: statusCounts.expired || 0, icon: XCircle, variant: "danger" as const },
];

const variantClasses = {
  default: "border-border",
  active: "border-status-active/30",
  warning: "border-status-hurry/30",
  danger: "border-status-urgent/30",
};

const iconVariantClasses = {
  default: "text-primary",
  active: "text-status-active",
  warning: "text-status-hurry",
  danger: "text-status-urgent",
};

export default function Dashboard() {
  const urgentBatches = batches
    .filter((b) => b.currentStatus !== "active")
    .sort((a, b) => getDaysLeft(a.expirationDate) - getDaysLeft(b.expirationDate));

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <p className="text-muted-foreground text-sm mt-1">Обзор сроков годности продуктов</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, variant }) => (
          <Card key={label} className={`border-l-4 ${variantClasses[variant]}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-3xl font-bold font-mono mt-1">{value}</p>
                </div>
                <Icon className={`w-8 h-8 ${iconVariantClasses[variant]} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Pie Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Распределение по категориям</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Urgent Batches */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Требуют внимания</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {urgentBatches.length === 0 && (
                <p className="p-4 text-muted-foreground text-sm">Все продукты в норме ✓</p>
              )}
              {urgentBatches.slice(0, 8).map((batch) => {
                const daysLeft = getDaysLeft(batch.expirationDate);
                return (
                  <div key={batch.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusBadge status={batch.currentStatus} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{batch.product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Партия {batch.batchNumber} · {batch.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-sm font-mono font-semibold ${daysLeft <= 0 ? "text-status-urgent" : daysLeft <= 3 ? "text-status-hurry" : "text-muted-foreground"}`}>
                        {daysLeft <= 0 ? "Истёк" : `${daysLeft} дн.`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(batch.expirationDate, "dd.MM.yyyy")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
