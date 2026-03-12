import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { products, batches } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { ScanBarcode, Search } from "lucide-react";
import { format } from "date-fns";

export default function Scanner() {
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<typeof products[0] | null>(null);

  const handleSearch = () => {
    const found = products.find((p) => p.barcode === barcode);
    setResult(found || null);
  };

  const productBatches = result ? batches.filter((b) => b.productId === result.id) : [];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ScanBarcode className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Сканер</h1>
        <p className="text-muted-foreground text-sm mt-1">Введите или отсканируйте штрихкод</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Штрихкод (напр. 4600000000001)"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="font-mono text-lg h-12"
        />
        <Button onClick={handleSearch} size="lg" className="h-12 px-6">
          <Search className="w-5 h-5" />
        </Button>
      </div>

      {barcode && !result && (
        <Card className="border-status-hurry/30">
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">Продукт не найден. Можно добавить новый.</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <h2 className="text-lg font-bold">{result.name}</h2>
              <p className="text-xs text-muted-foreground font-mono">{result.barcode}</p>
              <p className="text-sm text-muted-foreground mt-1">{result.category} · {result.supplier}</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm font-medium mb-2">Партии ({productBatches.length})</p>
              {productBatches.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <StatusBadge status={b.currentStatus} size="sm" />
                    <span className="text-xs text-muted-foreground ml-2">#{b.batchNumber}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    до {format(b.expirationDate, "dd.MM.yyyy")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
