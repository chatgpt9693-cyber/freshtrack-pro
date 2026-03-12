import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Camera, Shield, AlertTriangle, CheckCircle, Smartphone } from "lucide-react";
import { MobileCameraInstructions } from "./MobileCameraInstructions";

interface CameraPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => void;
  onDeny: () => void;
}

export function CameraPermissionDialog({
  open,
  onOpenChange,
  onAllow,
  onDeny,
}: CameraPermissionDialogProps) {
  const [step, setStep] = useState<"request" | "instructions">("request");
  
  // Определяем мобильное устройство
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleAllow = () => {
    setStep("instructions");
  };

  const handleProceed = () => {
    onAllow();
    onOpenChange(false);
    setStep("request"); // Сбрасываем для следующего раза
  };

  const handleDeny = () => {
    onDeny();
    onOpenChange(false);
    setStep("request"); // Сбрасываем для следующего раза
  };

  const handleCancel = () => {
    onOpenChange(false);
    setStep("request"); // Сбрасываем для следующего раза
  };

  if (step === "instructions") {
    // Для мобильных показываем специальные инструкции
    if (isMobile) {
      return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
          <AlertDialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
            <AlertDialogHeader className="flex-shrink-0">
              <AlertDialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                Настройка камеры на мобильном
              </AlertDialogTitle>
            </AlertDialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-4 px-1">
              <MobileCameraInstructions />
            </div>

            <AlertDialogFooter className="flex-shrink-0">
              <AlertDialogCancel onClick={handleCancel}>
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleProceed} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Готово, запросить доступ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    // Для десктопа - обычные инструкции
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
          <AlertDialogHeader className="flex-shrink-0">
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Как разрешить доступ к камере
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          <AlertDialogDescription asChild className="flex-1 overflow-y-auto px-1">
            <div className="space-y-4">
              <p>
                Сейчас браузер покажет запрос на доступ к камере. 
                Следуйте инструкциям ниже:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Найдите всплывающее окно</p>
                    <p className="text-sm text-blue-700">
                      Браузер покажет запрос в верхней части страницы или в отдельном окне
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Нажмите "Разрешить"</p>
                    <p className="text-sm text-green-700">
                      Выберите "Разрешить" или "Allow" в запросе браузера
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Если запрос не появился</p>
                    <p className="text-sm text-amber-700">
                      Нажмите на иконку камеры 📷 или замка 🔒 в адресной строке и разрешите доступ
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Мы используем камеру только для сканирования штрихкодов. 
                  Изображения не сохраняются и не передаются на сервер.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
          
          <AlertDialogFooter className="flex-shrink-0">
            <AlertDialogCancel onClick={handleCancel}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleProceed} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Понятно, запросить доступ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[450px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Разрешить доступ к камере?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Для сканирования штрихкодов нужен доступ к камере вашего устройства.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Что мы будем делать:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    Сканировать штрихкоды и QR-коды
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    Обрабатывать изображения локально
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Что мы НЕ будем делать:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Сохранять или записывать видео
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Передавать изображения на сервер
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Использовать камеру без вашего ведома
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-muted/50 border border-border rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Вы можете отозвать разрешение в любое время через настройки браузера
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleDeny} className="w-full sm:w-auto">
            Не разрешать
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleAllow}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            <Camera className="w-4 h-4 mr-2" />
            Разрешить доступ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}