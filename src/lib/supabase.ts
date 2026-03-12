// =============================================================
// FreshTrack — Supabase Client
// =============================================================

import { createClient } from '@supabase/supabase-js';
import type {
  Product,
  ProductInsert,
  Batch,
  BatchInsert,
  BatchUpdate,
  BatchWithProduct,
  UserProfile,
  UserProfileUpdate,
  CategoryThresholds,
  CategoryThresholdsUpdate,
  NotificationLog,
  DashboardStats,
  BatchFilters,
  ProductFilters,
  NotificationLogFilters,
  PaginatedResponse,
} from '../types/database';

// ------------------------------------------------------------
// Database type definition
// ------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: Partial<ProductInsert>;
      };
      batches: {
        Row: Batch;
        Insert: BatchInsert;
        Update: BatchUpdate;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: UserProfileUpdate;
      };
      category_thresholds: {
        Row: CategoryThresholds;
        Insert: never;
        Update: CategoryThresholdsUpdate;
      };
      notification_log: {
        Row: NotificationLog;
        Insert: Omit<NotificationLog, 'id' | 'created_at'>;
        Update: Pick<NotificationLog, 'status' | 'error_message' | 'sent_at'>;
      };
    };
  };
};

// ------------------------------------------------------------
// Client — данные подтягиваются из .env
// ------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[FreshTrack] Не заданы VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY в .env'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// ------------------------------------------------------------
// Auth
// ------------------------------------------------------------

export const auth = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (
    callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
  ) => supabase.auth.onAuthStateChange(callback),
};

// ------------------------------------------------------------
// Products API
// ------------------------------------------------------------

export const productsApi = {
  getAll: async (filters?: ProductFilters): Promise<Product[]> => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', filters?.is_active ?? true)
      .order('name');

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.supplier)  query = query.eq('supplier', filters.supplier);
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  getByBarcode: async (barcode: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode.trim())
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  create: async (product: ProductInsert): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getCategories: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null);

    if (error) throw error;
    const categories = [
      ...new Set(
        data?.map((r) => r.category).filter(Boolean) as string[]
      ),
    ];
    return categories.sort();
  },
};

// ------------------------------------------------------------
// Batches API
// ------------------------------------------------------------

export const batchesApi = {
  getAll: async (
    filters?: BatchFilters,
    page = 0,
    pageSize = 50
  ): Promise<PaginatedResponse<BatchWithProduct>> => {
    let query = supabase
      .from('batches')
      .select('*, product:products(*)', { count: 'exact' })
      .order('expiration_date_effective', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (filters?.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      query = query.in('current_status', statuses);
    }
    if (filters?.product_id)  query = query.eq('product_id', filters.product_id);
    if (filters?.location)    query = query.ilike('location', `%${filters.location}%`);
    if (filters?.is_blocked !== undefined)
      query = query.eq('is_blocked', filters.is_blocked);
    if (filters?.expiry_before)
      query = query.lte('expiration_date_effective', filters.expiry_before);
    if (filters?.expiry_after)
      query = query.gte('expiration_date_effective', filters.expiry_after);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data as BatchWithProduct[]) ?? [],
      count: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  getByProductId: async (productId: string): Promise<BatchWithProduct[]> => {
    const { data, error } = await supabase
      .from('batches')
      .select('*, product:products(*)')
      .eq('product_id', productId)
      .order('expiration_date_effective', { ascending: true });

    if (error) throw error;
    return (data as BatchWithProduct[]) ?? [];
  },

  getById: async (id: string): Promise<BatchWithProduct | null> => {
    const { data, error } = await supabase
      .from('batches')
      .select('*, product:products(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as BatchWithProduct | null;
  },

  create: async (batch: BatchInsert): Promise<BatchWithProduct> => {
    const { data, error } = await supabase
      .from('batches')
      .insert(batch)
      .select('*, product:products(*)')
      .single();

    if (error) throw error;
    return data as BatchWithProduct;
  },

  update: async (id: string, updates: BatchUpdate): Promise<BatchWithProduct> => {
    const { data, error } = await supabase
      .from('batches')
      .update(updates)
      .eq('id', id)
      .select('*, product:products(*)')
      .single();

    if (error) throw error;
    return data as BatchWithProduct;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data, error } = await supabase
      .from('batches')
      .select('current_status, is_blocked')
      .gt('quantity', 0);

    if (error) throw error;

    const rows = data ?? [];
    return {
      total:       rows.length,
      active:      rows.filter((r) => r.current_status === 'ACTIVE').length,
      hurry_up:    rows.filter((r) => r.current_status === 'HURRY_UP').length,
      urgent_sale: rows.filter((r) => r.current_status === 'URGENT_SALE').length,
      expired:     rows.filter((r) => r.current_status === 'EXPIRED').length,
      blocked:     rows.filter((r) => r.is_blocked).length,
    };
  },
};

// ------------------------------------------------------------
// Realtime
// ------------------------------------------------------------

export const realtimeApi = {
  subscribeToBatchStatusChanges: (
    onStatusChange: (payload: { new: Batch; old: Partial<Batch> }) => void
  ) => {
    const channel = supabase
      .channel('batch-status-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'batches' },
        (payload) =>
          onStatusChange({
            new: payload.new as Batch,
            old: payload.old as Partial<Batch>,
          })
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  subscribeToNewBatches: (onNewBatch: (batch: Batch) => void) => {
    const channel = supabase
      .channel('new-batches')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'batches' },
        (payload) => onNewBatch(payload.new as Batch)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};

// ------------------------------------------------------------
// Profile API
// ------------------------------------------------------------

export const profileApi = {
  getCurrent: async (): Promise<UserProfile | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  update: async (updates: UserProfileUpdate): Promise<UserProfile> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ------------------------------------------------------------
// Thresholds API
// ------------------------------------------------------------

export const thresholdsApi = {
  get: async (): Promise<CategoryThresholds> => {
    const { data, error } = await supabase
      .from('category_thresholds')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  update: async (
    updates: CategoryThresholdsUpdate
  ): Promise<CategoryThresholds> => {
    const { data, error } = await supabase
      .from('category_thresholds')
      .update(updates)
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ------------------------------------------------------------
// Notification Log API
// ------------------------------------------------------------

export const notificationLogApi = {
  getAll: async (
    filters?: NotificationLogFilters,
    page = 0,
    pageSize = 50
  ): Promise<PaginatedResponse<NotificationLog>> => {
    let query = supabase
      .from('notification_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (filters?.batch_id)  query = query.eq('batch_id', filters.batch_id);
    if (filters?.trigger)   query = query.eq('trigger', filters.trigger);
    if (filters?.channel)   query = query.eq('channel', filters.channel);
    if (filters?.status)    query = query.eq('status', filters.status);
    if (filters?.date_from) query = query.gte('created_at', filters.date_from);
    if (filters?.date_to)   query = query.lte('created_at', filters.date_to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data as NotificationLog[]) ?? [],
      count: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  },
};
