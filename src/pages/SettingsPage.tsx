import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Bell, Mail, MessageCircle, Smartphone, Timer } from "lucide-react";
import { useState } from "react";

const channels = [
  { label: "Email (SMTP)", icon: Mail, enabled: true, desc: "Отправка писем через SMTP" },
  { label: "Telegram Bot", icon: MessageCircle, enabled: false, desc: "Уведомления через бота" },
  { label: "SMS (Twilio)", icon: Smartphone, enabled: false, desc: "SMS-рассылка" },
  { label: "Push-уведомления", icon: Bell, enabled: false, desc: "Web Push API" },
];

export default function SettingsPage() {
  const [hurryThreshold, setHurryThreshold] = useState([30]);
  const [urgentThreshold, setUrgentThreshold] = useState([10]);
  const [checkInterval, setCheckInterval] = useState(15);

  return (
    <div className="p-4 md:p-8 gradient-mesh min-h-screen">
      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Настройки</h1>
          <p className="text-muted-foreground text-sm mt-1">Конфигурация системы</p>
        </motion.div>

        {/* Thresholds */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Пороги категорий
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm">🟡 «Успей купить»</Label>
                  <span className="text-sm font-mono font-bold text-status-hurry">{hurryThreshold[0]}%</span>
                </div>
                <Slider
                  value={hurryThreshold}
                  onValueChange={setHurryThreshold}
                  max={50}
                  min={15}
                  step={1}
                  className="w-full"
                />
                <p className="text-[11px] text-muted-foreground mt-2">Когда остаётся менее {hurryThreshold[0]}% срока годности</p>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm">🔴 «Срочная распродажа»</Label>
                  <span className="text-sm font-mono font-bold text-status-urgent">{urgentThreshold[0]}%</span>
                </div>
                <Slider
                  value={urgentThreshold}
                  onValueChange={setUrgentThreshold}
                  max={25}
                  min={3}
                  step={1}
                  className="w-full"
                />
                <p className="text-[11px] text-muted-foreground mt-2">Когда остаётся менее {urgentThreshold[0]}% срока годности</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Channels */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Каналы уведомлений
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {channels.map((ch, i) => {
                const Icon = ch.icon;
                return (
                  <div key={ch.label}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ch.label}</p>
                          <p className="text-[11px] text-muted-foreground">{ch.desc}</p>
                        </div>
                      </div>
                      <Switch defaultChecked={ch.enabled} />
                    </div>
                    {i < channels.length - 1 && <Separator />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Auto check */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Автоматическая проверка</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label className="text-sm whitespace-nowrap">Интервал</Label>
                <Input
                  type="number"
                  value={checkInterval}
                  onChange={(e) => setCheckInterval(Number(e.target.value))}
                  className="w-24 font-mono rounded-xl h-11"
                  min={1}
                />
                <span className="text-sm text-muted-foreground">минут</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Система проверяет все активные партии каждые {checkInterval} мин
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
