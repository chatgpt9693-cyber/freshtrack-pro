// =============================================================
// FreshTrack — Date & Status Utilities
// Клиентский расчёт статусов и форматирование дат.
// Используется для UI-логики (цвета, тексты, прогресс-бары).
// БД является источником правды — эти функции только для отображения.
// =============================================================

import { differenceInDays, format, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { BatchStatus, CategoryThresholds } from '../types/database';

// ------------------------------------------------------------
// Date helpers
// ------------------------------------------------------------

/**
 * Парсит DATE-строку из Supabase ('YYYY-MM-DD') в объект Date.
 * Supabase возвращает DATE как строку, не как timestamp.
 */
export function parseDate(dateStr: string): Date {
  // parseISO корректно обрабатывает 'YYYY-MM-DD' как локальную дату
  // (без времени, без сдвига timezone)
  const date = parseISO(dateStr);
  if (!isValid(date)) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return date;
}

/** Форматирование даты для UI */
export function formatDate(dateStr: string, fmt = 'dd.MM.yyyy'): string {
  return format(parseDate(dateStr), fmt, { locale: ru });
}

/** Сколько дней осталось до истечения срока */
export function getDaysLeft(expirationDateStr: string): number {
  return differenceInDays(parseDate(expirationDateStr), new Date());
}

/** Процент оставшегося срока */
export function getPercentLeft(
  productionDateStr: string,
  expirationDateStr: string
): number {
  const production   = parseDate(productionDateStr);
  const expiration   = parseDate(expirationDateStr);
  const totalDays    = differenceInDays(expiration, production);
  const daysLeft     = differenceInDays(expiration, new Date());

  if (totalDays <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100)));
}

/** Форматирование оставшегося времени для UI */
export function formatDaysLeft(expirationDateStr: string): string {
  const days = getDaysLeft(expirationDateStr);

  if (days < 0)  return `Просрочено ${Math.abs(days)} дн. назад`;
  if (days === 0) return 'Истекает сегодня';
  if (days === 1) return 'Остался 1 день';
  if (days < 5)  return `Осталось ${days} дня`;
  return `Осталось ${days} дней`;
}

// ------------------------------------------------------------
// Status calculation (клиентская реплика функции из БД)
// Используется ТОЛЬКО для немедленного отображения после мутаций,
// до получения подтверждения от БД через Realtime.
// Источник правды — всегда БД.
// ------------------------------------------------------------

/**
 * Реплика PostgreSQL-функции calculate_batch_status.
 * Комбинированный алгоритм: процент ИЛИ абсолютный минимум дней.
 */
export function calculateStatus(
  expirationDateStr: string,
  productionDateStr: string,
  thresholds: Pick<
    CategoryThresholds,
    'hurry_up_percent' | 'hurry_up_days_min' | 'urgent_sale_percent' | 'urgent_sale_days_min'
  >
): BatchStatus {
  const expiration = parseDate(expirationDateStr);
  const production = parseDate(productionDateStr);
  const today      = new Date();

  const totalDays = differenceInDays(expiration, production);
  const daysLeft  = differenceInDays(expiration, today);

  if (daysLeft <= 0) return 'EXPIRED';
  if (totalDays <= 0) return 'EXPIRED';

  const percentLeft = (daysLeft / totalDays) * 100;

  if (
    percentLeft < thresholds.urgent_sale_percent ||
    daysLeft <= thresholds.urgent_sale_days_min
  ) {
    return 'URGENT_SALE';
  }

  if (
    percentLeft < thresholds.hurry_up_percent ||
    daysLeft <= thresholds.hurry_up_days_min
  ) {
    return 'HURRY_UP';
  }

  return 'ACTIVE';
}

// ------------------------------------------------------------
// Status display helpers
// ------------------------------------------------------------

/** Цвет прогресс-бара на основе процента оставшегося срока */
export function getProgressColor(percentLeft: number): string {
  if (percentLeft <= 0)  return 'bg-status-expired';
  if (percentLeft < 10)  return 'bg-status-urgent';
  if (percentLeft < 30)  return 'bg-status-hurry';
  return 'bg-status-active';
}

/** Проверка: является ли статус критическим (требует внимания) */
export function isCriticalStatus(status: BatchStatus): boolean {
  return status === 'URGENT_SALE' || status === 'EXPIRED';
}

/** Проверка: является ли статус предупредительным */
export function isWarningStatus(status: BatchStatus): boolean {
  return status === 'HURRY_UP';
}

/** Порядок сортировки статусов по критичности (для списков) */
export const STATUS_SORT_ORDER: Record<BatchStatus, number> = {
  EXPIRED:      0,
  URGENT_SALE:  1,
  HURRY_UP:     2,
  ACTIVE:       3,
} as const;

// ------------------------------------------------------------
// GS1-128 parsing (клиентская утилита для сканера)
// Парсит Application Identifier (17) — дата истечения срока годности
// Формат: YYMMDD (например, 280315 = 28 марта 2028 в нотации GS1: 280315)
// ------------------------------------------------------------

interface GS1ParseResult {
  expirationDate: string | null;  // 'YYYY-MM-DD'
  productionDate: string | null;  // 'YYYY-MM-DD'
  batchNumber:    string | null;
  quantity:       number | null;
  barcode:        string | null;  // GTIN
}

/**
 * Базовый парсер GS1-128 Application Identifiers.
 * Поддерживает: (01) GTIN, (10) batch, (11) prod date, (17) exp date, (30) qty
 */
export function parseGS1(rawBarcode: string): GS1ParseResult {
  const result: GS1ParseResult = {
    expirationDate: null,
    productionDate: null,
    batchNumber:    null,
    quantity:       null,
    barcode:        null,
  };

  // Убираем FNC1 символы и нормализуем
  const clean = rawBarcode.replace(/[\x1D\x1E]/g, '(').replace(/\[/g, '(');

  const aiPatterns: Array<{
    ai: string;
    pattern: RegExp;
    handler: (match: string) => void;
  }> = [
    {
      ai: '01',
      pattern: /\(01\)(\d{14})/,
      handler: (m) => { result.barcode = m; },
    },
    {
      ai: '10',
      pattern: /\(10\)([^(]{1,20})/,
      handler: (m) => { result.batchNumber = m.trim(); },
    },
    {
      ai: '11',
      pattern: /\(11\)(\d{6})/,
      handler: (m) => { result.productionDate = parseGS1Date(m); },
    },
    {
      ai: '17',
      pattern: /\(17\)(\d{6})/,
      handler: (m) => { result.expirationDate = parseGS1Date(m); },
    },
    {
      ai: '30',
      pattern: /\(30\)(\d{1,8})/,
      handler: (m) => { result.quantity = parseInt(m, 10); },
    },
  ];

  for (const { pattern, handler } of aiPatterns) {
    const match = clean.match(pattern);
    if (match?.[1]) handler(match[1]);
  }

  return result;
}

/** Конвертирует GS1 YYMMDD в ISO 'YYYY-MM-DD' */
function parseGS1Date(yymmdd: string): string | null {
  if (yymmdd.length !== 6) return null;

  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const dd = parseInt(yymmdd.slice(4, 6), 10);

  if (mm < 1 || mm > 12) return null;

  // GS1 стандарт: если DD = 00, используем последний день месяца
  const actualDay = dd === 0
    ? new Date(2000 + yy, mm, 0).getDate()
    : dd;

  // Двузначный год: 00-49 → 2000-2049, 50-99 → 1950-1999
  const fullYear = yy <= 49 ? 2000 + yy : 1900 + yy;

  return format(new Date(fullYear, mm - 1, actualDay), 'yyyy-MM-dd');
}
