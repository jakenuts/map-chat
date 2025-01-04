import { useCallback, useEffect, useRef } from 'react';
import { CacheService, CacheConfig } from '../services/cache';
import { GeoJSONFeature } from '../types';
import { logMessage } from '../utils/logging';

interface UseMapCacheProps {
  config?: Partial<CacheConfig>;
  onCacheHit?: (key: string) => void;
  onCacheMiss?: (key: string) => void;
}

export const useMapCache = ({
  config,
  onCacheHit,
  onCacheMiss
}: UseMapCacheProps = {}) => {
  const cacheRef = useRef<CacheService>(new CacheService(config));

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cacheRef.current.dispose();
    };
  }, []);

  const generateKey = useCallback((type: string, params: Record<string, any>): string => {
    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
      .join(',');
    return `${type}(${sortedParams})`;
  }, []);

  const cacheFeatures = useCallback((
    key: string,
    features: GeoJSONFeature[],
    ttl?: number
  ): void => {
    try {
      cacheRef.current.set(key, features, ttl);
      logMessage('map_command', { 
        type: 'features_cached',
        key,
        count: features.length
      });
    } catch (error) {
      logMessage('error', {
        type: 'feature_cache_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        key
      });
    }
  }, []);

  const getCachedFeatures = useCallback((key: string): GeoJSONFeature[] | null => {
    try {
      const features = cacheRef.current.get<GeoJSONFeature[]>(key);
      if (features) {
        onCacheHit?.(key);
        logMessage('map_command', { 
          type: 'features_cache_hit',
          key,
          count: features.length
        });
      } else {
        onCacheMiss?.(key);
        logMessage('map_command', { 
          type: 'features_cache_miss',
          key
        });
      }
      return features;
    } catch (error) {
      logMessage('error', {
        type: 'feature_cache_get_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        key
      });
      return null;
    }
  }, [onCacheHit, onCacheMiss]);

  const invalidateCache = useCallback((pattern?: RegExp): void => {
    try {
      cacheRef.current.clear(pattern);
      logMessage('map_command', { 
        type: 'cache_invalidated',
        pattern: pattern?.toString()
      });
    } catch (error) {
      logMessage('error', {
        type: 'cache_invalidation_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        pattern: pattern?.toString()
      });
    }
  }, []);

  const getCacheStats = useCallback(() => {
    try {
      return cacheRef.current.getStats();
    } catch (error) {
      logMessage('error', {
        type: 'cache_stats_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }, []);

  // Cache operation wrappers
  const withCache = useCallback(<T extends any[]>(
    operation: (...args: T) => GeoJSONFeature[],
    keyGenerator: (...args: T) => string,
    ttl?: number
  ) => {
    return (...args: T): GeoJSONFeature[] => {
      const key = keyGenerator(...args);
      const cached = getCachedFeatures(key);
      if (cached) return cached;

      const result = operation(...args);
      cacheFeatures(key, result, ttl);
      return result;
    };
  }, [cacheFeatures, getCachedFeatures]);

  const withAsyncCache = useCallback(<T extends any[]>(
    operation: (...args: T) => Promise<GeoJSONFeature[]>,
    keyGenerator: (...args: T) => string,
    ttl?: number
  ) => {
    return async (...args: T): Promise<GeoJSONFeature[]> => {
      const key = keyGenerator(...args);
      const cached = getCachedFeatures(key);
      if (cached) return cached;

      const result = await operation(...args);
      cacheFeatures(key, result, ttl);
      return result;
    };
  }, [cacheFeatures, getCachedFeatures]);

  return {
    generateKey,
    cacheFeatures,
    getCachedFeatures,
    invalidateCache,
    getCacheStats,
    withCache,
    withAsyncCache
  };
};
