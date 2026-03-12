import { products, batches, calculateStatus } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

export default function Products() {
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Продукты</h1>
          <p className="text-muted-foreground text-sm mt-1">Справочник товаров ({products.length})</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию, штрихкоду..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((product) => {
          const productBatches = batches.filter((b) => b.productId === product.id);
          const activeBatches = productBatches.filter((b) => b.currentStatus === "active").length;
          const totalQty = productBatches.reduce((s, b) => s + b.quantity, 0);

          return (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{product.barcode}</p>
                  </div>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    {product.category}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold font-mono">{productBatches.length}</p>
                    <p className="text-xs text-muted-foreground">Партий</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-mono">{totalQty}</p>
                    <p className="text-xs text-muted-foreground">Кол-во</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-mono">{product.shelfLifeDays}</p>
                    <p className="text-xs text-muted-foreground">Дн. хран.</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    📍 {product.defaultLocation} · {product.supplier}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
