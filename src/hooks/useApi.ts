import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI, donationAPI, requestAPI, userAPI } from '../services/api';

// ========================
// Generic Fetch Hook
// ========================
interface UseApiResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: { total: number; page: number; pages: number; limit: number } | null;
  refetch: () => void;
}

function useApiData<T>(
  fetchFn: () => Promise<any>,
  deps: any[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseApiResult<T>['pagination']>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFn()
      .then((res) => {
        if (cancelled) return;
        setData(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err.response?.data?.message || err.message || 'An error occurred';
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, ...deps]);

  return { data, loading, error, pagination, refetch };
}

// ========================
// Inventory Hook
// ========================
export function useInventory(params?: {
  bloodGroup?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useApiData(() => inventoryAPI.getAll({ limit: 50, ...params }), [
    params?.bloodGroup,
    params?.status,
    params?.page,
  ]);
}

// ========================
// Donations Hook
// ========================
export function useDonations(params?: {
  bloodGroup?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useApiData(() => donationAPI.getAll({ limit: 50, ...params }), [
    params?.bloodGroup,
    params?.status,
    params?.page,
  ]);
}

// ========================
// Requests Hook
// ========================
export function useRequests(params?: {
  bloodGroup?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) {
  return useApiData(() => requestAPI.getAll({ limit: 50, ...params }), [
    params?.bloodGroup,
    params?.status,
    params?.priority,
    params?.page,
  ]);
}

// ========================
// Donors (Users) Hook
// ========================
export function useDonors(params?: {
  role?: string;
  bloodGroup?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useApiData(
    () => userAPI.getAll({ role: 'donor', limit: 50, ...params }),
    [params?.bloodGroup, params?.search, params?.page]
  );
}

// ========================
// All Users Hook
// ========================
export function useUsers(params?: {
  role?: string;
  bloodGroup?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useApiData(() => userAPI.getAll({ limit: 50, ...params }), [
    params?.role,
    params?.bloodGroup,
    params?.search,
    params?.page,
  ]);
}
