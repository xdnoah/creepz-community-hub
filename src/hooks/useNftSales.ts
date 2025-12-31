import { useState, useEffect, useCallback } from 'react';
import { fetchCreepzSales } from '../lib/reservoir';
import type { NftSale } from '../types';

export function useNftSales(autoRefresh = false) {
  const [sales, setSales] = useState<NftSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCreepzSales();
      setSales(data);
    } catch (err: any) {
      console.error('Error loading sales:', err);
      setError(err.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();

    if (autoRefresh) {
      const interval = setInterval(loadSales, 60000); // Refresh every 60 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadSales]);

  return {
    sales,
    loading,
    error,
    refresh: loadSales,
  };
}
