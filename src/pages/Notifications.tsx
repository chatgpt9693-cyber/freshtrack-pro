import { notificationLogs } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Mail, MessageCircle, Smartphone, Bell, CheckCircle2, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const channelConfig = {
  email: { icon: Mail, label: "Email", color: "text-primary" },
  telegram: { icon: MessageCircle, label: "Telegram", color: "text-[hsl(200,80%,50%)]" },
  sms: { icon: Smartphone, label: "SMS", color: "text-status-active" },
  push: { icon: Bell, label: "Push", color: "text-status-hurry" },
};

const typeLabels = {
  hurry_up: { label: "Успей купить", className: "status-badge-hurry" },
  urgent_sale: { label: "Срочная распродажа", className: "status-badge-urgent" },
  expired: { label: "Просрочено", className: "status-badge-expired" },
};

const statusIcons = {
  sent: { icon: Clock, className: "text-muted-foreground", label: "Отправлено" },
  delivered: { icon: CheckCircle2, className: "text-status-active", label: "Доставлено" },
  failed: { icon: XCircle, className: "text-status-urgent", label: "Ошибка" },
};

export default function Notifications() {
  return (
    <div className="p-4 md:p-8 space-y-6 gradient-mesh min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Уведомления</h1>
        <p className="text-muted-foreground text-sm mt-1">Журнал отправленных алертов</p>
      </motion.div>

      <motion.div
        className="space-y-2.5"
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
      >
        {notificationLogs.map((log) => {
          const channel = channelConfig[log.channel];
          const ChannelIcon = channel.icon;
          const typeConf = typeLabels[log.type];
          const statusConf = statusIcons[log.status];
          const StatusIcon = statusConf.icon;

          return (
            <motion.div
              key={log.id}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            >
              <Card className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0`}>
                    <ChannelIcon className={`w-5 h-5 ${channel.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${typeConf.className}`}>
                        {typeConf.label}
                      </span>
                      <span className="text-sm font-medium truncate">{log.productName}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {channel.label} · {format(log.sentAt, "dd.MM.yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusIcon className={`w-4 h-4 ${statusConf.className}`} />
                    <span className={`text-xs font-medium ${statusConf.className}`}>{statusConf.label}</span>
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
