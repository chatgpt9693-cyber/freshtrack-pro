import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, CameraOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CameraPermissionDialog } from "./CameraPermissionDialog";
import { MobileBarcodeScanner } from "./MobileBarcodeScanner";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function BarcodeScanner({ onScan, onError, className }: BarcodeScannerProps) {
  // Определяем мобильное устройство
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Для мобильных устройств используем специальный компонент
  if (isMobile) {
    return (
      <MobileBarcodeScanner 
        onScan={onScan}
        onError={onError}
        className={className}
      />
    );
  }

  // Для десктопа - обычный веб-камера сканер
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Инициализируем сканер
    readerRef.current = new BrowserMultiFormatReader();
    
    // Проверяем HTTPS для продакшена
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      setError("Для доступа к камере требуется HTTPS соединение. Используйте безопасное соединение.");
      setHasPermission(false);
    }
    
    return () => {
      stopScanning();
    };
  }, []);

  const requestCameraAccess = () => {
    setShowPermissionDialog(true);
  };

  const handlePermissionAllow = () => {
    actuallyStartScanning();
  };

  const handlePermissionDeny = () => {
    setError("Доступ к камере отклонен пользователем");
    setHasPermission(false);
    onError?.("Доступ к камере отклонен пользователем");
  };

  const actuallyStartScanning = async () => {
    if (!videoRef.current || !readerRef.current) return;

    try {
      setError(null);
      setIsScanning(true);

      // Проверяем поддержку MediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API не поддерживается в этом браузере");
      }

      // Специальные настройки для мобильных устройств
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      let constraints;
      
      if (isMobile) {
        // Для мобильных - приоритет задней камере и меньшее разрешение
        constraints = {
          video: {
            facingMode: { exact: "environment" }, // Строго задняя камера
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
          },
        };
      } else {
        // Для десктопа - стандартные настройки
        constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
          },
        };
      }

      let stream: MediaStream;
      
      try {
        // Первая попытка с оптимальными настройками
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstError: any) {
        console.warn("Первая попытка неудачна:", firstError);
        
        if (isMobile) {
          // Для мобильных - пробуем любую камеру
          try {
            constraints = {
              video: {
                facingMode: "environment", // Без exact
                width: { ideal: 640 },
                height: { ideal: 480 },
              },
            };
            stream = await navigator.mediaDevices.getUserMedia(constraints);
          } catch (secondError: any) {
            console.warn("Вторая попытка неудачна:", secondError);
            // Последняя попытка - любая камера
            stream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: "environment" } 
            });
          }
        } else {
          // Для десктопа - базовые настройки
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } catch (secondError: any) {
            console.warn("Не удалось получить камеру с базовыми настройками:", secondError);
            throw secondError;
          }
        }
      }

      streamRef.current = stream;
      setHasPermission(true);

      // Подключаем поток к видео элементу
      videoRef.current.srcObject = stream;
      
      // Для мобильных устройств - дополнительные настройки
      if (isMobile) {
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
      }
      
      // Ждем загрузки метаданных
      await new Promise((resolve, reject) => {
        if (!videoRef.current) return reject(new Error("Video element not found"));
        
        const timeoutId = setTimeout(() => {
          reject(new Error("Timeout loading video"));
        }, 15000); // Увеличиваем таймаут для мобильных
        
        videoRef.current.onloadedmetadata = () => {
          clearTimeout(timeoutId);
          resolve(undefined);
        };
        videoRef.current.onerror = (err) => {
          clearTimeout(timeoutId);
          reject(err);
        };
      });

      await videoRef.current.play();

      // Начинаем сканирование
      readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText().trim();
            if (barcode) {
              // Вибрация на мобильных при успешном сканировании
              if (isMobile && 'vibrate' in navigator) {
                navigator.vibrate(200);
              }
              onScan(barcode);
            }
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.warn("Ошибка сканирования:", error);
          }
        }
      );
    } catch (err: any) {
      console.error("Ошибка доступа к камере:", err);
      let errorMessage = "Не удалось получить доступ к камере";
      
      if (err.name === "NotAllowedError") {
        errorMessage = "Доступ к камере запрещен. Разрешите доступ в настройках браузера или нажмите 'Разрешить' во всплывающем окне.";
        setHasPermission(false);
      } else if (err.name === "NotFoundError") {
        errorMessage = "Камера не найдена. Убедитесь, что на устройстве есть камера.";
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Камера не поддерживается. Попробуйте обновить браузер.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Камера занята другим приложением. Закройте другие приложения и попробуйте снова.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Камера не поддерживает требуемые параметры. Попробуйте другую камеру.";
      } else if (err.message?.includes("MediaDevices API")) {
        errorMessage = "Ваш браузер не поддерживает доступ к камере. Используйте Chrome, Firefox или Safari.";
      } else if (err.message?.includes("HTTPS")) {
        errorMessage = "Для доступа к камере требуется HTTPS соединение.";
      }
      
      setError(errorMessage);
      setIsScanning(false);
      onError?.(errorMessage);
    }
  };

  const stopScanning = () => {
    try {
      // Останавливаем сканер
      if (readerRef.current) {
        readerRef.current.reset();
      }

      // Останавливаем видео поток
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Очищаем видео элемент
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsScanning(false);
    } catch (err) {
      console.error("Ошибка при остановке сканирования:", err);
    }
  };

  const toggleScanning = () => {
    if (isScanning) {
      stopScanning();
    } else {
      // Показываем диалог разрешений вместо прямого запуска
      requestCameraAccess();
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="relative">
          {/* Видео элемент */}
          <video
            ref={videoRef}
            className={cn(
              "w-full aspect-video bg-black object-cover",
              !isScanning && "hidden"
            )}
            playsInline
            webkit-playsinline="true"
            muted
            autoPlay
          />

          {/* Плейсхолдер когда камера не активна */}
          {!isScanning && (
            <div className="w-full aspect-video bg-muted flex items-center justify-center">
              <div className="text-center space-y-3">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Нажмите кнопку для запуска сканера
                </p>
              </div>
            </div>
          )}

          {/* Оверлей с рамкой сканирования */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Затемнение по краям */}
              <div className="absolute inset-0 bg-black/30" />
              
              {/* Рамка сканирования */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 border-2 border-primary rounded-lg bg-transparent">
                {/* Углы рамки */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg" />
                
                {/* Анимированная линия сканирования */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-primary animate-pulse" 
                     style={{ 
                       animation: "scan 2s ease-in-out infinite",
                     }} 
                />
              </div>
              
              {/* Подсказка */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm">
                Наведите камеру на штрихкод
              </div>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="absolute inset-0 bg-red-50 flex items-center justify-center p-4">
              <div className="text-center space-y-3 max-w-sm">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-800">Ошибка доступа к камере</p>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
                {hasPermission === false && (
                  <div className="space-y-2">
                    <div className="p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
                      <p className="font-medium">Как разрешить доступ:</p>
                      <p>1. Нажмите на иконку 🔒 или 📷 в адресной строке</p>
                      <p>2. Выберите "Разрешить" для камеры</p>
                      <p>3. Обновите страницу</p>
                    </div>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Обновить страницу
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Кнопки управления */}
        <div className="p-4 border-t">
          <Button
            onClick={toggleScanning}
            className="w-full"
            variant={isScanning ? "destructive" : "default"}
            disabled={hasPermission === false}
          >
            {isScanning ? (
              <>
                <CameraOff className="w-4 h-4 mr-2" />
                Остановить сканирование
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Запустить сканер
              </>
            )}
          </Button>
        </div>
      </CardContent>

      {/* Диалог разрешений */}
      <CameraPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />
    </Card>
  );
}

// CSS анимация для линии сканирования
const scanAnimation = `
@keyframes scan {
  0% { top: 0; }
  50% { top: calc(100% - 2px); }
  100% { top: 0; }
}
`;

// Добавляем стили в head
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = scanAnimation;
  document.head.appendChild(style);
}