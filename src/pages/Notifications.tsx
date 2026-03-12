import { notificationLogs } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Mail, MessageCircle, Smartphone, Bell } from "lucide-react";

const channelIcons = {
  email: Mail,
  telegram: MessageCircle,
  sms: Smartphone,
  push: Bell,
};

const typeLabels = {
  hurry_up: { label: "Успей купить", className: "status-badge-hurry" },
  urgent_sale: { label: "Срочная распродажа", className: "status-badge-urgent" },
  expired: { label: "Просрочено", className: "status-badge-expired" },
};

const statusLabels = {
  sent: { label: "Отправлено", className: "text-muted-foreground" },
  delivered: { label: "Доставлено", className: "text-status-active" },
  failed: { label: "Ошибка", className: "text-status-urgent" },
};

export default function Notifications() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Уведомления</h1>
        <p className="text-muted-foreground text-sm mt-1">Журнал отправленных алертов</p>
      </div>

      <div className="space-y-3">
        {notificationLogs.map((log) => {
          const ChannelIcon = channelIcons[log.channel];
          const typeConfig = typeLabels[log.type];
          const statusConf = statusLabels[log.status];

          return (
            <Card key={log.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <ChannelIcon className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeConfig.className}`}>
                      {typeConfig.label}
                    </span>
                    <span className="text-sm font-medium truncate">{log.productName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {log.channel.toUpperCase()} · {format(log.sentAt, "dd.MM.yyyy HH:mm")}
                  </p>
                </div>
                <span className={`text-xs font-medium ${statusConf.className}`}>
                  {statusConf.label}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
