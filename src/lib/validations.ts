// =============================================================
// FreshTrack — Zod Validation Schemas
// Валидация всех форм на клиенте.
// Zod уже в зависимостях (используется react-hook-form).
// =============================================================

import { z } from 'zod';

// ------------------------------------------------------------
// Общие переиспользуемые схемы
// ------------------------------------------------------------

/** EAN-13 (13 цифр) или UPC-A (12 цифр) */
const barcodeSchema = z
  .string()
  .trim()
  .regex(/^\d{12,14}$/, 'Штрихкод должен содержать 12–14 цифр (EAN-13, UPC-A или GTIN-14)');

/** ISO дата строка 'YYYY-MM-DD' */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате YYYY-MM-DD');

// ------------------------------------------------------------
// Product schemas
// ------------------------------------------------------------

export const createProductSchema = z.object({
  barcode: barcodeSchema,
  name: z
    .string()
    .trim()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(200, 'Название не должно превышать 200 символов'),
  shelf_life_days: z
    .number({ invalid_type_error: 'Укажите срок годности в днях' })
    .int('Срок годности должен быть целым числом')
    .min(1, 'Срок годности должен быть не менее 1 дня')
    .max(36500, 'Срок годности не должен превышать 100 лет'),
  description:      z.string().trim().max(1000).optional().nullable(),
  category:         z.string().trim().max(100).optional().nullable(),
  supplier:         z.string().trim().max(200).optional().nullable(),
  default_location: z.string().trim().max(100).optional().nullable(),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;

// ------------------------------------------------------------
// Batch schemas
// ------------------------------------------------------------

export const createBatchSchema = z
  .object({
    product_id:      z.string().uuid('Некорректный ID продукта'),
    batch_number:    z.string().trim().max(100).optional().nullable(),
    production_date: isoDateSchema,
    quantity: z
      .number({ invalid_type_error: 'Укажите количество' })
      .int('Количество должно быть целым числом')
      .min(1, 'Количество должно быть не менее 1'),
    location: z.string().trim().max(100).optional().nullable(),
    notes:    z.string().trim().max(500).optional().nullable(),

    // Источник даты истечения: 'calculated' | 'scanned' | 'manual'
    expiry_source: z.enum(['calculated', 'scanned', 'manual']).default('calculated'),

    // Дата из GS1-128 (заполняется при сканировании)
    expiration_date_scanned:   isoDateSchema.optional().nullable(),
    // Дата введённая вручную (для режима 'manual')
    expiration_date_manual:    isoDateSchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Если источник 'scanned' — дата из сканера обязательна
    if (data.expiry_source === 'scanned' && !data.expiration_date_scanned) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiration_date_scanned'],
        message: 'Дата из штрихкода обязательна при выборе источника "Из штрихкода"',
      });
    }

    // Если источник 'manual' — ручная дата обязательна
    if (data.expiry_source === 'manual' && !data.expiration_date_manual) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiration_date_manual'],
        message: 'Укажите дату истечения срока годности',
      });
    }
  });

export type CreateBatchFormData = z.infer<typeof createBatchSchema>;

export const updateBatchSchema = z.object({
  quantity: z
    .number()
    .int()
    .min(0, 'Количество не может быть отрицательным')
    .optional(),
  location: z.string().trim().max(100).optional().nullable(),
  notes:    z.string().trim().max(500).optional().nullable(),
  expiration_date_effective: isoDateSchema.optional(),
});

export type UpdateBatchFormData = z.infer<typeof updateBatchSchema>;

// ------------------------------------------------------------
// Category Thresholds schema
// ------------------------------------------------------------

export const updateThresholdsSchema = z
  .object({
    hurry_up_percent: z
      .number()
      .min(1, 'Минимум 1%')
      .max(99, 'Максимум 99%'),
    hurry_up_days_min: z
      .number()
      .int()
      .min(1, 'Минимум 1 день'),
    urgent_sale_percent: z
      .number()
      .min(1, 'Минимум 1%')
      .max(99, 'Максимум 99%'),
    urgent_sale_days_min: z
      .number()
      .int()
      .min(1, 'Минимум 1 день'),
  })
  .superRefine((data, ctx) => {
    if (data.hurry_up_percent <= data.urgent_sale_percent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hurry_up_percent'],
        message: 'Порог "Успей купить" должен быть выше порога "Срочная распродажа"',
      });
    }
    if (data.hurry_up_days_min <= data.urgent_sale_days_min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hurry_up_days_min'],
        message: 'Абсолютный минимум дней для "Успей купить" должен быть больше, чем для "Срочная распродажа"',
      });
    }
  });

export type UpdateThresholdsFormData = z.infer<typeof updateThresholdsSchema>;

// ------------------------------------------------------------
// User Profile schema
// ------------------------------------------------------------

export const updateProfileSchema = z.object({
  full_name:        z.string().trim().min(2).max(200).optional().nullable(),
  phone:            z.string().trim().regex(/^\+?\d{10,15}$/, 'Некорректный номер телефона').optional().nullable(),
  telegram_id:      z.string().trim().max(50).optional().nullable(),
  telegram_username: z.string().trim().max(50).optional().nullable(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// ------------------------------------------------------------
// Auth schemas
// ------------------------------------------------------------

export const signInSchema = z.object({
  email:    z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
});

export type SignInFormData = z.infer<typeof signInSchema>;
