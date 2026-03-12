import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, Loader2, AlertCircle, CheckCircle, Smartphone } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { toast } from "sonner";
import { NativeBarcodeScanner } from "./NativeBarcodeScanner";

interface MobileBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function MobileBarcodeScanner({ onScan, onError, className }: MobileBarcodeScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setLastResult(null);

    try {
      // Создаем URL для изображения
      const imageUrl = URL.createObjectURL(file);
      
      // Создаем изображение
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Инициализируем сканер
      const codeReader = new BrowserMultiFormatReader();
      
      // Сканируем изображение
      const result = await codeReader.decodeFromImageElement(img);
      
      if (result) {
        const barcode = result.getText().trim();
        if (barcode) {
          setLastResult(barcode);
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

      // Очищаем URL
      URL.revokeObjectURL(imageUrl);
      
    } catch (error: any) {
      console.error("Ошибка сканирования:", error);
      
      let errorMessage = "Не удалось отсканировать штрихкод";
      
      if (error.message?.includes("не найден")) {
        errorMessage = "Штрихкод не найден на изображении. Попробуйте сделать фото четче.";
      } else if (error.message?.includes("формат")) {
        errorMessage = "Неподдерживаемый формат штрихкода.";
      }
      
      toast.error("Ошибка сканирования", {
        description: errorMessage,
      });
      
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
    <Card className={className}>
      <CardContent className="p-4">
        <Tabs defaultValue="native" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="native" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Нативный
            </TabsTrigger>
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Фото
            </TabsTrigger>
          </TabsList>

          {/* Нативное сканирование */}
          <TabsContent value="native" className="mt-4">
            <NativeBarcodeScanner 
              onScan={onScan}
              onError={onError}
            />
          </TabsContent>

          {/* Сканирование по фото */}
          <TabsContent value="photo" className="mt-4 space-y-4">
            {/* Скрытый input для файлов */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Основная кнопка */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h3 className="font-semibold">Сканирование по фото</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Сделайте фото штрихкода для распознавания
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
                    Сделать фото
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

            {/* Альтернативный способ */}
            <div className="border-t pt-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isProcessing}
              >
                <Upload className="w-4 h-4 mr-2" />
                Выбрать из галереи
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
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}