import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Camera, 
  Monitor, 
  Smartphone,
  ExternalLink,
  RefreshCw
} from "lucide-react";

export function CameraSettings() {
  const [browserInfo, setBrowserInfo] = useState<{
    name: string;
    settingsUrl?: string;
    instructions: string[];
  } | null>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    let browser = { name: "Неизвестный браузер", instructions: ["Откройте настройки браузера", "Найдите раздел 'Конфиденциальность'", "Управляйте разрешениями сайтов"] };

    if (userAgent.includes("Chrome")) {
      browser = {
        name: "Google Chrome",
        settingsUrl: "chrome://settings/content/camera",
        instructions: [
          "Нажмите на замок 🔒 или камеру 📷 в адресной строке",
          "Выберите 'Разрешить' для камеры",
          "Или перейдите в chrome://settings/content/camera"
        ]
      };
    } else if (userAgent.includes("Firefox")) {
      browser = {
        name: "Mozilla Firefox",
        instructions: [
          "Нажмите на щит 🛡️ или камеру 📷 в адресной строке",
          "Выберите 'Разрешить' для камеры",
          "Или откройте Настройки → Приватность и защита → Разрешения"
        ]
      };
    } else if (userAgent.includes("Safari")) {
      browser = {
        name: "Safari",
        instructions: [
          "Нажмите Safari → Настройки → Веб-сайты",
          "Выберите 'Камера' в левом меню",
          "Установите 'Разрешить' для этого сайта"
        ]
      };
    } else if (userAgent.includes("Edge")) {
      browser = {
        name: "Microsoft Edge",
        settingsUrl: "edge://settings/content/camera",
        instructions: [
          "Нажмите на замок 🔒 или камеру 📷 в адресной строке",
          "Выберите 'Разрешить' для камеры",
          "Или перейдите в edge://settings/content/camera"
        ]
      };
    }

    setBrowserInfo(browser);
  }, []);

  const openBrowserSettings = () => {
    if (browserInfo?.settingsUrl) {
      window.open(browserInfo.settingsUrl, '_blank');
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const getDeviceType = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile ? "mobile" : "desktop";
  };

  const deviceType = getDeviceType();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="w-4 h-4" />
          Настройки камеры
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Информация о браузере */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {deviceType === "mobile" ? (
              <Smartphone className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Monitor className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{browserInfo?.name}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {deviceType === "mobile" ? "Мобильное" : "Десктоп"}
          </Badge>
        </div>

        {/* Инструкции */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Как разрешить доступ:</h4>
          <ol className="space-y-1">
            {browserInfo?.instructions.map((instruction, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold mt-0.5 flex-shrink-0">
                  {index + 1}
                </span>
                {instruction}
              </li>
            ))}
          </ol>
        </div>

        {/* Быстрые действия */}
        <div className="flex gap-2">
          {browserInfo?.settingsUrl && (
            <Button
              onClick={openBrowserSettings}
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Настройки
            </Button>
          )}
          <Button
            onClick={refreshPage}
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-8"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Обновить
          </Button>
        </div>

        {/* Дополнительные советы */}
        <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
          <p className="font-medium mb-1">💡 Полезные советы:</p>
          <ul className="space-y-0.5">
            <li>• Закройте другие приложения, использующие камеру</li>
            <li>• Проверьте, что камера подключена и работает</li>
            <li>• Попробуйте перезапустить браузер</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}