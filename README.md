# FreshTrack — Подключение Supabase

## Быстрый старт

### 1. Клонировать репо и установить зависимости

```bash
git clone https://github.com/ВАШ_РЕПО.git freshtrack
cd freshtrack
npm install
npm install @supabase/supabase-js
```

### 2. Скопировать файлы из этого архива в проект

```
.env                          → корень проекта
src/lib/supabase.ts           → src/lib/
src/lib/queries.ts            → src/lib/
src/lib/date-utils.ts         → src/lib/
src/lib/validations.ts        → src/lib/
src/types/database.ts         → src/types/  (создать папку если нет)
```

### 3. Добавить .env в .gitignore

Убедиться что в `.gitignore` есть строка:
```
.env
```

### 4. Создать первого Admin пользователя

В Supabase Dashboard → Authentication → Users → Add user:
- Ввести email и пароль

После создания в SQL Editor:
```sql
UPDATE public.user_profiles
SET role = 'ADMIN'
WHERE id = 'UUID_ПОЛЬЗОВАТЕЛЯ';
```

### 5. Запустить

```bash
npm run dev
```

## Структура файлов

| Файл | Назначение |
|------|-----------|
| `src/lib/supabase.ts` | Supabase client + API методы |
| `src/lib/queries.ts` | React Query хуки |
| `src/lib/date-utils.ts` | Работа с датами, расчёт статусов, GS1 парсер |
| `src/lib/validations.ts` | Zod схемы для форм |
| `src/types/database.ts` | TypeScript типы из схемы БД |

## Использование в компонентах

```tsx
import { useBatches, useDashboardStats } from '@/lib/queries';

function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: batches } = useBatches({ status: 'URGENT_SALE' });
  // ...
}
```

## Realtime (добавить в App.tsx)

```tsx
import { useBatchStatusRealtime } from '@/lib/queries';

function AppWithRealtime() {
  useBatchStatusRealtime(); // подписка один раз на всё приложение
  return <AppLayout />;
}
```
