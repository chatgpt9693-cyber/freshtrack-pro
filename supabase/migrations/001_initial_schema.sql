-- =============================================================
-- FreshTrack — Initial Schema Migration
-- Version: 001 (fixed — no DO block inside cron.schedule)
-- =============================================================

-- =============================================================
-- EXTENSIONS
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE public.user_role AS ENUM (
  'ADMIN',
  'MANAGER',
  'OPERATOR',
  'VIEWER'
);

CREATE TYPE public.batch_status AS ENUM (
  'ACTIVE',
  'HURRY_UP',
  'URGENT_SALE',
  'EXPIRED'
);

CREATE TYPE public.notification_channel AS ENUM (
  'EMAIL',
  'TELEGRAM',
  'SMS',
  'WEB_PUSH'
);

CREATE TYPE public.notification_trigger AS ENUM (
  'HURRY_UP',
  'URGENT_SALE',
  'EXPIRED'
);

CREATE TYPE public.notification_status AS ENUM (
  'PENDING',
  'SENT',
  'FAILED',
  'SKIPPED'
);

-- =============================================================
-- TABLE: products
-- =============================================================

CREATE TABLE public.products (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode          TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  description      TEXT,
  shelf_life_days  INTEGER     NOT NULL,
  category         TEXT,
  supplier         TEXT,
  default_location TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT products_barcode_unique      UNIQUE (barcode),
  CONSTRAINT products_shelf_life_positive CHECK (shelf_life_days > 0)
);

CREATE INDEX idx_products_barcode   ON public.products (barcode);
CREATE INDEX idx_products_category  ON public.products (category) WHERE category IS NOT NULL;
CREATE INDEX idx_products_is_active ON public.products (is_active);

COMMENT ON TABLE  public.products                 IS 'Справочник товаров';
COMMENT ON COLUMN public.products.barcode         IS 'EAN-13 или UPC — уникальный код товара';
COMMENT ON COLUMN public.products.shelf_life_days IS 'Срок годности в днях';

-- =============================================================
-- TABLE: category_thresholds
-- Одна строка — настройки порогов категоризации.
-- =============================================================

CREATE TABLE public.category_thresholds (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  hurry_up_percent     NUMERIC(5,2) NOT NULL DEFAULT 30.0,
  hurry_up_days_min    INTEGER      NOT NULL DEFAULT 7,
  urgent_sale_percent  NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  urgent_sale_days_min INTEGER      NOT NULL DEFAULT 3,
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_by           UUID         REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT thresholds_hurry_up_percent_valid    CHECK (hurry_up_percent   BETWEEN 0 AND 100),
  CONSTRAINT thresholds_urgent_sale_percent_valid CHECK (urgent_sale_percent BETWEEN 0 AND 100),
  CONSTRAINT thresholds_hurry_gt_urgent           CHECK (hurry_up_percent > urgent_sale_percent),
  CONSTRAINT thresholds_hurry_days_positive       CHECK (hurry_up_days_min > 0),
  CONSTRAINT thresholds_urgent_days_positive      CHECK (urgent_sale_days_min > 0)
);

INSERT INTO public.category_thresholds (id)
VALUES ('00000000-0000-0000-0000-000000000001');

COMMENT ON TABLE public.category_thresholds IS 'Настройки порогов категоризации (одна строка)';

-- =============================================================
-- TABLE: batches
-- =============================================================

CREATE TABLE public.batches (
  id                         UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id                 UUID                NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  batch_number               TEXT,
  production_date            DATE                NOT NULL,
  expiration_date_calculated DATE                NOT NULL,
  expiration_date_scanned    DATE,
  expiration_date_effective  DATE                NOT NULL,
  quantity                   INTEGER             NOT NULL DEFAULT 0,
  location                   TEXT,
  notes                      TEXT,
  current_status             public.batch_status NOT NULL DEFAULT 'ACTIVE',
  previous_status            public.batch_status,
  is_blocked                 BOOLEAN             NOT NULL DEFAULT false,
  created_by                 UUID                REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at                 TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ         NOT NULL DEFAULT now(),

  CONSTRAINT batches_quantity_non_negative      CHECK (quantity >= 0),
  CONSTRAINT batches_expiry_after_production    CHECK (expiration_date_effective > production_date),
  CONSTRAINT batches_calculated_after_production CHECK (expiration_date_calculated > production_date)
);

