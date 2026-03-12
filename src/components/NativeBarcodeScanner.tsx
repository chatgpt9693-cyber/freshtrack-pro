import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  QrCode, 
  ExternalLink, 
  Download,
  CheckCircle,
  AlertTriangle,
  Camera,
  Share
} from "lucide-react";
import { toast } from "sonner";

interface NativeBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
}

export function NativeBarcodeScanner({ onScan, onError }: NativeBarcodeScannerProps) {
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [supportsBarcodeDetection, setSupportsBarcodeDetection] = useState(false);
  const [supportsWebShare, setSupportsWebShare] = useState(false);

  useEffect(() => {
    // Определяем платформу
    const userAgent = navigator.userAgent;
    setIsAndroid(/Android/i.test(userAgent));
    setIsIOS(/iPhone|iPad|iPod/i.test(userAgent));

    // Проверяем поддержку Barcode Detection API
    setSupportsBarcodeDetection('BarcodeDetector' in window);

    // Проверяем поддержку Web Share API
    setSupportsWebShare('share' in navigator);

    // Слушаем события из URL (для возврата из внешних приложений)
    const handleURLParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const scannedCode = urlParams.get('barcode') || urlParams.get('code') || urlParams.get('scan');
      
      if (scannedCode) {
        onScan(scannedCode);
        // Очищаем URL
        window.history.replaceState({}, document.title, window.location.pathname);
        toast.success("Штрихкод получен!", {
          description: `Код: ${scannedCode}`,
        });
      }
    };

    handleURLParams();
    window.addEventListener('focus', handleURLParams);
    
    return () => {
      window.removeEventListener('focus', handleURLParams);
    };
  }, [onScan]);

  // Нативный Barcode Detection API (Chrome Android)
  const useNativeBarcodeDetection = async () => {
    try {
      if (!('BarcodeDetector' in window)) {
        throw new Error('Barcode Detection API не поддерживается');
      }

      // @ts-ignore - экспериментальный API
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'qr_code']
      });

      // Запрашиваем доступ к камере
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });

      // Создаем видео элемент
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Ждем загрузки видео
      await new Promise(resolve => video.onloadedmetadata = resolve);

      // Создаем canvas для захвата кадров
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Функция сканирования
      const scanFrame = async () => {
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
          const barcodes = await barcodeDetector.detect(imageData);
          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue;
            stream.getTracks().forEach(track => track.stop());
            onScan(barcode);
            return;
          }
        } catch (err) {
          console.warn('Ошибка детекции:', err);
        }

        // Повторяем через 100мс
        setTimeout(scanFrame, 100);
      };

      scanFrame();

    } catch (error: any) {
      console.error('Ошибка нативного сканирования:', error);
      onError?.(error.message || 'Не удалось запустить нативное сканирование');
    }
  };

  // Открытие внешнего приложения сканера (Android)
  const openExternalScanner = () => {
    if (isAndroid) {
      // Пробуем разные популярные сканеры
      const scannerApps = [
        // ZXing Barcode Scanner
        'com.google.zxing.client.android.SCAN',
        // Google Lens
        'com.google.ar.lens',
        // Samsung Camera
        'com.sec.android.app.camera'
      ];

      const currentUrl = window.location.origin + window.location.pathname;
      
      // Создаем intent URL для сканирования
      const intentUrl = `intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;S.browser_fallback_url=${encodeURIComponent(currentUrl + '?install_scanner=1')};end`;
      
      try {
        window.location.href = intentUrl;
      } catch (error) {
        // Fallback - открываем Play Store
        window.open('https://play.google.com/store/apps/details?id=com.google.zxing.client.android', '_blank');
      }
    } else if (isIOS) {
      // Для iOS используем схему URL
      const currentUrl = encodeURIComponent(window.location.href);
      const scannerUrl = `shortcuts://run-shortcut?name=QR%20Scanner&input=${currentUrl}`;
      
      try {
        window.location.href = scannerUrl;
      } catch (error) {
        // Fallback - App Store
        window.open('https://apps.apple.com/app/qr-reader-for-iphone/id368494609', '_blank');
      }
    }
  };

  // Установка PWA для лучшей интеграции
  const installPWA = () => {
    toast.info("Установите приложение", {
      description: "Добавьте сайт на главный экран для лучшей работы со сканером",
      duration: 5000,
    });
  };

  // Web Share API для получения данных
  const shareForScanning = async () => {
    if (supportsWebShare) {
      try {
        await navigator.share({
          title: 'Сканирование штрихкода',
          text: 'Отсканируйте штрихкод и поделитесь результатом',
          url: window.location.href
        });
      } catch (error) {
        console.log('Пользователь отменил шаринг');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Нативные возможности */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="w-5 h-5" />
            Нативное сканирование
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Barcode Detection API */}
          {supportsBarcodeDetection && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Встроенный сканер браузера</p>
                  <p className="text-xs text-muted-foreground">Использует нативный API Chrome</p>
                </div>
              </div>
              <Button onClick={useNativeBarcodeDetection} size="sm">
                <Camera className="w-4 h-4 mr-1" />
                Сканировать
              </Button>
            </div>
          )}

          {/* Внешние приложения */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">
                  {isAndroid ? 'Google Lens / ZXing Scanner' : 'Встроенная камера iOS'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Откроет внешнее приложение для сканирования
                </p>
              </div>
            </div>
            <Button onClick={openExternalScanner} size="sm" variant="outline">
              <ExternalLink className="w-4 h-4 mr-1" />
              Открыть
            </Button>
          </div>

          {/* Web Share */}
          {supportsWebShare && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Share className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Поделиться для сканирования</p>
                  <p className="text-xs text-muted-foreground">Используйте другие приложения</p>
                </div>
              </div>
              <Button onClick={shareForScanning} size="sm" variant="outline">
                <Share className="w-4 h-4 mr-1" />
                Поделиться
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Статус поддержки */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Поддержка устройства</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Платформа:</span>
            <Badge variant={isAndroid || isIOS ? "default" : "secondary"}>
              {isAndroid ? 'Android' : isIOS ? 'iOS' : 'Другая'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Нативный API:</span>
            <Badge variant={supportsBarcodeDetection ? "default" : "secondary"}>
              {supportsBarcodeDetection ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Поддерживается</>
              ) : (
                <><AlertTriangle className="w-3 h-3 mr-1" /> Не поддерживается</>
              )}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Web Share:</span>
            <Badge variant={supportsWebShare ? "default" : "secondary"}>
              {supportsWebShare ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Доступен</>
              ) : (
                <><AlertTriangle className="w-3 h-3 mr-1" /> Недоступен</>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Инструкции */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-sm mb-2 text-blue-900">💡 Как это работает:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>Встроенный сканер:</strong> Использует камеру прямо в браузере</li>
            <li>• <strong>Внешние приложения:</strong> Открывает Google Lens или другие сканеры</li>
            <li>• <strong>Результат:</strong> Автоматически возвращается в приложение</li>
            <li>• <strong>PWA:</strong> Установите как приложение для лучшей работы</li>
          </ul>
          
          <Button 
            onClick={installPWA} 
            size="sm" 
            variant="outline" 
            className="mt-3 w-full border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Download className="w-4 h-4 mr-1" />
            Установить как приложение
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}