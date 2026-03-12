import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-1">Конфигурация системы</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Пороги категорий</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">🟡 «Успей купить» (% остатка)</Label>
              <Input type="number" defaultValue={30} className="mt-1 font-mono" />
            </div>
            <div>
              <Label className="text-sm">🔴 «Срочная распродажа» (% остатка)</Label>
              <Input type="number" defaultValue={10} className="mt-1 font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Каналы уведомлений</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Email (SMTP)", enabled: true },
            { label: "Telegram Bot", enabled: false },
            { label: "SMS (Twilio)", enabled: false },
            { label: "Push-уведомления", enabled: false },
          ].map((ch) => (
            <div key={ch.label} className="flex items-center justify-between">
              <Label>{ch.label}</Label>
              <Switch defaultChecked={ch.enabled} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Автоматическая проверка</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="text-sm">Интервал проверки (минуты)</Label>
            <Input type="number" defaultValue={15} className="mt-1 font-mono w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