CREATE INDEX idx_batches_product_id     ON public.batches (product_id);
CREATE INDEX idx_batches_current_status ON public.batches (current_status);
CREATE INDEX idx_batches_expiration     ON public.batches (expiration_date_effective);
CREATE INDEX idx_batches_status_expiry  ON public.batches (current_status, expiration_date_effective);
CREATE INDEX idx_batches_is_blocked     ON public.batches (is_blocked) WHERE is_blocked = true;
CREATE INDEX idx_batches_created_at     ON public.batches (created_at DESC);

COMMENT ON COLUMN public.batches.expiration_date_calculated IS 'production_date + product.shelf_life_days';
COMMENT ON COLUMN public.batches.expiration_date_scanned    IS 'Дата из GS1-128 штрихкода';
COMMENT ON COLUMN public.batches.expiration_date_effective  IS 'Рабочая дата — выбирается оператором';
COMMENT ON COLUMN public.batches.is_blocked                 IS 'true когда EXPIRED — блокирует редактирование';

-- =============================================================
-- TABLE: user_profiles
-- =============================================================

CREATE TABLE public.user_profiles (
  id                    UUID            PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name             TEXT,
  phone                 TEXT,
  telegram_id           TEXT,
  telegram_username     TEXT,
  role                  public.user_role NOT NULL DEFAULT 'OPERATOR',
  notification_settings JSONB           NOT NULL DEFAULT '{
    "channels": {
      "email": true,
      "telegram": false,
      "sms": false,
      "web_push": true
    },
    "triggers": {
      "HURRY_UP": true,
      "URGENT_SALE": true,
      "EXPIRED": true
    }
  }'::jsonb,
  push_subscription JSONB,
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_role        ON public.user_profiles (role);
CREATE INDEX idx_user_profiles_telegram_id ON public.user_profiles (telegram_id)
  WHERE telegram_id IS NOT NULL;

-- =============================================================
-- TABLE: batch_status_history
-- =============================================================

CREATE TABLE public.batch_status_history (
  id          UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id    UUID                NOT NULL REFERENCES public.batches (id) ON DELETE CASCADE,
  from_status public.batch_status,
  to_status   public.batch_status NOT NULL,
  changed_at  TIMESTAMPTZ         NOT NULL DEFAULT now(),
  changed_by  TEXT                NOT NULL DEFAULT 'SYSTEM'
);

CREATE INDEX idx_batch_status_history_batch_id   ON public.batch_status_history (batch_id);
CREATE INDEX idx_batch_status_history_changed_at ON public.batch_status_history (changed_at DESC);

-- =============================================================
-- TABLE: notification_log
-- =============================================================

CREATE TABLE public.notification_log (
  id            UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID                        NOT NULL REFERENCES public.batches (id) ON DELETE CASCADE,
  trigger       public.notification_trigger NOT NULL,
  channel       public.notification_channel NOT NULL,
  recipient_id  UUID                        REFERENCES public.user_profiles (id) ON DELETE SET NULL,
  recipient_ref TEXT                        NOT NULL,
  status        public.notification_status  NOT NULL DEFAULT 'PENDING',
  error_message TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ                 NOT NULL DEFAULT now(),

  CONSTRAINT uq_notification_idempotency
    UNIQUE (batch_id, trigger, channel, recipient_id)
);

CREATE INDEX idx_notification_log_batch_id   ON public.notification_log (batch_id);
CREATE INDEX idx_notification_log_status     ON public.notification_log (status)
  WHERE status = 'PENDING';
CREATE INDEX idx_notification_log_created_at ON public.notification_log (created_at DESC);

-- =============================================================
-- FUNCTIONS
-- =============================================================

