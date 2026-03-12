import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Package, Loader2, PackageX } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useProducts } from "@/lib/queries";
import { useBatches } from "@/lib/queries";

export default function Products() {
  const [search, setSearch] = useState("");

  const { data: products = [], isLoading } = useProducts(
    search ? { search } : undefined
  );

  // Загружаем все партии одним запросом для подсчёта статистики по продуктам
  const { data: batchesData } = useBatches({}, 0, 500);
  const allBatches = batchesData?.data ?? [];

  return (
    <div className="p-4 md:p-8 space-y-6 gradient-mesh min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Продукты</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Справочник
            {!isLoading && <span> · {products.length} товаров</span>}
          </p>
        </motion.div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию, штрихкоду..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-card"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <PackageX className="w-12 h-12 opacity-30" />
          <p className="text-sm">Товары не найдены</p>
        </div>
      ) : (
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.04 } },
          }}
        >
          {products.map((product) => {
            const productBatches = allBatches.filter(
              (b) => b.product_id === product.id
            );
            const totalQty = productBatches.reduce(
              (sum, b) => sum + b.quantity, 0
            );

            return (
              <motion.div
                key={product.id}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              >
                <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default group overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[15px] truncate">{product.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-1">
                          {product.barcode}
                        </p>
                      </div>
                      {product.category && (
                        <span className="text-[11px] bg-accent text-accent-foreground px-2.5 py-1 rounded-lg font-medium whitespace-nowrap shrink-0">
                          {product.category}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-1">
                      {[
                        { v: productBatches.length, l: "партий"  },
                        { v: totalQty,              l: "шт."     },
                        { v: product.shelf_life_days, l: "дн."   },
                      ].map(({ v, l }) => (
                        <div key={l} className="flex-1 text-center py-2.5 rounded-lg bg-muted/60">
                          <p className="text-lg font-bold font-mono leading-none">{v}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                            {l}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Package className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {product.default_location ?? '—'} · {product.supplier ?? '—'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
