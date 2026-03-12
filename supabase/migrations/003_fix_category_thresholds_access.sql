-- =============================================================
-- FreshTrack — Fix Category Thresholds Access
-- Разрешаем всем аутентифицированным пользователям читать настройки порогов
-- =============================================================

-- Удаляем старую политику
DROP POLICY IF EXISTS "thresholds_select_manager" ON public.category_thresholds;

-- Создаем новую политику для всех аутентифицированных пользователей
CREATE POLICY "thresholds_select_authenticated" ON public.category_thresholds
  FOR SELECT TO authenticated
  USING (true);

-- Политика обновления остается только для админов
-- (уже существует: thresholds_update_admin)