import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Mail, MessageCircle, Smartphone, Bell,
  CheckCircle2, XCircle, Clock, Loader2, BellOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNotificationLog } from "@/lib/queries";
import type { NotificationChannel, NotificationTrigger, NotificationStatus } from "@/types/database";

// ------------------------------------------------------------
// Конфиг каналов — ключи теперь uppercase из БД
// ------------------------------------------------------------

const channelConfig: Record<NotificationChannel, {
  icon: React.ElementType;
  label: string;
  color: string;
}> = {
  EMAIL:    { icon: Mail,           label: "Email",    color: "text-primary"              },
  TELEGRAM: { icon: MessageCircle,  label: "Telegram", color: "text-[hsl(200,80%,50%)]"   },
  SMS:      { icon: Smartphone,     label: "SMS",      color: "text-status-active"         },
  WEB_PUSH: { icon: Bell,           label: "Push",     color: "text-status-hurry"          },
};

const triggerConfig: Record<NotificationTrigger, { label: string; className: string }> = {
  HURRY_UP:    { label: "Успей купить",       className: "bg-status-hurry-bg text-status-hurry-foreground"     },
  URGENT_SALE: { label: "Срочная распродажа", className: "bg-status-urgent-bg text-status-urgent-foreground"   },
  EXPIRED:     { label: "Просрочено",         className: "bg-status-expired-bg text-status-expired-foreground" },
};

const statusConfig: Record<NotificationStatus, {
  icon: React.ElementType;
  className: string;
  label: string;
}> = {
  PENDING: { icon: Clock,        className: "text-muted-foreground", label: "Ожидает"    },
  SENT:    { icon: Clock,        className: "text-muted-foreground", label: "Отправлено" },
  FAILED:  { icon: XCircle,      className: "text-status-urgent",    label: "Ошибка"     },
  SKIPPED: { icon: Clock,        className: "text-muted-foreground", label: "Пропущено"  },
};

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function Notifications() {
  const { data, isLoading } = useNotificationLog(undefined, 0);
  const logs = data?.data ?? [];

  return (
    <div className="p-4 md:p-8 space-y-6 gradient-mesh min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Уведомления</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Журнал отправленных алертов
          {!isLoading && data && <span> · {data.count} записей</span>}
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <BellOff className="w-12 h-12 opacity-30" />
          <p className="text-sm">Уведомлений пока нет</p>
          <p className="text-xs opacity-60">Они появятся когда партии начнут истекать</p>
        </div>
      ) : (
        <motion.div
          className="space-y-2.5"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.04 } },
          }}
        >
          {logs.map((log) => {
            const channel   = channelConfig[log.channel];
            const trigger   = triggerConfig[log.trigger];
            const status    = statusConfig[log.status];
            const ChannelIcon = channel.icon;
            const StatusIcon  = status.icon;

            return (
              <motion.div
                key={log.id}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              >
                <Card className="hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <ChannelIcon className={`w-5 h-5 ${channel.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${trigger.className}`}>
                          {trigger.label}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {log.recipient_ref}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {channel.label} · {format(new Date(log.created_at), "dd.MM.yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusIcon className={`w-4 h-4 ${status.className}`} />
                      <span className={`text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
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
