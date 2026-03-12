import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Camera, 
  RefreshCw,
  HelpCircle 
} from "lucide-react";

type PermissionState = "prompt" | "granted" | "denied" | "unknown";

interface CameraPermissionStatusProps {
  onRequestPermission?: () => void;
  className?: string;
}

export function CameraPermissionStatus({ 
  onRequestPermission, 
  className 
}: CameraPermissionStatusProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [isChecking, setIsChecking] = useState(false);

  const checkPermission = async () => {
    setIsChecking(true);
    
    try {
      if (!navigator.permissions || !navigator.permissions.query) {
        // Fallback для браузеров без Permissions API
        setPermissionState("unknown");
        return;
      }

      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setPermissionState(permission.state as PermissionState);

      // Слушаем изменения разрешений
      permission.onchange = () => {
        setPermissionState(permission.state as PermissionState);
      };
    } catch (error) {
      console.warn("Не удалось проверить разрешения камеры:", error);
      setPermissionState("unknown");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  const getStatusConfig = () => {
    switch (permissionState) {
      case "granted":
        return {
          icon: CheckCircle,
          label: "Разрешено",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 border-green-200",
          description: "Камера доступна для сканирования"
        };
      case "denied":
        return {
          icon: XCircle,
          label: "Запрещено",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 border-red-200",
          description: "Доступ к камере заблокирован"
        };
      case "prompt":
        return {
          icon: HelpCircle,
          label: "Требуется разрешение",
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
          description: "Нужно запросить доступ к камере"
        };
      default:
        return {
          icon: AlertTriangle,
          label: "Неизвестно",
          variant: "outline" as const,
          className: "bg-gray-100 text-gray-800 border-gray-200",
          description: "Статус разрешений неизвестен"
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const handleRequestPermission = () => {
    onRequestPermission?.();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isChecking) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Проверка...
        </Badge>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Badge className={config.className}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {config.description}
        </span>
      </div>

      {/* Действия в зависимости от статуса */}
      {permissionState === "prompt" && (
        <Button
          onClick={handleRequestPermission}
          size="sm"
          className="h-8 text-xs"
        >
          <Camera className="w-3 h-3 mr-1" />
          Запросить доступ
        </Button>
      )}

      {permissionState === "denied" && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Разрешите доступ к камере в настройках браузера
          </p>
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            className="h-8 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Обновить страницу
          </Button>
        </div>
      )}

      {permissionState === "unknown" && (
        <Button
          onClick={handleRequestPermission}
          size="sm"
          variant="outline"
          className="h-8 text-xs"
        >
          <Camera className="w-3 h-3 mr-1" />
          Попробовать запустить камеру
        </Button>
      )}
    </div>
  );
}