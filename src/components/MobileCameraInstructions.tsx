import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Settings, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Camera
} from "lucide-react";

export function MobileCameraInstructions() {
  const refreshPage = () => {
    window.location.reload();
  };

  const openSettings = () => {
    // Для Android Chrome
    if (navigator.userAgent.includes("Android") && navigator.userAgent.includes("Chrome")) {
      alert("Откройте Настройки Chrome → Настройки сайта → Камера → Разрешить для этого сайта");
    } else {
      alert("Откройте настройки браузера и разрешите доступ к камере для этого сайта");
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Smartphone className="w-5 h-5" />
          Инструкции для мобильного устройства
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Пошаговые инструкции */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-white border border-amber-200 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium text-sm">Найдите всплывающий запрос</p>
              <p className="text-xs text-muted-foreground mt-1">
                Браузер должен показать запрос "Разрешить доступ к камере?" в верхней части экрана
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white border border-green-200 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium text-sm">Нажмите "Разрешить"</p>
              <p className="text-xs text-muted-foreground mt-1">
                Выберите "Разрешить" или "Allow" в появившемся запросе
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Если запрос не появился</p>
              <p className="text-xs text-muted-foreground mt-1">
                Нажмите на адресную строку и найдите иконку камеры 📷 или замка 🔒
              </p>
            </div>
          </div>
        </div>

        {/* Действия */}
        <div className="space-y-2">
          <Button
            onClick={refreshPage}
            className="w-full"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить страницу
          </Button>
          
          <Button
            onClick={openSettings}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Помощь с настройками
          </Button>
        </div>

        {/* Дополнительные советы */}
        <div className="p-3 bg-white border border-gray-200 rounded-lg">
          <p className="font-medium text-xs mb-2">💡 Дополнительные советы:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Закройте другие приложения с камерой (WhatsApp, Telegram, Instagram)</li>
            <li>• Убедитесь, что камера не заклеена или заблокирована</li>
            <li>• Попробуйте перезапустить браузер</li>
            <li>• Проверьте, что у приложения есть разрешение в настройках Android/iOS</li>
          </ul>
        </div>

        {/* Проверка браузера */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <p className="font-medium text-xs text-blue-800">Рекомендуемые браузеры:</p>
          </div>
          <ul className="text-xs text-blue-700 space-y-0.5">
            <li>• Chrome (Android) - лучший выбор</li>
            <li>• Safari (iOS) - встроенный браузер</li>
            <li>• Firefox (Android/iOS)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}