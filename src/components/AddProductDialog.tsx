import { useState } from "react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Package, ScanBarcode } from "lucide-react";
import { toast } from "sonner";
import { useCreateProduct, useProductCategories, useProductByBarcode } from "@/lib/queries";
import { BarcodeScannerDialog } from "./BarcodeScannerDialog";
import { VoiceInput } from "./VoiceInput";
import type { ProductInsert } from "@/types/database";

// Схема валидации
const productSchema = z.object({
  barcode: z
    .string()
    .min(8, "Штрихкод должен содержать минимум 8 символов")
    .max(20, "Штрихкод не может быть длиннее 20 символов")
    .regex(/^\d+$/, "Штрихкод должен содержать только цифры"),
  name: z
    .string()
    .min(2, "Название должно содержать минимум 2 символа")
    .max(100, "Название не может быть длиннее 100 символов"),
  description: z
    .string()
    .max(500, "Описание не может быть длиннее 500 символов")
    .optional(),
  shelf_life_days: z
    .number()
    .min(1, "Срок годности должен быть больше 0 дней")
    .max(3650, "Срок годности не может превышать 10 лет"),
  category: z
    .string()
    .max(50, "Категория не может быть длиннее 50 символов")
    .optional(),
  supplier: z
    .string()
    .max(100, "Поставщик не может быть длиннее 100 символов")
    .optional(),
  default_location: z
    .string()
    .max(100, "Место хранения не может быть длиннее 100 символов")
    .optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface AddProductDialogProps {
  trigger?: React.ReactNode;
  initialBarcode?: string;
}

export function AddProductDialog({ trigger, initialBarcode }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [barcodeToCheck, setBarcodeToCheck] = useState<string | null>(null);
  const createProduct = useCreateProduct();
  const { data: categories = [] } = useProductCategories();
  
  // Проверка существования товара по штрихкоду
  const { data: existingProduct, isFetching: isCheckingBarcode } = useProductByBarcode(
    barcodeToCheck,
    { enabled: !!barcodeToCheck }
  );

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      barcode: initialBarcode || "",
      name: "",
      description: "",
      shelf_life_days: 30,
      category: "",
      supplier: "",
      default_location: "",
    },
  });

  // Обновляем форму при изменении initialBarcode
  React.useEffect(() => {
    if (initialBarcode && open) {
      form.setValue("barcode", initialBarcode);
    }
  }, [initialBarcode, open, form]);

  // Проверяем штрихкод с задержкой
  React.useEffect(() => {
    const barcode = form.watch("barcode");
    if (barcode && barcode.length >= 8) {
      const timeoutId = setTimeout(() => {
        setBarcodeToCheck(barcode);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setBarcodeToCheck(null);
    }
  }, [form.watch("barcode")]);

  // Устанавливаем ошибку если товар уже существует
  React.useEffect(() => {
    if (existingProduct && barcodeToCheck) {
      form.setError("barcode", {
        message: `Товар "${existingProduct.name}" с таким штрихкодом уже существует`,
      });
    } else if (!existingProduct && barcodeToCheck) {
      form.clearErrors("barcode");
    }
  }, [existingProduct, barcodeToCheck, form]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      const productData: ProductInsert = {
        barcode: data.barcode.trim(),
        name: data.name.trim(),
        shelf_life_days: data.shelf_life_days,
        description: data.description?.trim() || null,
        category: data.category?.trim() || null,
        supplier: data.supplier?.trim() || null,
        default_location: data.default_location?.trim() || null,
        is_active: true,
      };

      await createProduct.mutateAsync(productData);

      toast.success("Товар добавлен", {
        description: `${data.name} успешно добавлен в каталог`,
      });

      form.reset();
      setOpen(false);
    } catch (error: any) {
      console.error("Ошибка при создании товара:", error);
      
      // Обработка специфичных ошибок
      if (error?.code === "23505") {
        toast.error("Товар с таким штрихкодом уже существует");
        form.setError("barcode", {
          message: "Товар с таким штрихкодом уже существует",
        });
      } else {
        toast.error("Ошибка при добавлении товара", {
          description: error?.message || "Попробуйте еще раз",
        });
      }
    }
  };

  const defaultTrigger = (
    <Button className="h-11 rounded-xl shadow-md shadow-primary/20">
      <Plus className="w-4 h-4 mr-2" />
      Добавить товар
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Добавить новый товар
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Штрихкод */}
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    Штрихкод *
                    <BarcodeScannerDialog
                      onScan={(scannedBarcode) => {
                        field.onChange(scannedBarcode);
                        setBarcodeToCheck(scannedBarcode);
                      }}
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 text-xs"
                        >
                          <ScanBarcode className="w-3 h-3 mr-1" />
                          Сканировать
                        </Button>
                      }
                    />
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="4600000000001"
                        className="font-mono pr-8"
                        {...field}
                      />
                      {isCheckingBarcode && (
                        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Название */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    Название товара *
                    <VoiceInput
                      onResult={(text) => {
                        field.onChange(text);
                        toast.success("Название добавлено голосом", {
                          description: text,
                        });
                      }}
                    />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Молоко 3.2%" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Описание */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    Описание
                    <VoiceInput
                      onResult={(text) => {
                        field.onChange(text);
                        toast.success("Описание добавлено голосом", {
                          description: text,
                        });
                      }}
                    />
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Дополнительная информация о товаре..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Срок годности */}
            <FormField
              control={form.control}
              name="shelf_life_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Срок годности (дней) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={3650}
                      placeholder="30"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Категория */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Молочные"
                      list="categories"
                      {...field}
                    />
                  </FormControl>
                  <datalist id="categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Поставщик */}
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Поставщик</FormLabel>
                  <FormControl>
                    <Input placeholder="ООО Молоко" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Место хранения по умолчанию */}
            <FormField
              control={form.control}
              name="default_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Место хранения по умолчанию</FormLabel>
                  <FormControl>
                    <Input placeholder="Холодильник A1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Кнопки */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={createProduct.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createProduct.isPending || !!existingProduct}
              >
                {createProduct.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}