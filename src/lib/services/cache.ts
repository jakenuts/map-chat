import { logMessage } from '../utils/logging';

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
  invalidationRules?: {
    onEdit?: boolean;
    onZoom?: boolean;
    onPan?: boolean;
  };
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccess: number;
}

const DEFAULT_CONFIG: Required<CacheConfig> = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  cleanupInterval: 60 * 1000, // 1 minute
  invalidationRules: {
    onEdit: true,
    onZoom: true,
    onPan: false
  }
};

export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private config: Required<CacheConfig>;
  private cleanupTimer: ReturnType<typeof setInterval> | null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    this.cleanupTimer = null;
    this.startCleanup();
  }

  private startCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup() {
    try {
      const now = Date.now();
      let expiredCount = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (this.isExpired(entry, now)) {
          this.cache.delete(key);
          expiredCount++;
        }
      }

      // If cache is still too large, remove least recently used entries
      if (this.cache.size > this.config.maxSize) {
        const entries = Array.from(this.cache.entries())
          .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

        const toRemove = this.cache.size - this.config.maxSize;
        entries.slice(0, toRemove).forEach(([key]) => {
          this.cache.delete(key);
        });
      }

      logMessage('map_command', {
        type: 'cache_cleanup',
        expiredCount,
        remainingSize: this.cache.size
      });
    } catch (error) {
      logMessage('error', {
        type: 'cache_cleanup_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private isExpired(entry: CacheEntry<any>, now = Date.now()): boolean {
    return now - entry.timestamp > entry.ttl;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    try {
      // Clean up if cache is full
      if (this.cache.size >= this.config.maxSize) {
        this.cleanup();
      }

      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL,
        hits: 0,
        lastAccess: Date.now()
      };

      this.cache.set(key, entry);
      logMessage('map_command', { 
        type: 'cache_set',
        key,
        ttl: entry.ttl
      });
    } catch (error) {
      logMessage('error', {
        type: 'cache_set_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        key
      });
    }
  }

  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key) as CacheEntry<T>;
      if (!entry || this.isExpired(entry)) {
        if (entry) {
          this.cache.delete(key);
          logMessage('map_command', { 
            type: 'cache_expired',
            key
          });
        }
        return null;
      }

      entry.hits++;
      entry.lastAccess = Date.now();
      logMessage('map_command', { 
        type: 'cache_hit',
        key,
        hits: entry.hits
      });

      return entry.value;
    } catch (error) {
      logMessage('error', {
        type: 'cache_get_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        key
      });
      return null;
    }
  }

  clear(pattern?: RegExp): void {
    try {
      if (pattern) {
        let count = 0;
        for (const key of this.cache.keys()) {
          if (pattern.test(key)) {
            this.cache.delete(key);
            count++;
          }
        }
        logMessage('map_command', { 
          type: 'cache_clear_pattern',
          pattern: pattern.toString(),
          count
        });
      } else {
        const size = this.cache.size;
        this.cache.clear();
        logMessage('map_command', { 
          type: 'cache_clear_all',
          count: size
        });
      }
    } catch (error) {
      logMessage('error', {
        type: 'cache_clear_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        pattern: pattern?.toString()
      });
    }
  }

  getStats(): {
    size: number;
    hitRate: number;
    averageHits: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    try {
      const entries = Array.from(this.cache.values());
      const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
      const timestamps = entries.map(entry => entry.timestamp);

      const stats = {
        size: this.cache.size,
        hitRate: totalHits / Math.max(1, entries.length),
        averageHits: entries.length > 0 ? totalHits / entries.length : 0,
        oldestEntry: Math.min(...timestamps),
        newestEntry: Math.max(...timestamps)
      };

      logMessage('map_command', { 
        type: 'cache_stats',
        stats
      });

      return stats;
    } catch (error) {
      logMessage('error', {
        type: 'cache_stats_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        size: 0,
        hitRate: 0,
        averageHits: 0,
        oldestEntry: 0,
        newestEntry: 0
      };
    }
  }

  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
    logMessage('map_command', { type: 'cache_disposed' });
  }
}