-- Комбинированный расчёт статуса партии
CREATE OR REPLACE FUNCTION public.calculate_batch_status(
  p_expiration_date      DATE,
  p_production_date      DATE,
  p_hurry_up_percent     NUMERIC,
  p_hurry_up_days_min    INTEGER,
  p_urgent_sale_percent  NUMERIC,
  p_urgent_sale_days_min INTEGER
)
RETURNS public.batch_status
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_total_days INTEGER;
  v_days_left  INTEGER;
  v_percent    NUMERIC;
BEGIN
  v_days_left  := p_expiration_date - CURRENT_DATE;
  v_total_days := p_expiration_date - p_production_date;

  IF v_days_left <= 0 THEN
    RETURN 'EXPIRED';
  END IF;

  IF v_total_days <= 0 THEN
    RETURN 'EXPIRED';
  END IF;

  v_percent := (v_days_left::NUMERIC / v_total_days) * 100;

  IF v_percent < p_urgent_sale_percent OR v_days_left <= p_urgent_sale_days_min THEN
    RETURN 'URGENT_SALE';
  END IF;

  IF v_percent < p_hurry_up_percent OR v_days_left <= p_hurry_up_days_min THEN
    RETURN 'HURRY_UP';
  END IF;

  RETURN 'ACTIVE';
END;
$$;

-- Универсальный триггер updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Триггер BEFORE INSERT на batches
CREATE OR REPLACE FUNCTION public.trg_fn_batch_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_shelf_life_days INTEGER;
  v_status          public.batch_status;
  v_hurry_up_percent     NUMERIC;
  v_hurry_up_days_min    INTEGER;
  v_urgent_sale_percent  NUMERIC;
  v_urgent_sale_days_min INTEGER;
BEGIN
  SELECT shelf_life_days INTO v_shelf_life_days
  FROM public.products WHERE id = NEW.product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product with id % not found', NEW.product_id;
  END IF;

  NEW.expiration_date_calculated := NEW.production_date + v_shelf_life_days;

  IF NEW.expiration_date_effective IS NULL THEN
    NEW.expiration_date_effective := NEW.expiration_date_calculated;
  END IF;

  SELECT
    hurry_up_percent, hurry_up_days_min,
    urgent_sale_percent, urgent_sale_days_min
  INTO
    v_hurry_up_percent, v_hurry_up_days_min,
    v_urgent_sale_percent, v_urgent_sale_days_min
  FROM public.category_thresholds LIMIT 1;

  v_status := public.calculate_batch_status(
    NEW.expiration_date_effective,
    NEW.production_date,
    v_hurry_up_percent,
    v_hurry_up_days_min,
    v_urgent_sale_percent,
    v_urgent_sale_days_min
  );

  NEW.current_status  := v_status;
  NEW.previous_status := NULL;
  NEW.is_blocked      := (v_status = 'EXPIRED');

  RETURN NEW;
END;
$$;

-- Триггер AFTER INSERT на batches — пишет историю
CREATE OR REPLACE FUNCTION public.trg_fn_batch_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.batch_status_history (batch_id, from_status, to_status, changed_by)
  VALUES (NEW.id, NULL, NEW.current_status, COALESCE(NEW.created_by::TEXT, 'SYSTEM'));
  RETURN NULL;
END;
$$;

-- Триггер BEFORE UPDATE на batches — фиксирует смену статуса
CREATE OR REPLACE FUNCTION public.trg_fn_batch_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    INSERT INTO public.batch_status_history (batch_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.current_status, NEW.current_status, 'SYSTEM');

    NEW.previous_status := OLD.current_status;
    NEW.is_blocked       := (NEW.current_status = 'EXPIRED');
  END IF;
  RETURN NEW;
END;
$$;

-- Auto-create user_profile при регистрации
CREATE OR REPLACE FUNCTION public.trg_fn_create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- =============================================================
-- TRIGGERS
-- =============================================================

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_category_thresholds_updated_at
  BEFORE UPDATE ON public.category_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_batch_before_insert
  BEFORE INSERT ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_batch_before_insert();

