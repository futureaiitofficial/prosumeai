import { db } from "../../config/db";
import { apiKeys } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * API Key Manager - Handles retrieving and caching API keys from 
 * various sources: database, environment variables, etc.
 */
export class ApiKeyManager {
  private static keyCache: Map<string, {
    key: string;
    timestamp: number;
  }> = new Map();
  
  private static cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  /**
   * Get an API key for a specific service
   * @param service The service name (e.g., 'openai', 'anthropic')
   * @returns The API key or null if not found
   */
  static async getKey(service: string): Promise<string | null> {
    // Check if we have a cached key that's still valid
    const cached = this.keyCache.get(service);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached.key;
    }
    
    try {
      // Get the most recently used active key for this service
      const keys = await db.select()
        .from(apiKeys)
        .where(and(
          eq(apiKeys.service, service),
          eq(apiKeys.isActive, true)
        ))
        .orderBy(desc(apiKeys.lastUsed))
        .limit(1);
      
      if (keys.length === 0) {
        console.warn(`No active API key found for service: ${service}`);
        return null;
      }
      
      // Update the last used timestamp
      await db.update(apiKeys)
        .set({ lastUsed: new Date() })
        .where(eq(apiKeys.id, keys[0].id));
      
      // Cache the key
      this.keyCache.set(service, {
        key: keys[0].key,
        timestamp: Date.now()
      });
      
      return keys[0].key;
    } catch (error) {
      console.error(`Error retrieving API key for service ${service}:`, error);
      return null;
    }
  }
  
  /**
   * Get an API key with fallback to environment variable
   * @param service The service name
   * @param envVar The environment variable name to use as fallback
   * @returns The API key or null if not found
   */
  static async getKeyWithFallback(service: string, envVar: string): Promise<string | null> {
    // First try from database
    const dbKey = await this.getKey(service);
    if (dbKey) return dbKey;
    
    // Fall back to environment variable
    const envKey = process.env[envVar];
    if (envKey) {
      console.log(`Using API key from environment variable: ${envVar}`);
      return envKey;
    }
    
    // No key found
    return null;
  }
  
  /**
   * Clear the key cache for a specific service or all services
   * @param service Optional service name. If not provided, clears all cached keys.
   */
  static clearCache(service?: string): void {
    if (service) {
      this.keyCache.delete(service);
    } else {
      this.keyCache.clear();
    }
  }
  
  /**
   * Explicitly cache a key for a service
   * @param service The service name
   * @param key The API key to cache
   */
  static cacheKey(service: string, key: string): void {
    this.keyCache.set(service, {
      key,
      timestamp: Date.now()
    });
  }
} 