import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge } from "@/components/StatusBadge";
import { AddProductDialog } from "@/components/AddProductDialog";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";
import {
  ScanBarcode, Search, CalendarIcon, Plus, Check,
  Package, Loader2, PackageX,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useProductByBarcode, useBatchesByProduct, useCreateBatch } from "@/lib/queries";
import { getDaysLeft, getPercentLeft, calculateStatus } from "@/lib/date-utils";
import { useCategoryThresholds } from "@/lib/queries";

// Прогресс-цвета по статусу
const progressColors = {
  ACTIVE:      "bg-status-active",
  HURRY_UP:    "bg-status-hurry",
  URGENT_SALE: "bg-status-urgent",
  EXPIRED:     "bg-status-expired",
} as const;

export default function Scanner() {
  const [barcode, setBarcode]       = useState("");
  const [searchBarcode, setSearchBarcode] = useState<string | null>(null);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [expiryMode, setExpiryMode]     = useState<"date" | "days">("date");
  const [expiryDate, setExpiryDate]     = useState<Date | undefined>();
  const [shelfDays, setShelfDays]       = useState("");
  const [quantity, setQuantity]         = useState("");
  const [location, setLocation]         = useState("");
  const [batchNumber, setBatchNumber]   = useState("");

  // Поиск продукта по штрихкоду
  const {
    data: product,
    isLoading: productLoading,
    isFetched: productFetched,
  } = useProductByBarcode(searchBarcode);

  // Партии этого продукта
  const { data: productBatches = [] } = useBatchesByProduct(
    product?.id ?? null
  );

  // Пороги для предпросмотра статуса (с fallback значениями)
  const { data: thresholds, error: thresholdsError } = useCategoryThresholds();
  
  // Логируем ошибку доступа к настройкам
  if (thresholdsError) {
    console.warn("Не удалось загрузить настройки порогов:", thresholdsError);
  }
  
  // Значения по умолчанию, если нет доступа к настройкам
  const defaultThresholds = {
    hurry_up_percent: 30.0,
    hurry_up_days_min: 7,
    urgent_sale_percent: 10.0,
    urgent_sale_days_min: 3,
  };
  
  const effectiveThresholds = thresholds || defaultThresholds;

  // Мутация создания партии
  const createBatch = useCreateBatch();

  const handleSearch = () => {
    const trimmed = barcode.trim();
    if (!trimmed) return;
    setSearchBarcode(trimmed);
    setShowAddForm(false);
  };

  // Вычисляем дату истечения из режима ввода
  const computedExpiryDate =
    expiryMode === "date"
      ? expiryDate
      : shelfDays
      ? addDays(new Date(), parseInt(shelfDays))
      : undefined;

  // Статус предпросмотра для новой партии
  const previewStatus =
    computedExpiryDate && effectiveThresholds
      ? calculateStatus(
          format(computedExpiryDate, "yyyy-MM-dd"),
          format(new Date(), "yyyy-MM-dd"),
          effectiveThresholds
        )
      : null;

  const handleAddBatch = async () => {
    if (!product || !computedExpiryDate || !quantity) return;

    try {
      await createBatch.mutateAsync({
        product_id:               product.id,
        production_date:          format(new Date(), "yyyy-MM-dd"),
        expiration_date_effective: format(computedExpiryDate, "yyyy-MM-dd"),
        quantity:                 parseInt(quantity),
        location:                 location || product.default_location || null,
        batch_number:             batchNumber || null,
      });

      toast.success("Партия добавлена", {
        description: `${product.name} — годен до ${format(computedExpiryDate, "dd.MM.yyyy")}`,
      });

      // Сброс формы
      setShowAddForm(false);
      setExpiryDate(undefined);
      setShelfDays("");
      setQuantity("");
      setLocation("");
      setBatchNumber("");
    } catch (err) {
      toast.error("Ошибка при сохранении", {
        description: err instanceof Error ? err.message : "Попробуйте ещё раз",
      });
    }
  };

  const searched = searchBarcode !== null;
  const notFound = searched && !productLoading && !product;

  return (
    <div className="p-4 md:p-8 gradient-mesh min-h-screen">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Заголовок */}
        <motion.div
          className="text-center pt-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ScanBarcode className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Сканер</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Введите или отсканируйте штрихкод товара
          </p>
        </motion.div>

        {/* Строка поиска */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative flex-1">
            <ScanBarcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="4600000000001"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-12 h-14 text-lg font-mono rounded-2xl bg-card border-border shadow-sm focus:shadow-md transition-shadow"
            />
          </div>
          <BarcodeScannerDialog
            onScan={(scannedBarcode) => {
              setBarcode(scannedBarcode);
              setSearchBarcode(scannedBarcode);
              setShowAddForm(false);
            }}
            trigger={
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-4 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5"
              >
                <ScanBarcode className="w-5 h-5" />
              </Button>
            }
          />
          <Button
            onClick={handleSearch}
            size="lg"
            disabled={productLoading}
            className="h-14 px-6 rounded-2xl shadow-md shadow-primary/20"
          >
            {productLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Не найден */}
          {notFound && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="p-8 text-center">
                  <PackageX className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-medium">Продукт не найден</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Штрихкод <span className="font-mono">{searchBarcode}</span> не зарегистрирован
                  </p>
                  <AddProductDialog
                    initialBarcode={searchBarcode}
                    trigger={
                      <Button variant="outline" className="mt-4 rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Добавить товар
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Найден */}
          {product && (
            <motion.div
              key="found"
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Карточка продукта */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold">{product.name}</h2>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {product.barcode}
                      </p>
                    </div>
                    {product.category && (
                      <span className="text-[11px] bg-accent text-accent-foreground px-2.5 py-1 rounded-lg font-medium">
                        {product.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                    {product.default_location && <span>📍 {product.default_location}</span>}
                    {product.supplier && <span>🏭 {product.supplier}</span>}
                    <span>⏱ {product.shelf_life_days} дн. хранения</span>
                  </div>
                </CardContent>
              </Card>

              {/* Кнопка добавить партию */}
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="w-full h-12 rounded-xl shadow-md shadow-primary/20 text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить партию
                </Button>
              )}

              {/* Форма добавления партии */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card>
                      <CardContent className="p-5 space-y-4">
                        <p className="text-sm font-semibold">Новая партия</p>

                        {/* Номер партии */}
                        <div>
                          <Label className="text-sm">Номер партии (необязательно)</Label>
                          <Input
                            placeholder="Например: ML-2026-003"
                            value={batchNumber}
                            onChange={(e) => setBatchNumber(e.target.value)}
                            className="mt-1.5 h-11 rounded-xl font-mono"
                          />
                        </div>

                        {/* Срок годности */}
                        <div>
                          <Label className="text-sm">Срок годности</Label>
                          <Tabs
                            value={expiryMode}
                            onValueChange={(v) => setExpiryMode(v as "date" | "days")}
                            className="mt-2"
                          >
                            <TabsList className="w-full rounded-xl">
                              <TabsTrigger value="date"  className="flex-1 rounded-lg">
                                <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                                Дата
                              </TabsTrigger>
                              <TabsTrigger value="days" className="flex-1 rounded-lg">
                                Кол-во суток
                              </TabsTrigger>
                            </TabsList>

                            {/* Выбор даты */}
                            <TabsContent value="date" className="mt-3">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full h-11 justify-start rounded-xl font-normal",
                                      !expiryDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="w-4 h-4 mr-2" />
                                    {expiryDate
                                      ? format(expiryDate, "dd MMMM yyyy", { locale: ru })
                                      : "Выберите дату"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={expiryDate}
                                    onSelect={setExpiryDate}
                                    disabled={(d) => d < new Date()}
                                    initialFocus
                                    locale={ru}
                                  />
                                </PopoverContent>
                              </Popover>
                            </TabsContent>

                            {/* Количество суток */}
                            <TabsContent value="days" className="mt-3">
                              <div className="space-y-3">
                                <div className="relative">
                                  <Input
                                    type="number"
                                    placeholder="Количество суток"
                                    value={shelfDays}
                                    onChange={(e) => setShelfDays(e.target.value)}
                                    className="h-12 text-lg font-mono rounded-xl pr-16"
                                    min={1}
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    суток
                                  </span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {[3, 5, 7, 14, 30, 60, 90, 180].map((d) => (
                                    <button
                                      key={d}
                                      onClick={() => setShelfDays(String(d))}
                                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                        shelfDays === String(d)
                                          ? "bg-primary text-primary-foreground border-primary"
                                          : "bg-card text-muted-foreground border-border hover:border-primary/30"
                                      }`}
                                    >
                                      {d} дн
                                    </button>
                                  ))}
                                </div>
                                {shelfDays && (
                                  <p className="text-xs text-muted-foreground">
                                    Годен до:{" "}
                                    <span className="font-mono font-semibold text-foreground">
                                      {format(
                                        addDays(new Date(), parseInt(shelfDays)),
                                        "dd.MM.yyyy"
                                      )}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>

                        {/* Количество и место */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">Количество</Label>
                            <Input
                              type="number"
                              placeholder="шт."
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              className="mt-1.5 h-11 rounded-xl font-mono"
                              min={1}
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Место хранения</Label>
                            <Input
                              placeholder={product.default_location ?? "Укажите место"}
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="mt-1.5 h-11 rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Предпросмотр статуса */}
                        {computedExpiryDate && previewStatus && (
                          <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                              Предпросмотр
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <StatusBadge status={previewStatus} size="md" />
                                <span className="text-sm font-medium">
                                  → {format(computedExpiryDate, "dd.MM.yyyy")}
                                </span>
                              </div>
                              <span className="text-sm font-mono font-bold">
                                {getDaysLeft(format(computedExpiryDate, "yyyy-MM-dd"))} дн.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Кнопки */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 h-11 rounded-xl"
                            onClick={() => setShowAddForm(false)}
                          >
                            Отмена
                          </Button>
                          <Button
                            className="flex-1 h-11 rounded-xl shadow-md shadow-primary/20"
                            onClick={handleAddBatch}
                            disabled={
                              !computedExpiryDate ||
                              !quantity ||
                              createBatch.isPending
                            }
                          >
                            {createBatch.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            Сохранить
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Текущие партии */}
              {productBatches.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <div className="px-5 py-3.5 border-b border-border">
                      <p className="text-sm font-semibold">
                        Текущие партии ({productBatches.length})
                      </p>
                    </div>
                    <div className="divide-y divide-border">
                      {productBatches.map((b) => {
                        const daysLeft = getDaysLeft(b.expiration_date_effective);
                        const pct = getPercentLeft(
                          b.production_date,
                          b.expiration_date_effective
                        );
                        return (
                          <div
                            key={b.id}
                            className="flex items-center justify-between px-5 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <StatusBadge status={b.current_status} />
                              <span className="text-xs text-muted-foreground font-mono">
                                #{b.batch_number ?? b.id.slice(0, 8)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${progressColors[b.current_status]}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span
                                className={`text-sm font-mono font-bold w-10 text-right ${
                                  daysLeft <= 0
                                    ? "text-status-urgent"
                                    : daysLeft <= 3
                                    ? "text-status-hurry"
                                    : "text-foreground"
                                }`}
                              >
                                {daysLeft <= 0 ? "0" : daysLeft}д
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
