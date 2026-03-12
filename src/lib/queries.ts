// =============================================================
// FreshTrack — React Query Hooks
// Типизированные хуки для работы с Supabase.
// Заменяют прямые вызовы из mock-data.ts
// =============================================================

import { useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  productsApi,
  batchesApi,
  profileApi,
  thresholdsApi,
  notificationLogApi,
  realtimeApi,
} from './supabase';
import type {
  Product,
  ProductInsert,
  ProductFilters,
  Batch,
  BatchInsert,
  BatchUpdate,
  BatchWithProduct,
  BatchFilters,
  UserProfile,
  UserProfileUpdate,
  CategoryThresholds,
  CategoryThresholdsUpdate,
  NotificationLog,
  NotificationLogFilters,
  DashboardStats,
  PaginatedResponse,
} from '../types/database';

// ------------------------------------------------------------
// Query Keys — централизованные ключи для инвалидации кеша
// ------------------------------------------------------------

export const queryKeys = {
  products: {
    all:       () => ['products'] as const,
    filtered:  (f: ProductFilters) => ['products', f] as const,
    byBarcode: (b: string) => ['products', 'barcode', b] as const,
    categories: () => ['products', 'categories'] as const,
  },
  batches: {
    all:       () => ['batches'] as const,
    filtered:  (f: BatchFilters, page: number) => ['batches', f, page] as const,
    byProduct: (id: string) => ['batches', 'product', id] as const,
    byId:      (id: string) => ['batches', 'id', id] as const,
    stats:     () => ['batches', 'stats'] as const,
  },
  profile: {
    current: () => ['profile', 'current'] as const,
  },
  thresholds: {
    current: () => ['thresholds'] as const,
  },
  notifications: {
    all:      () => ['notifications'] as const,
    filtered: (f: NotificationLogFilters, page: number) => ['notifications', f, page] as const,
  },
} as const;

// ------------------------------------------------------------
// Products Hooks
// ------------------------------------------------------------

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products.filtered(filters ?? {}),
    queryFn:  () => productsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // продукты меняются редко — кешируем 5 мин
  });
}

export function useProductByBarcode(
  barcode: string | null,
  options?: Omit<UseQueryOptions<Product | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.products.byBarcode(barcode ?? ''),
    queryFn:  () => productsApi.getByBarcode(barcode!),
    enabled:  !!barcode && barcode.length > 0,
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: queryKeys.products.categories(),
    queryFn:  productsApi.getCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: ProductInsert) => productsApi.create(product),
    onSuccess: () => {
      // Инвалидируем все запросы продуктов
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.categories() });
    },
  });
}

// ------------------------------------------------------------
// Batches Hooks
// ------------------------------------------------------------

export function useBatches(filters?: BatchFilters, page = 0, pageSize = 50) {
  return useQuery({
    queryKey: queryKeys.batches.filtered(filters ?? {}, page),
    queryFn:  () => batchesApi.getAll(filters, page, pageSize),
    staleTime: 30 * 1000, // партии меняются чаще — 30 секунд
  });
}

export function useBatchesByProduct(productId: string | null) {
  return useQuery({
    queryKey: queryKeys.batches.byProduct(productId ?? ''),
    queryFn:  () => batchesApi.getByProductId(productId!),
    enabled:  !!productId,
    staleTime: 30 * 1000,
  });
}

export function useBatchById(id: string | null) {
  return useQuery({
    queryKey: queryKeys.batches.byId(id ?? ''),
    queryFn:  () => batchesApi.getById(id!),
    enabled:  !!id,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.batches.stats(),
    queryFn:  batchesApi.getDashboardStats,
    staleTime: 60 * 1000,
    // Refetch каждую минуту — дашборд должен быть актуальным
    refetchInterval: 60 * 1000,
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batch: BatchInsert) => batchesApi.create(batch),
    onSuccess: (newBatch) => {
      // Инвалидируем списки и статистику
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.stats() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.byProduct(newBatch.product_id)
      });
    },
  });
}

export function useUpdateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: BatchUpdate }) =>
      batchesApi.update(id, updates),
    onSuccess: (updatedBatch) => {
      // Точечное обновление в кеше — без полного рефетча
      queryClient.setQueryData<BatchWithProduct>(
        queryKeys.batches.byId(updatedBatch.id),
        updatedBatch
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.stats() });
    },
  });
}

// ------------------------------------------------------------
// Realtime Hook
// Подписывается на изменения статусов партий и инвалидирует кеш.
// Подключать в корневом компоненте (App.tsx) один раз.
// ------------------------------------------------------------

export function useBatchStatusRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribeStatus = realtimeApi.subscribeToBatchStatusChanges(({ new: updatedBatch }) => {
      // Инвалидируем все запросы партий и статистику
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.stats() });

      // Точечное обновление конкретной партии если она в кеше
      queryClient.setQueryData<BatchWithProduct>(
        queryKeys.batches.byId(updatedBatch.id),
        (old) => old ? { ...old, ...updatedBatch } : undefined
      );
    });

    const unsubscribeNew = realtimeApi.subscribeToNewBatches(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.stats() });
    });

    return () => {
      unsubscribeStatus();
      unsubscribeNew();
    };
  }, [queryClient]);
}

// ------------------------------------------------------------
// Profile Hook
// ------------------------------------------------------------

export function useCurrentProfile() {
  return useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn:  profileApi.getCurrent,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: UserProfileUpdate) => profileApi.update(updates),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData<UserProfile>(
        queryKeys.profile.current(),
        updatedProfile
      );
    },
  });
}

// ------------------------------------------------------------
// Thresholds Hook
// ------------------------------------------------------------

export function useCategoryThresholds() {
  return useQuery({
    queryKey: queryKeys.thresholds.current(),
    queryFn:  thresholdsApi.get,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateThresholds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: CategoryThresholdsUpdate) => thresholdsApi.update(updates),
    onSuccess: (updated) => {
      queryClient.setQueryData<CategoryThresholds>(
        queryKeys.thresholds.current(),
        updated
      );
      // После изменения порогов — нужно пересчитать статистику дашборда
      // (cron пересчитает в БД, но UI может показывать устаревшее)
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.stats() });
    },
  });
}

// ------------------------------------------------------------
// Notification Log Hooks
// ------------------------------------------------------------

export function useNotificationLog(filters?: NotificationLogFilters, page = 0) {
  return useQuery({
    queryKey: queryKeys.notifications.filtered(filters ?? {}, page),
    queryFn:  () => notificationLogApi.getAll(filters, page),
    staleTime: 30 * 1000,
  });
}
