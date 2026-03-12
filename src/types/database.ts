// =============================================================
// FreshTrack — Database Types
// Генерируются из Supabase схемы. НЕ редактировать вручную.
// Для регенерации: npx supabase gen types typescript --local
// =============================================================

// ------------------------------------------------------------
// Enums — зеркало PostgreSQL enum-типов
// ------------------------------------------------------------

export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';

export type BatchStatus = 'ACTIVE' | 'HURRY_UP' | 'URGENT_SALE' | 'EXPIRED';

export type NotificationChannel = 'EMAIL' | 'TELEGRAM' | 'SMS' | 'WEB_PUSH';

export type NotificationTrigger = 'HURRY_UP' | 'URGENT_SALE' | 'EXPIRED';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

// ------------------------------------------------------------
// Row types — типы строк таблиц (Select)
// ------------------------------------------------------------

export interface Product {
  id: string;
  barcode: string;
  name: string;
  description: string | null;
  shelf_life_days: number;
  category: string | null;
  supplier: string | null;
  default_location: string | null;
  is_active: boolean;
  created_at: string; // ISO 8601
  updated_at: string;
}

export interface CategoryThresholds {
  id: string;
  hurry_up_percent: number;
  hurry_up_days_min: number;
  urgent_sale_percent: number;
  urgent_sale_days_min: number;
  updated_at: string;
  updated_by: string | null;
}

export interface Batch {
  id: string;
  product_id: string;
  batch_number: string | null;
  production_date: string;              // DATE → 'YYYY-MM-DD'
  expiration_date_calculated: string;   // DATE → 'YYYY-MM-DD'
  expiration_date_scanned: string | null;
  expiration_date_effective: string;    // DATE → 'YYYY-MM-DD' — основная рабочая дата
  quantity: number;
  location: string | null;
  notes: string | null;
  current_status: BatchStatus;
  previous_status: BatchStatus | null;
  is_blocked: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  telegram_id: string | null;
  telegram_username: string | null;
  role: UserRole;
  notification_settings: NotificationSettings;
  push_subscription: WebPushSubscription | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BatchStatusHistory {
  id: string;
  batch_id: string;
  from_status: BatchStatus | null;
  to_status: BatchStatus;
  changed_at: string;
  changed_by: string;
}

export interface NotificationLog {
  id: string;
  batch_id: string;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  recipient_id: string | null;
  recipient_ref: string;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

// ------------------------------------------------------------
// Insert types — типы для INSERT-запросов (обязательные поля)
// ------------------------------------------------------------

export interface ProductInsert {
  barcode: string;
  name: string;
  shelf_life_days: number;
  description?: string | null;
  category?: string | null;
  supplier?: string | null;
  default_location?: string | null;
  is_active?: boolean;
}

export interface BatchInsert {
  product_id: string;
  production_date: string;              // 'YYYY-MM-DD'
  quantity: number;
  batch_number?: string | null;
  expiration_date_scanned?: string | null; // из GS1-128
  expiration_date_effective?: string | null; // если NULL — триггер подставит calculated
  location?: string | null;
  notes?: string | null;
  created_by?: string | null;
}

export interface BatchUpdate {
  quantity?: number;
  location?: string | null;
  notes?: string | null;
  expiration_date_effective?: string;
  expiration_date_scanned?: string | null;
}

export interface UserProfileUpdate {
  full_name?: string | null;
  phone?: string | null;
  telegram_id?: string | null;
  telegram_username?: string | null;
  notification_settings?: Partial<NotificationSettings>;
  push_subscription?: WebPushSubscription | null;
}

// ADMIN-only: изменение роли вынесено отдельно для явности
export interface UserRoleUpdate {
  role: UserRole;
  is_active?: boolean;
}

export interface CategoryThresholdsUpdate {
  hurry_up_percent?: number;
  hurry_up_days_min?: number;
  urgent_sale_percent?: number;
  urgent_sale_days_min?: number;
}

// ------------------------------------------------------------
// Joined types — обогащённые типы для UI (результаты JOIN-запросов)
// ------------------------------------------------------------

// Партия с вложенным продуктом — основной тип для списков и карточек
export interface BatchWithProduct extends Batch {
  product: Product;
}

// Запись истории с вложенной партией — для аудит-лога
export interface BatchStatusHistoryWithBatch extends BatchStatusHistory {
  batch: BatchWithProduct;
}

// Лог уведомлений с вложенной партией и профилем получателя
export interface NotificationLogWithDetails extends NotificationLog {
  batch: BatchWithProduct;
  recipient: UserProfile | null;
}

// ------------------------------------------------------------
// JSONB value types — типы для JSONB-колонок
// ------------------------------------------------------------

export interface NotificationSettings {
  channels: {
    email: boolean;
    telegram: boolean;
    sms: boolean;
    web_push: boolean;
  };
  triggers: {
    HURRY_UP: boolean;
    URGENT_SALE: boolean;
    EXPIRED: boolean;
  };
}

export interface WebPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// ------------------------------------------------------------
// API Response types — обёртки для ответов Supabase
// ------------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  total: number;
  active: number;
  hurry_up: number;
  urgent_sale: number;
  expired: number;
  blocked: number;
}

// ------------------------------------------------------------
// Filter/Query types — типы для фильтрации и поиска
// ------------------------------------------------------------

export interface BatchFilters {
  status?: BatchStatus | BatchStatus[];
  product_id?: string;
  location?: string;
  is_blocked?: boolean;
  expiry_before?: string; // 'YYYY-MM-DD'
  expiry_after?: string;
  search?: string;        // поиск по batch_number или barcode продукта
}

export interface ProductFilters {
  category?: string;
  supplier?: string;
  is_active?: boolean;
  search?: string;        // поиск по name или barcode
}

export interface NotificationLogFilters {
  batch_id?: string;
  trigger?: NotificationTrigger;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  date_from?: string;
  date_to?: string;
}

// ------------------------------------------------------------
// Utility types
// ------------------------------------------------------------

// Статусы в UI-friendly формате
export const BATCH_STATUS_CONFIG: Record<BatchStatus, {
  label: string;
  emoji: string;
  className: string;
  variant: 'active' | 'warning' | 'urgent' | 'expired';
}> = {
  ACTIVE:       { label: 'Активна',           emoji: '✅', className: 'bg-status-active-bg text-status-active-foreground',   variant: 'active'  },
  HURRY_UP:     { label: 'Успей купить',       emoji: '⚡', className: 'bg-status-hurry-bg text-status-hurry-foreground',     variant: 'warning' },
  URGENT_SALE:  { label: 'Срочная распродажа', emoji: '🔥', className: 'bg-status-urgent-bg text-status-urgent-foreground',   variant: 'urgent'  },
  EXPIRED:      { label: 'Просрочено',         emoji: '💀', className: 'bg-status-expired-bg text-status-expired-foreground', variant: 'expired' },
} as const;

// Маппинг старых snake_case статусов мок-данных → новые ENUM значения
// Используется при миграции UI-кода
export const LEGACY_STATUS_MAP: Record<string, BatchStatus> = {
  active:       'ACTIVE',
  hurry_up:     'HURRY_UP',
  urgent_sale:  'URGENT_SALE',
  expired:      'EXPIRED',
} as const;
