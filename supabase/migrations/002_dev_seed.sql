-- =============================================================
-- FreshTrack — Dev Seed: Test Batches
-- Version: 002
-- ВНИМАНИЕ: только для разработки! Удалить перед production.
-- Партии вставляются без production_date-зависимостей через
-- прямое указание дат — триггер сам рассчитает статусы.
-- =============================================================

-- Партии для Молоко 3.2% (shelf_life=14 дней)
INSERT INTO public.batches
  (product_id, batch_number, production_date, expiration_date_effective, quantity, location)
VALUES
  -- ACTIVE: произведено 3 дня назад, истекает через 11 дней
  ('11111111-0000-0000-0000-000000000001', 'ML-2026-002',
   CURRENT_DATE - 3,  CURRENT_DATE + 11, 150, 'Холодильник A1'),
  -- HURRY_UP: произведено 10 дней назад, истекает через 4 дня (28% < 30%)
  ('11111111-0000-0000-0000-000000000001', 'ML-2026-001',
   CURRENT_DATE - 10, CURRENT_DATE + 4,  200, 'Холодильник A1');

-- Партии для Йогурт клубничный (shelf_life=21 день)
INSERT INTO public.batches
  (product_id, batch_number, production_date, expiration_date_effective, quantity, location)
VALUES
  -- HURRY_UP: 3 дня из 21 = 14% < 30%
  ('11111111-0000-0000-0000-000000000002', 'YG-2026-001',
   CURRENT_DATE - 18, CURRENT_DATE + 3,  80,  'Холодильник A2');

-- Партии для Хлеб белый (shelf_life=5 дней)
INSERT INTO public.batches
  (product_id, batch_number, production_date, expiration_date_effective, quantity, location)
VALUES
  -- URGENT_SALE: 1 день из 5 = 20% НО <= 3 дней (абсолютный минимум)
  ('11111111-0000-0000-0000-000000000003', 'HB-2026-001',
   CURRENT_DATE - 4,  CURRENT_DATE + 1,  50,  'Стеллаж B1'),
  -- HURRY_UP: 2 дня из 5 = 40% НО <= 7 дней (абсолютный минимум)
  ('11111111-0000-0000-0000-000000000003', 'HB-2026-002',
   CURRENT_DATE - 3,  CURRENT_DATE + 2,  30,  'Стеллаж B1');

-- Партии для Сыр Гауда (shelf_life=90 дней)
INSERT INTO public.batches
  (product_id, batch_number, production_date, expiration_date_effective, quantity, location)
VALUES
  -- ACTIVE: 60 дней из 90 = 67%
  ('11111111-0000-0000-0000-000000000004', 'CG-2026-001',
   CURRENT_DATE - 30, CURRENT_DATE + 60, 45,  'Холодильник A3'),
  -- HURRY_UP: 20 дней из 90 = 22% < 30%
  ('11111111-0000-0000-0000-000000000004', 'CG-2025-012',
   CURRENT_DATE - 70, CURRENT_DATE + 20, 20,  'Холодильник A3');

-- Партия для Сок апельсиновый (shelf_life=180 дней)
INSERT INTO public.batches
  (product_id, batch_number, production_date, expiration_date_effective, quantity, location)
VALUES
  -- ACTIVE: 150 дней из 180 = 83%
  ('11111111-0000-0000-0000-000000000005', 'JC-2026-001',
   CURRENT_DATE - 30, CURRENT_DATE + 150, 120, 'Склад C1');

-- Партии для Колбаса докторская (shelf_life=30 дней)
INSERT INTO public.batches
  (product_id, batch_number, production_date, expiration_date_effective, quantity, location)
VALUES
  -- URGENT_SALE: 2 дня из 30 = 6.7% < 10%
  ('11111111-0000-0000-0000-000000000006', 'SM-2026-003',
   CURRENT_DATE - 28, CURRENT_DATE + 2,  15,  'Холодильник A4'),
  -- ACTIVE: 25 дней из 30 = 83%
  ('11111111-0000-0000-0000-000000000006', 'SM-2026-004',
   CURRENT_DATE - 5,  CURRENT_DATE + 25, 60,  'Холодильник A4');

-- Партия для Творог 5% (shelf_life=10 дней)
INSERT INTO public.batches
  (product_id, batch_number, production_date, expiration_date_effective, quantity, location)
VALUES
  -- EXPIRED: срок вышел вчера
  ('11111111-0000-0000-0000-000000000007', 'CT-2026-001',
   CURRENT_DATE - 11, CURRENT_DATE - 1,  25,  'Холодильник A1');

-- Партия для Кефир 1% (shelf_life=14 дней)
INSERT INTO public.batches
  (product_id, batch_number, production_date, expiration_date_effective, quantity, location)
VALUES
  -- ACTIVE: 10 дней из 14 = 71%
  ('11111111-0000-0000-0000-000000000009', 'KF-2026-001',
   CURRENT_DATE - 4,  CURRENT_DATE + 10, 90,  'Холодильник A1');

-- Партия для Консервы рыбные (shelf_life=730 дней)
INSERT INTO public.batches
  (product_id, batch_number, production_date, expiration_date_effective, quantity, location)
VALUES
  -- ACTIVE: 500 дней из 730 = 68%
  ('11111111-0000-0000-0000-000000000010', 'RF-2025-001',
   CURRENT_DATE - 230, CURRENT_DATE + 500, 300, 'Склад D1');
