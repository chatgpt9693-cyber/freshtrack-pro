import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Camera, Smartphone } from "lucide-react";

export function ScannerInfo() {
  const supportedFormats = [
    { name: "EAN-13", description: "Европейский стандарт (13 цифр)" },
    { name: "EAN-8", description: "Короткий европейский код (8 цифр)" },
    { name: "UPC-A", description: "Американский стандарт (12 цифр)" },
    { name: "Code 128", description: "Универсальный линейный код" },
    { name: "Code 39", description: "Алфавитно-цифровой код" },
    { name: "QR Code", description: "Двумерный код" },
  ];

  const tips = [
    "Держите камеру ровно над штрихкодом",
    "Убедитесь, что штрихкод хорошо освещен",
    "Избегайте бликов и теней на поверхности кода",
    "Штрихкод должен занимать большую часть кадра",
    "Дождитесь четкого изображения перед съемкой",
  ];

  return (
    <div className="space-y-4">

      {/* Поддерживаемые форматы */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            Поддерживаемые форматы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {supportedFormats.map((format) => (
              <div key={format.name} className="space-y-1">
                <Badge variant="secondary" className="text-xs">
                  {format.name}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {format.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Советы по сканированию */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Советы по сканированию
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Системные требования */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Системные требования
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Современный браузер с поддержкой File API</p>
            <p>• Камера на устройстве для съемки фото</p>
            <p>• Хорошее освещение для четких снимков</p>
            <p>• Поддержка форматов изображений: JPG, PNG, WebP</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}