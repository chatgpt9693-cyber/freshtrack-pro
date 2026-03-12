import { differenceInDays, addDays, subDays, format } from "date-fns";

export type BatchStatus = "active" | "hurry_up" | "urgent_sale" | "expired";

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  shelfLifeDays: number;
  supplier: string;
  defaultLocation: string;
}

export interface Batch {
  id: string;
  productId: string;
  product?: Product;
  batchNumber: string;
  productionDate: Date;
  expirationDate: Date;
  quantity: number;
  location: string;
  currentStatus: BatchStatus;
  statusChangedAt: Date;
}

export interface NotificationLog {
  id: string;
  batchId: string;
  productName: string;
  type: "hurry_up" | "urgent_sale" | "expired";
  channel: "email" | "telegram" | "sms" | "push";
  sentAt: Date;
  status: "sent" | "delivered" | "failed";
}

const today = new Date();

export const products: Product[] = [
  { id: "p1", barcode: "4600000000001", name: "Молоко 3.2%", category: "Молочные", shelfLifeDays: 14, supplier: "ООО Молоко", defaultLocation: "Холодильник A1" },
  { id: "p2", barcode: "4600000000002", name: "Йогурт клубничный", category: "Молочные", shelfLifeDays: 21, supplier: "ООО Молоко", defaultLocation: "Холодильник A2" },
  { id: "p3", barcode: "4600000000003", name: "Хлеб белый", category: "Хлебобулочные", shelfLifeDays: 5, supplier: "Хлебзавод №3", defaultLocation: "Стеллаж B1" },
  { id: "p4", barcode: "4600000000004", name: "Сыр Гауда", category: "Молочные", shelfLifeDays: 90, supplier: "Cheese Corp", defaultLocation: "Холодильник A3" },
  { id: "p5", barcode: "4600000000005", name: "Сок апельсиновый", category: "Напитки", shelfLifeDays: 180, supplier: "Juicy Ltd", defaultLocation: "Склад C1" },
  { id: "p6", barcode: "4600000000006", name: "Колбаса докторская", category: "Мясные", shelfLifeDays: 30, supplier: "МясоПром", defaultLocation: "Холодильник A4" },
  { id: "p7", barcode: "4600000000007", name: "Творог 5%", category: "Молочные", shelfLifeDays: 10, supplier: "ООО Молоко", defaultLocation: "Холодильник A1" },
  { id: "p8", barcode: "4600000000008", name: "Масло сливочное", category: "Молочные", shelfLifeDays: 60, supplier: "ООО Молоко", defaultLocation: "Холодильник A5" },
  { id: "p9", barcode: "4600000000009", name: "Кефир 1%", category: "Молочные", shelfLifeDays: 14, supplier: "ООО Молоко", defaultLocation: "Холодильник A1" },
  { id: "p10", barcode: "4600000000010", name: "Консервы рыбные", category: "Консервы", shelfLifeDays: 730, supplier: "РыбПром", defaultLocation: "Склад D1" },
];

export function calculateStatus(productionDate: Date, shelfLifeDays: number): BatchStatus {
  const expirationDate = addDays(productionDate, shelfLifeDays);
  const totalDays = shelfLifeDays;
  const daysLeft = differenceInDays(expirationDate, today);
  
  if (daysLeft <= 0) return "expired";
  const percentLeft = (daysLeft / totalDays) * 100;
  if (percentLeft < 10) return "urgent_sale";
  if (percentLeft < 30) return "hurry_up";
  return "active";
}

export function getDaysLeft(expirationDate: Date): number {
  return differenceInDays(expirationDate, today);
}

export function getPercentLeft(productionDate: Date, shelfLifeDays: number): number {
  const expirationDate = addDays(productionDate, shelfLifeDays);
  const daysLeft = differenceInDays(expirationDate, today);
  return Math.max(0, Math.round((daysLeft / shelfLifeDays) * 100));
}

function makeBatch(
  id: string, productId: string, batchNum: string,
  prodDate: Date, product: Product, qty: number, location: string
): Batch {
  const expirationDate = addDays(prodDate, product.shelfLifeDays);
  const status = calculateStatus(prodDate, product.shelfLifeDays);
  return {
    id, productId, batchNumber: batchNum,
    productionDate: prodDate, expirationDate,
    quantity: qty, location,
    currentStatus: status,
    statusChangedAt: today,
    product,
  };
}

export const batches: Batch[] = [
  makeBatch("b1", "p1", "ML-2026-001", subDays(today, 12), products[0], 200, "Холодильник A1"),
  makeBatch("b2", "p1", "ML-2026-002", subDays(today, 3), products[0], 150, "Холодильник A1"),
  makeBatch("b3", "p2", "YG-2026-001", subDays(today, 18), products[1], 80, "Холодильник A2"),
  makeBatch("b4", "p3", "HB-2026-001", subDays(today, 4), products[2], 50, "Стеллаж B1"),
  makeBatch("b5", "p3", "HB-2026-002", subDays(today, 6), products[2], 30, "Стеллаж B1"),
  makeBatch("b6", "p4", "SG-2026-001", subDays(today, 70), products[3], 25, "Холодильник A3"),
  makeBatch("b7", "p5", "SA-2026-001", subDays(today, 10), products[4], 300, "Склад C1"),
  makeBatch("b8", "p6", "KD-2026-001", subDays(today, 25), products[5], 40, "Холодильник A4"),
  makeBatch("b9", "p7", "TV-2026-001", subDays(today, 9), products[6], 60, "Холодильник A1"),
  makeBatch("b10", "p8", "MS-2026-001", subDays(today, 45), products[7], 100, "Холодильник A5"),
  makeBatch("b11", "p9", "KF-2026-001", subDays(today, 13), products[8], 120, "Холодильник A1"),
  makeBatch("b12", "p10", "KR-2026-001", subDays(today, 100), products[9], 500, "Склад D1"),
];

export const notificationLogs: NotificationLog[] = [
  { id: "n1", batchId: "b1", productName: "Молоко 3.2%", type: "expired", channel: "email", sentAt: subDays(today, 1), status: "delivered" },
  { id: "n2", batchId: "b1", productName: "Молоко 3.2%", type: "expired", channel: "telegram", sentAt: subDays(today, 1), status: "delivered" },
  { id: "n3", batchId: "b3", productName: "Йогурт клубничный", type: "hurry_up", channel: "email", sentAt: subDays(today, 2), status: "sent" },
  { id: "n4", batchId: "b4", productName: "Хлеб белый", type: "urgent_sale", channel: "sms", sentAt: subDays(today, 0), status: "delivered" },
  { id: "n5", batchId: "b5", productName: "Хлеб белый", type: "expired", channel: "email", sentAt: today, status: "failed" },
  { id: "n6", batchId: "b8", productName: "Колбаса докторская", type: "hurry_up", channel: "telegram", sentAt: subDays(today, 3), status: "delivered" },
];

export const statusConfig: Record<BatchStatus, { label: string; emoji: string; className: string }> = {
  active: { label: "Активные", emoji: "🟢", className: "status-badge-active" },
  hurry_up: { label: "Успей купить", emoji: "🟡", className: "status-badge-hurry" },
  urgent_sale: { label: "Срочная распродажа", emoji: "🔴", className: "status-badge-urgent" },
  expired: { label: "Просрочено", emoji: "⚫", className: "status-badge-expired" },
};