CREATE TRIGGER trg_batch_after_insert
  AFTER INSERT ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_batch_after_insert();

CREATE TRIGGER trg_batch_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_batch_status_change
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_batch_status_change();

CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_create_user_profile();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_thresholds  ENABLE ROW LEVEL SECURITY;

-- Helper: роль текущего пользователя
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- products
CREATE POLICY "products_select_authenticated" ON public.products
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "products_select_admin_all" ON public.products
  FOR SELECT TO authenticated USING (public.current_user_role() = 'ADMIN');

CREATE POLICY "products_write_manager" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "products_update_manager" ON public.products
  FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('ADMIN', 'MANAGER'));

-- batches
CREATE POLICY "batches_select_authenticated" ON public.batches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "batches_insert_operator" ON public.batches
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('ADMIN', 'MANAGER', 'OPERATOR'));

CREATE POLICY "batches_update_operator" ON public.batches
  FOR UPDATE TO authenticated
  USING (is_blocked = false OR public.current_user_role() = 'ADMIN');

CREATE POLICY "batches_delete_admin" ON public.batches
  FOR DELETE TO authenticated
  USING (public.current_user_role() = 'ADMIN');

-- user_profiles
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "user_profiles_select_admin" ON public.user_profiles
  FOR SELECT TO authenticated USING (public.current_user_role() = 'ADMIN');

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update_admin" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (public.current_user_role() = 'ADMIN');

-- notification_log
CREATE POLICY "notification_log_select_manager" ON public.notification_log
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('ADMIN', 'MANAGER'));

-- batch_status_history
CREATE POLICY "batch_status_history_select_manager" ON public.batch_status_history
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('ADMIN', 'MANAGER'));

-- category_thresholds
CREATE POLICY "thresholds_select_manager" ON public.category_thresholds
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "thresholds_update_admin" ON public.category_thresholds
  FOR UPDATE TO authenticated
  USING (public.current_user_role() = 'ADMIN')
  WITH CHECK (public.current_user_role() = 'ADMIN');

-- =============================================================
-- SEED: справочник товаров для разработки
-- =============================================================

INSERT INTO public.products (id, barcode, name, category, shelf_life_days, supplier, default_location) VALUES
  ('11111111-0000-0000-0000-000000000001', '4600000000001', 'Молоко 3.2%',        'Молочные',      14,  'ООО Молоко',    'Холодильник A1'),
  ('11111111-0000-0000-0000-000000000002', '4600000000002', 'Йогурт клубничный',  'Молочные',      21,  'ООО Молоко',    'Холодильник A2'),
  ('11111111-0000-0000-0000-000000000003', '4600000000003', 'Хлеб белый',         'Хлебобулочные',  5,  'Хлебзавод №3', 'Стеллаж B1'),
  ('11111111-0000-0000-0000-000000000004', '4600000000004', 'Сыр Гауда',          'Молочные',      90,  'Cheese Corp',   'Холодильник A3'),
  ('11111111-0000-0000-0000-000000000005', '4600000000005', 'Сок апельсиновый',   'Напитки',      180,  'Juicy Ltd',     'Склад C1'),
  ('11111111-0000-0000-0000-000000000006', '4600000000006', 'Колбаса докторская', 'Мясные',        30,  'МясоПром',      'Холодильник A4'),
  ('11111111-0000-0000-0000-000000000007', '4600000000007', 'Творог 5%',          'Молочные',      10,  'ООО Молоко',    'Холодильник A1'),
  ('11111111-0000-0000-0000-000000000008', '4600000000008', 'Масло сливочное',    'Молочные',      60,  'ООО Молоко',    'Холодильник A5'),
  ('11111111-0000-0000-0000-000000000009', '4600000000009', 'Кефир 1%',           'Молочные',      14,  'ООО Молоко',    'Холодильник A1'),
  ('11111111-0000-0000-0000-000000000010', '4600000000010', 'Консервы рыбные',    'Консервы',     730,  'РыбПром',       'Склад D1');
