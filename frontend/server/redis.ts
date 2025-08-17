import { createClient } from 'redis';
import { getEnvironmentConfig } from './env';

let redisClient: any = null;
let redisAvailable = false;

// In-memory fallback cache
const memoryCache = new Map<string, any>();

// Initialize Redis client
export async function initRedis() {
  const config = getEnvironmentConfig();
  
  // Skip Redis initialization during build
  if (config.isBuild) {
    console.log('Skipping Redis initialization during build');
    return null;
  }
  
  try {
    redisClient = createClient({
      url: config.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: () => false // Don't auto-reconnect
      }
    });

    redisClient.on('error', (err: any) => {
      console.warn('Redis unavailable, using in-memory cache fallback');
      redisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis cache connected');
      redisAvailable = true;
    });

    await redisClient.connect();
    redisAvailable = true;
    return redisClient;
  } catch (error) {
    console.warn('Redis unavailable, using in-memory cache fallback');
    redisAvailable = false;
    return null;
  }
}

// Get cached response by item description
export async function getCachedResponse(itemDescription: string): Promise<any | null> {
  const cacheKey = `residual_analysis:${itemDescription.toLowerCase().trim()}`;
  
  // Use Redis if available
  if (redisAvailable && redisClient) {
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`Redis cache hit for item: ${itemDescription}`);
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.warn('Redis get error, falling back to memory cache:', error);
      redisAvailable = false;
    }
  }
  
  // Fallback to memory cache
  if (memoryCache.has(cacheKey)) {
    console.log(`Memory cache hit for item: ${itemDescription}`);
    return memoryCache.get(cacheKey);
  }
  
  console.log(`Cache miss for item: ${itemDescription}`);
  return null;
}

// Cache response by item description (indefinite storage)
export async function setCachedResponse(itemDescription: string, responseData: any): Promise<void> {
  const cacheKey = `residual_analysis:${itemDescription.toLowerCase().trim()}`;
  
  // Use Redis if available
  if (redisAvailable && redisClient) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(responseData));
      console.log(`Redis cached response for item: ${itemDescription}`);
    } catch (error) {
      console.warn('Redis set error, falling back to memory cache:', error);
      redisAvailable = false;
    }
  }
  
  // Always store in memory cache as backup
  memoryCache.set(cacheKey, responseData);
  console.log(`Memory cached response for item: ${itemDescription}`);
}

// Get cache statistics
export async function getCacheStats(): Promise<{ totalKeys: number; keys: string[]; source: string }> {
  let redisKeys: string[] = [];
  let memoryKeys: string[] = [];
  
  // Get Redis keys if available
  if (redisAvailable && redisClient) {
    try {
      redisKeys = await redisClient.keys('residual_analysis:*');
      redisKeys = redisKeys.map((key: string) => key.replace('residual_analysis:', ''));
    } catch (error) {
      console.warn('Redis stats error:', error);
    }
  }
  
  // Get memory cache keys
  memoryKeys = Array.from(memoryCache.keys()).map((key: string) => key.replace('residual_analysis:', ''));
  
  // Combine and deduplicate
  const allKeys = Array.from(new Set([...redisKeys, ...memoryKeys]));
  
  return {
    totalKeys: allKeys.length,
    keys: allKeys,
    source: redisAvailable ? 'Redis + Memory' : 'Memory Only'
  };
}

export { redisClient };