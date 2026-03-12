import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarcodeScanner } from "./BarcodeScanner";
import { ScannerInfo } from "./ScannerInfo";
import { CameraPermissionStatus } from "./CameraPermissionStatus";
import { ScanBarcode, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BarcodeScannerDialogProps {
  onScan: (barcode: string) => void;
  trigger?: React.ReactNode;
  title?: string;
}

export function BarcodeScannerDialog({ 
  onScan, 
  trigger, 
  title = "Сканирование штрихкода" 
}: BarcodeScannerDialogProps) {
  const [open, setOpen] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const handleScan = (barcode: string) => {
    // Избегаем дублирования при быстром сканировании
    if (lastScanned === barcode) return;
    
    setLastScanned(barcode);
    
    toast.success("Штрихкод отсканирован", {
      description: `Код: ${barcode}`,
      duration: 2000,
    });
    
    onScan(barcode);
    setOpen(false);
    
    // Сбрасываем последний отсканированный код через некоторое время
    setTimeout(() => setLastScanned(null), 3000);
  };

  const handleError = (error: string) => {
    toast.error("Ошибка сканирования", {
      description: error,
    });
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <ScanBarcode className="w-4 h-4" />
      Сканировать
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          <Tabs defaultValue="scanner" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scanner" className="flex items-center gap-2">
                <ScanBarcode className="w-4 h-4" />
                Сканер
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Справка
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="scanner" className="space-y-4 mt-4">
              {/* Статус разрешений */}
              <CameraPermissionStatus className="mb-4" />
              
              <BarcodeScanner 
                onScan={handleScan}
                onError={handleError}
              />
              
              {lastScanned && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Отсканирован: <code className="font-mono">{lastScanned}</code>
                  </span>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="info" className="mt-4">
              <ScannerInfo />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}