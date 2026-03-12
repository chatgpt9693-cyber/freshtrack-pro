import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Loader2, CheckCircle } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function BarcodeScanner({ onScan, onError, className }: BarcodeScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [debugImage, setDebugImage] = useState<string | null>(null);

  // Определяем мобильное устройство
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleCameraCapture = () => {
    console.log("Открываем камеру, мобильное устройство:", isMobile);
    setDebugImage(null); // Сбрасываем отладочное изображение
    fileInputRef.current?.click();
  };

  const handleGallerySelect = () => {
    console.log("Открываем галерею");
    setDebugImage(null); // Сбрасываем отладочное изображение
    galleryInputRef.current?.click();
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setLastResult(null);

    let imageUrl: string | null = null;

    try {
      console.log("Начинаем обработку изображения:", file.name, file.size, file.type);
      
      // Создаем URL для изображения
      imageUrl = URL.createObjectURL(file);
      
      // Создаем изображение
      const img = new Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          console.log("Изображение загружено:", img.width, "x", img.height);
          resolve();
        };
        img.onerror = (e) => {
          console.error("Ошибка загрузки изображения:", e);
          reject(new Error("Не удалось загрузить изображение"));
        };
        img.crossOrigin = "anonymous"; // Для обработки изображений
        img.src = imageUrl!;
      });

      // Создаем canvas для предварительной обработки изображения
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Не удалось создать контекст canvas");
      }

      // Для мобильных устройств используем другой подход к размерам
      let targetWidth = img.width;
      let targetHeight = img.height;
      
      if (isMobile) {
        // На мобильных ограничиваем размер для лучшей производительности
        const maxSize = 1200;
        if (img.width > maxSize || img.height > maxSize) {
          const ratio = Math.min(maxSize / img.width, maxSize / img.height);
          targetWidth = Math.floor(img.width * ratio);
          targetHeight = Math.floor(img.height * ratio);
        }
      }

      // Устанавливаем размеры canvas
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Рисуем изображение на canvas с масштабированием
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Применяем более агрессивные фильтры для мобильных
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      if (isMobile) {
        // Для мобильных: более сильная обработка
        // 1. Увеличиваем контрастность
        const contrast = 2.0;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        // 2. Применяем пороговую обработку для четкости
        for (let i = 0; i < data.length; i += 4) {
          // Конвертируем в оттенки серого
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          // Применяем контрастность
          const enhanced = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
          
          // Пороговая обработка для четких черно-белых линий
          const threshold = enhanced > 128 ? 255 : 0;
          
          data[i] = threshold;     // Red
          data[i + 1] = threshold; // Green
          data[i + 2] = threshold; // Blue
          // Alpha остается без изменений
        }
        
        console.log("Применена агрессивная обработка для мобильного устройства");
      } else {
        // Для десктопа: мягкая обработка
        const contrast = 1.5;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // Red
          data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // Green
          data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // Blue
        }
        
        console.log("Применена стандартная обработка для десктопа");
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Сохраняем обработанное изображение для отладки
      const debugDataUrl = canvas.toDataURL('image/png');
      setDebugImage(debugDataUrl);
      
      console.log("Изображение обработано, размер:", targetWidth, "x", targetHeight);

      // Инициализируем сканер с дополнительными настройками
      const codeReader = new BrowserMultiFormatReader();
      
      console.log("Сканер инициализирован, начинаем распознавание...");
      
      // Пробуем разные подходы к сканированию
      let result = null;
      
      if (isMobile) {
        // Для мобильных: множественные попытки с разными настройками
        console.log("Мобильное устройство: пробуем разные методы сканирования");
        
        try {
          // 1. Пробуем обработанное изображение
          const processedImg = new Image();
          const canvasDataUrl = canvas.toDataURL('image/png');
          
          await new Promise<void>((resolve, reject) => {
            processedImg.onload = () => resolve();
            processedImg.onerror = reject;
            processedImg.src = canvasDataUrl;
          });
          
          result = await codeReader.decodeFromImageElement(processedImg);
          console.log("Штрихкод найден на обработанном изображении (мобильный)");
        } catch (processedError) {
          console.log("Обработанное изображение не сработало, пробуем оригинал");
          
          try {
            // 2. Пробуем оригинальное изображение
            result = await codeReader.decodeFromImageElement(img);
            console.log("Штрихкод найден на оригинальном изображении (мобильный)");
          } catch (originalError) {
            console.log("Оригинал не сработал, пробуем с поворотом");
            
            // 3. Пробуем повернутое изображение (для случаев неправильной ориентации)
            const rotatedCanvas = document.createElement('canvas');
            const rotatedCtx = rotatedCanvas.getContext('2d');
            
            if (rotatedCtx) {
              rotatedCanvas.width = img.height;
              rotatedCanvas.height = img.width;
              
              rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
              rotatedCtx.rotate(Math.PI / 2);
              rotatedCtx.drawImage(img, -img.width / 2, -img.height / 2);
              
              const rotatedImg = new Image();
              const rotatedDataUrl = rotatedCanvas.toDataURL('image/png');
              
              await new Promise<void>((resolve, reject) => {
                rotatedImg.onload = () => resolve();
                rotatedImg.onerror = reject;
                rotatedImg.src = rotatedDataUrl;
              });
              
              try {
                result = await codeReader.decodeFromImageElement(rotatedImg);
                console.log("Штрихкод найден на повернутом изображении");
              } catch (rotatedError) {
                throw new Error("Штрихкод не найден ни одним из методов");
              }
            } else {
              throw new Error("Не удалось создать canvas для поворота");
            }
          }
        }
      } else {
        // Для десктопа: стандартный подход
        try {
          // Создаем новое изображение из canvas
          const processedImg = new Image();
          const canvasDataUrl = canvas.toDataURL('image/png');
          
          await new Promise<void>((resolve, reject) => {
            processedImg.onload = () => resolve();
            processedImg.onerror = reject;
            processedImg.src = canvasDataUrl;
          });
          
          // Сначала пробуем canvas с улучшенным контрастом
          result = await codeReader.decodeFromImageElement(processedImg);
          console.log("Штрихкод найден на обработанном изображении");
        } catch (canvasError) {
          console.log("Не удалось найти на обработанном изображении, пробуем оригинал");
          // Если не получилось, пробуем оригинальное изображение
          result = await codeReader.decodeFromImageElement(img);
          console.log("Штрихкод найден на оригинальном изображении");
        }
      }
      console.log("Результат сканирования:", result);
      
      if (result) {
        const barcode = result.getText().trim();
        console.log("Найден штрихкод:", barcode);
        
        if (barcode) {
          setLastResult(barcode);
          
          console.log("Вызываем onScan с кодом:", barcode);
          onScan(barcode);
          
          // Вибрация при успешном сканировании
          if ('vibrate' in navigator) {
            navigator.vibrate(200);
          }
          
          toast.success("Штрихкод найден!", {
            description: `Код: ${barcode}`,
          });
        } else {
          throw new Error("Пустой результат сканирования");
        }
      } else {
        throw new Error("Штрихкод не найден на изображении");
      }
      
    } catch (error: any) {
      console.error("Ошибка сканирования:", error);
      console.error("Тип ошибки:", error.constructor.name);
      console.error("Сообщение ошибки:", error.message);
      
      let errorMessage = "Не удалось отсканировать штрихкод";
      
      if (error.message?.includes("не найден") || error.name === "NotFoundException") {
        errorMessage = "Штрихкод не найден на изображении. Попробуйте сделать фото четче и убедитесь, что штрихкод хорошо виден.";
      } else if (error.message?.includes("формат")) {
        errorMessage = "Неподдерживаемый формат штрихкода.";
      } else if (error.message?.includes("загрузить")) {
        errorMessage = "Не удалось загрузить изображение. Попробуйте другое фото.";
      } else if (error.name === "ChecksumException") {
        errorMessage = "Штрихкод поврежден или нечеткий. Попробуйте сделать более четкое фото.";
      } else if (error.name === "FormatException") {
        errorMessage = "Неверный формат штрихкода. Убедитесь, что это действительно штрихкод.";
      }
      
      toast.error("Ошибка сканирования", {
        description: errorMessage,
      });
      
      onError?.(errorMessage);
    } finally {
      // Очищаем URL
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("Выбран файл:", file?.name, file?.type, file?.size);
    
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        toast.error("Неверный тип файла", {
          description: "Выберите изображение (JPG, PNG, WebP)",
        });
        return;
      }
      
      // Проверяем размер файла (максимум 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Файл слишком большой", {
          description: "Максимальный размер: 10MB",
        });
        return;
      }
      
      processImage(file);
    }
    
    // Сбрасываем input для возможности выбора того же файла
    event.target.value = '';
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6 space-y-4">
        {/* Скрытый input для камеры */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment" // Предпочитаем заднюю камеру
          onChange={handleFileChange}
          className="hidden"
          multiple={false}
        />

        {/* Скрытый input для галереи */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          multiple={false}
        />

        {/* Основная кнопка */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">Сканирование штрихкода</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isMobile 
                ? "Сделайте фото штрихкода или выберите из галереи"
                : "Сделайте фото штрихкода для автоматического распознавания"
              }
            </p>
          </div>

          <Button
            onClick={handleCameraCapture}
            disabled={isProcessing}
            size="lg"
            className="w-full h-12"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Обработка изображения...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                {isMobile ? "Сделать фото" : "Открыть камеру"}
              </>
            )}
          </Button>
        </div>

        {/* Результат сканирования */}
        {lastResult && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Штрихкод найден:</p>
              <code className="text-xs font-mono text-green-700">{lastResult}</code>
            </div>
          </div>
        )}

        {/* Отладочное изображение (только для мобильных) */}
        {debugImage && isMobile && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-medium mb-2">Обработанное изображение:</p>
            <img 
              src={debugImage} 
              alt="Обработанное изображение" 
              className="w-full max-w-xs mx-auto border rounded"
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Так видит изображение сканер
            </p>
          </div>
        )}

        {/* Альтернативный способ */}
        <div className="border-t pt-4">
          <Button
            onClick={handleGallerySelect}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isProcessing}
          >
            <Upload className="w-4 h-4 mr-2" />
            Выбрать фото из галереи
          </Button>
        </div>

        {/* Советы */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs font-medium mb-2">💡 Советы для лучшего результата:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Держите камеру ровно над штрихкодом</li>
            <li>• Убедитесь, что штрихкод хорошо освещен</li>
            <li>• Избегайте бликов и теней</li>
            <li>• Штрихкод должен занимать большую часть кадра</li>
            <li>• Убедитесь, что изображение четкое (не размытое)</li>
            {isMobile && (
              <>
                <li>• На мобильном: держите телефон устойчиво</li>
                <li>• Попробуйте разные углы наклона</li>
                <li>• Используйте хорошее освещение</li>
              </>
            )}
          </ul>
        </div>

        {/* Поддерживаемые форматы */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs font-medium mb-2 text-blue-800">📋 Поддерживаемые форматы:</p>
          <div className="text-xs text-blue-700 grid grid-cols-2 gap-1">
            <span>• EAN-13, EAN-8</span>
            <span>• UPC-A, UPC-E</span>
            <span>• Code 128, Code 39</span>
            <span>• QR Code</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}