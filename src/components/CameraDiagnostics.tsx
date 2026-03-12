import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Shield,
  Globe,
  Monitor
} from "lucide-react";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning" | "loading";
  message: string;
  details?: string;
}

export function CameraDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // 1. Проверка поддержки MediaDevices API
    results.push({
      name: "MediaDevices API",
      status: "loading",
      message: "Проверка поддержки...",
    });
    setDiagnostics([...results]);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      results[0] = {
        name: "MediaDevices API",
        status: "error",
        message: "Не поддерживается",
        details: "Обновите браузер или используйте Chrome/Firefox/Safari"
      };
    } else {
      results[0] = {
        name: "MediaDevices API",
        status: "success",
        message: "Поддерживается",
      };
    }
    setDiagnostics([...results]);

    // 2. Проверка HTTPS
    results.push({
      name: "HTTPS соединение",
      status: "loading",
      message: "Проверка протокола...",
    });
    setDiagnostics([...results]);

    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    results[1] = {
      name: "HTTPS соединение",
      status: isHTTPS ? "success" : "warning",
      message: isHTTPS ? "Безопасное соединение" : "HTTP соединение",
      details: isHTTPS ? undefined : "Для продакшена требуется HTTPS"
    };
    setDiagnostics([...results]);

    // 3. Получение списка камер
    results.push({
      name: "Доступные камеры",
      status: "loading",
      message: "Поиск устройств...",
    });
    setDiagnostics([...results]);

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);

      if (cameras.length === 0) {
        results[2] = {
          name: "Доступные камеры",
          status: "error",
          message: "Камеры не найдены",
          details: "Подключите камеру или проверьте драйверы"
        };
      } else {
        results[2] = {
          name: "Доступные камеры",
          status: "success",
          message: `Найдено камер: ${cameras.length}`,
          details: cameras.map(c => c.label || "Неизвестная камера").join(", ")
        };
      }
    } catch (err) {
      results[2] = {
        name: "Доступные камеры",
        status: "error",
        message: "Ошибка получения списка",
        details: err instanceof Error ? err.message : "Неизвестная ошибка"
      };
    }
    setDiagnostics([...results]);

    // 4. Тест доступа к камере
    results.push({
      name: "Доступ к камере",
      status: "loading",
      message: "Запрос разрешений...",
    });
    setDiagnostics([...results]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 } 
      });
      
      // Останавливаем поток сразу после получения
      stream.getTracks().forEach(track => track.stop());
      
      results[3] = {
        name: "Доступ к камере",
        status: "success",
        message: "Разрешение получено",
        details: "Камера готова к использованию"
      };
    } catch (err: any) {
      let message = "Доступ запрещен";
      let details = "";

      if (err.name === "NotAllowedError") {
        message = "Доступ запрещен пользователем";
        details = "Нажмите на иконку камеры в адресной строке и разрешите доступ";
      } else if (err.name === "NotFoundError") {
        message = "Камера не найдена";
        details = "Проверьте подключение камеры";
      } else if (err.name === "NotReadableError") {
        message = "Камера занята";
        details = "Закройте другие приложения, использующие камеру";
      } else {
        details = err.message || "Неизвестная ошибка";
      }

      results[3] = {
        name: "Доступ к камере",
        status: "error",
        message,
        details
      };
    }
    setDiagnostics([...results]);

    // 5. Проверка браузера
    results.push({
      name: "Совместимость браузера",
      status: "loading",
      message: "Анализ браузера...",
    });
    setDiagnostics([...results]);

    const userAgent = navigator.userAgent;
    let browserStatus: "success" | "warning" | "error" = "success";
    let browserMessage = "Браузер поддерживается";
    let browserDetails = "";

    if (userAgent.includes("Chrome")) {
      browserMessage = "Google Chrome - отлично";
    } else if (userAgent.includes("Firefox")) {
      browserMessage = "Mozilla Firefox - хорошо";
    } else if (userAgent.includes("Safari")) {
      browserMessage = "Safari - хорошо";
    } else if (userAgent.includes("Edge")) {
      browserMessage = "Microsoft Edge - хорошо";
    } else {
      browserStatus = "warning";
      browserMessage = "Неизвестный браузер";
      browserDetails = "Рекомендуется Chrome, Firefox или Safari";
    }

    results[4] = {
      name: "Совместимость браузера",
      status: browserStatus,
      message: browserMessage,
      details: browserDetails
    };
    setDiagnostics([...results]);

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "loading":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 border-green-200">OK</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Ошибка</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Внимание</Badge>;
      case "loading":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Проверка...</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Диагностика камеры
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Проверка системы...
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4 mr-2" />
              Запустить диагностику
            </>
          )}
        </Button>

        {diagnostics.length > 0 && (
          <div className="space-y-3">
            {diagnostics.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{result.name}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.message}
                  </p>
                  {result.details && (
                    <p className="text-xs text-muted-foreground mt-1 opacity-75">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {availableCameras.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Обнаруженные камеры:</h4>
            <ul className="space-y-1">
              {availableCameras.map((camera, index) => (
                <li key={camera.deviceId} className="text-xs text-muted-foreground">
                  {index + 1}. {camera.label || `Камера ${index + 1}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Если доступ запрещен, нажмите на иконку камеры в адресной строке
          </p>
          <p className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Для продакшена требуется HTTPS соединение
          </p>
        </div>
      </CardContent>
    </Card>
  );
}