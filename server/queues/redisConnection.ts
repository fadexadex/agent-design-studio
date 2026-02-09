/**
 * Redis Connection Singleton
 * 
 * Provides a centralized Redis connection for BullMQ queues and Redis Streams.
 * Supports Redis Cloud with username/password authentication.
 */

import Redis, { RedisOptions } from 'ioredis';

/**
 * Get Redis configuration from environment variables
 * Called lazily to ensure env vars are loaded
 */
function getEnvConfig() {
  return {
    REDIS_URL: process.env.REDIS_URL,
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    REDIS_USERNAME: process.env.REDIS_USERNAME || 'default',
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),
  };
}

// Singleton instances
let connection: Redis | null = null;
let subscriber: Redis | null = null;

/**
 * Get Redis connection options based on environment
 */
function getConnectionOptions(): RedisOptions {
  const env = getEnvConfig();
  
  const baseOptions: RedisOptions = {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: true,
    retryStrategy: (times: number) => {
      if (times > 10) {
        console.error('[Redis] Max reconnection attempts reached');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 100, 3000);
      console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
    reconnectOnError: (err: Error) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some(e => err.message.includes(e));
    },
  };
  
  if (env.REDIS_URL) {
    return {
      ...baseOptions,
      // ioredis parses the URL automatically when passed to constructor
    };
  }

  const options: RedisOptions = {
    ...baseOptions,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    db: env.REDIS_DB,
  };

  // Add authentication if password is provided
  if (env.REDIS_PASSWORD) {
    options.username = env.REDIS_USERNAME;
    options.password = env.REDIS_PASSWORD;
  }

  return options;
}

/**
 * Create a new Redis connection
 */
function createConnection(name: string): Redis {
  const env = getEnvConfig();
  const options = getConnectionOptions();
  
  let redis: Redis;
  if (env.REDIS_URL) {
    redis = new Redis(env.REDIS_URL, options);
  } else {
    redis = new Redis(options);
  }

  redis.on('connect', () => {
    console.log(`[Redis:${name}] Connected to ${env.REDIS_URL || `${env.REDIS_HOST}:${env.REDIS_PORT}`}`);
  });

  redis.on('ready', () => {
    console.log(`[Redis:${name}] Ready`);
  });

  redis.on('error', (err) => {
    console.error(`[Redis:${name}] Error:`, err.message);
  });

  redis.on('close', () => {
    console.log(`[Redis:${name}] Connection closed`);
  });

  redis.on('reconnecting', () => {
    console.log(`[Redis:${name}] Reconnecting...`);
  });

  return redis;
}

/**
 * Get the main Redis connection (singleton)
 * Used for BullMQ queues and general Redis operations
 */
export function getRedisConnection(): Redis {
  if (!connection) {
    connection = createConnection('main');
  }
  return connection;
}

/**
 * Get a dedicated subscriber connection (singleton)
 * Used for Redis Streams XREAD blocking operations
 * BullMQ also requires a separate subscriber connection
 */
export function getRedisSubscriber(): Redis {
  if (!subscriber) {
    subscriber = createConnection('subscriber');
  }
  return subscriber;
}

/**
 * Create a new Redis connection (non-singleton)
 * Use this when you need a dedicated connection for specific operations
 */
export function createNewConnection(name: string): Redis {
  return createConnection(name);
}

/**
 * Health check - verify Redis is connected and responsive
 */
export async function checkRedisHealth(): Promise<{
  connected: boolean;
  latencyMs: number | null;
  error: string | null;
}> {
  try {
    const redis = getRedisConnection();
    const start = Date.now();
    await redis.ping();
    const latencyMs = Date.now() - start;
    
    return {
      connected: true,
      latencyMs,
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Gracefully close all Redis connections
 * Call this during application shutdown
 */
export async function closeRedisConnections(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  if (connection) {
    console.log('[Redis] Closing main connection...');
    closePromises.push(
      connection.quit().then(() => {
        connection = null;
        console.log('[Redis] Main connection closed');
      })
    );
  }

  if (subscriber) {
    console.log('[Redis] Closing subscriber connection...');
    closePromises.push(
      subscriber.quit().then(() => {
        subscriber = null;
        console.log('[Redis] Subscriber connection closed');
      })
    );
  }

  await Promise.all(closePromises);
}

/**
 * Get connection status
 */
export function getConnectionStatus(): {
  main: 'connected' | 'connecting' | 'disconnected';
  subscriber: 'connected' | 'connecting' | 'disconnected' | 'not_initialized';
} {
  const getStatus = (redis: Redis | null): 'connected' | 'connecting' | 'disconnected' | 'not_initialized' => {
    if (!redis) return 'not_initialized';
    if (redis.status === 'ready') return 'connected';
    if (redis.status === 'connecting' || redis.status === 'reconnecting') return 'connecting';
    return 'disconnected';
  };

  return {
    main: getStatus(connection) as 'connected' | 'connecting' | 'disconnected',
    subscriber: getStatus(subscriber),
  };
}

/**
 * Get connection info for debugging
 */
export function getConnectionInfo(): {
  host: string;
  port: number;
  hasAuth: boolean;
  useUrl: boolean;
} {
  const env = getEnvConfig();
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    hasAuth: !!env.REDIS_PASSWORD,
    useUrl: !!env.REDIS_URL,
  };
}

// Export the Redis class for type usage
export { Redis };
