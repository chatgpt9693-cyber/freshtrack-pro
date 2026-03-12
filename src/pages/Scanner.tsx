import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { products, batches, calculateStatus, getDaysLeft, getPercentLeft } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { ScanBarcode, Search, CalendarIcon, Clock, Plus, Check, Package } from "lucide-react";
import { format, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function Scanner() {
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<typeof products[0] | null>(null);
  const [searched, setSearched] = useState(false);

  // New batch form
  const [showAddForm, setShowAddForm] = useState(false);
  const [expiryMode, setExpiryMode] = useState<"date" | "days">("date");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [shelfDays, setShelfDays] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = () => {
    if (!barcode.trim()) return;
    const found = products.find((p) => p.barcode === barcode.trim());
    setResult(found || null);
    setSearched(true);
    setShowAddForm(false);
  };

  const productBatches = result ? batches.filter((b) => b.productId === result.id) : [];

  const computedExpiryDate = expiryMode === "date"
    ? expiryDate
    : shelfDays ? addDays(new Date(), parseInt(shelfDays)) : undefined;

  const handleAddBatch = () => {
    if (!computedExpiryDate || !quantity) return;
    toast.success("Партия добавлена", {
      description: `${result?.name} — годен до ${format(computedExpiryDate, "dd.MM.yyyy")}`,
    });
    setShowAddForm(false);
    setExpiryDate(undefined);
    setShelfDays("");
    setQuantity("");
    setLocation("");
  };

  return (
    <div className="p-4 md:p-8 gradient-mesh min-h-screen">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          className="text-center pt-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ScanBarcode className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Сканер</h1>
          <p className="text-muted-foreground text-sm mt-1">Введите или отсканируйте штрихкод товара</p>
        </motion.div>

        {/* Search Bar */}
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
          <Button
            onClick={handleSearch}
            size="lg"
            className="h-14 px-6 rounded-2xl shadow-md shadow-primary/20"
          >
            <Search className="w-5 h-5" />
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Not found */}
          {searched && !result && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-medium">Продукт не найден</p>
                  <p className="text-sm text-muted-foreground mt-1">Можно добавить новый товар в справочник</p>
                  <Button variant="outline" className="mt-4 rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить товар
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Found */}
          {result && (
            <motion.div
              key="found"
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Product Info */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold">{result.name}</h2>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{result.barcode}</p>
                    </div>
                    <span className="text-[11px] bg-accent text-accent-foreground px-2.5 py-1 rounded-lg font-medium">
                      {result.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>📍 {result.defaultLocation}</span>
                    <span>🏭 {result.supplier}</span>
                    <span>⏱ {result.shelfLifeDays} дн. хранения</span>
                  </div>
                </CardContent>
              </Card>

              {/* Add batch button */}
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="w-full h-12 rounded-xl shadow-md shadow-primary/20 text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить партию
                </Button>
              )}

              {/* Add Batch Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card className="border-primary/20 shadow-lg shadow-primary/5">
                      <CardContent className="p-5 space-y-5">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                          Новая партия
                        </h3>

                        {/* Expiry Mode Tabs */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Срок годности</Label>
                          <Tabs value={expiryMode} onValueChange={(v) => setExpiryMode(v as "date" | "days")}>
                            <TabsList className="w-full rounded-xl h-11 bg-muted p-1">
                              <TabsTrigger
                                value="date"
                                className="flex-1 rounded-lg text-sm data-[state=active]:shadow-sm gap-2"
                              >
                                <CalendarIcon className="w-4 h-4" />
                                Годен до (дата)
                              </TabsTrigger>
                              <TabsTrigger
                                value="days"
                                className="flex-1 rounded-lg text-sm data-[state=active]:shadow-sm gap-2"
                              >
                                <Clock className="w-4 h-4" />
                                Годен (суток)
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="date" className="mt-3">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full h-12 justify-start text-left font-normal rounded-xl",
                                      !expiryDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expiryDate ? format(expiryDate, "dd MMMM yyyy", { locale: ru }) : "Выберите дату"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={expiryDate}
                                    onSelect={setExpiryDate}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto")}
                                  />
                                </PopoverContent>
                              </Popover>
                            </TabsContent>

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

                                {/* Quick presets */}
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
                                    Годен до: <span className="font-mono font-semibold text-foreground">
                                      {format(addDays(new Date(), parseInt(shelfDays)), "dd.MM.yyyy")}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>

                        {/* Quantity & Location */}
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
                              placeholder={result.defaultLocation}
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="mt-1.5 h-11 rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Preview */}
                        {computedExpiryDate && (
                          <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Предпросмотр</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <StatusBadge
                                  status={calculateStatus(
                                    new Date(),
                                    Math.ceil((computedExpiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                  )}
                                  size="md"
                                />
                                <span className="text-sm font-medium">→ {format(computedExpiryDate, "dd.MM.yyyy")}</span>
                              </div>
                              <span className="text-sm font-mono font-bold">
                                {Math.ceil((computedExpiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} дн.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
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
                            disabled={!computedExpiryDate || !quantity}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Сохранить
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Existing Batches */}
              {productBatches.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <div className="px-5 py-3.5 border-b border-border">
                      <p className="text-sm font-semibold">Текущие партии ({productBatches.length})</p>
                    </div>
                    <div className="divide-y divide-border">
                      {productBatches.map((b) => {
                        const daysLeft = getDaysLeft(b.expirationDate);
                        const pct = getPercentLeft(b.productionDate, b.product?.shelfLifeDays || 0);
                        return (
                          <div key={b.id} className="flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-3">
                              <StatusBadge status={b.currentStatus} />
                              <span className="text-xs text-muted-foreground font-mono">#{b.batchNumber}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    b.currentStatus === "active" ? "bg-status-active"
                                    : b.currentStatus === "hurry_up" ? "bg-status-hurry"
                                    : b.currentStatus === "urgent_sale" ? "bg-status-urgent"
                                    : "bg-status-expired"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className={`text-sm font-mono font-bold w-10 text-right ${
                                daysLeft <= 0 ? "text-status-urgent" : daysLeft <= 3 ? "text-status-hurry" : "text-foreground"
                              }`}>
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
