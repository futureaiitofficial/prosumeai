import { db } from "../../config/db";
import { apiKeys } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * API Key Manager utility
 * Provides methods to retrieve and manage API keys from the database
 */
export class ApiKeyManager {
  /**
   * Get an active API key for a specific service
   * @param service The service to get an API key for (e.g., 'openai')
   * @returns The API key string or null if no active key is found
   */
  static async getActiveKey(service: string = 'openai'): Promise<string | null> {
    try {
      // Find an active key for the specified service
      const keys = await db.select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.service, service),
            eq(apiKeys.isActive, true)
          )
        )
        .orderBy(desc(apiKeys.lastUsed)) // Get most recently used key first
        .limit(1);

      if (keys.length === 0) {
        console.warn(`No active API key found for service: ${service}`);
        return null;
      }

      const key = keys[0];
      
      // Update the last used timestamp
      await this.updateLastUsed(key.id);
      
      return key.key;
    } catch (error) {
      console.error("Error retrieving API key:", error);
      return null;
    }
  }

  /**
   * Update the lastUsed timestamp for an API key
   * @param keyId The ID of the key to update
   */
  static async updateLastUsed(keyId: number): Promise<void> {
    try {
      await db.update(apiKeys)
        .set({ lastUsed: new Date() })
        .where(eq(apiKeys.id, keyId));
    } catch (error) {
      console.error("Error updating API key last used timestamp:", error);
    }
  }

  /**
   * Get an API key with fallback to environment variable
   * @param service The service to get an API key for (e.g., 'openai')
   * @param envVarName The name of the environment variable to use as fallback
   * @returns The API key string or null if no key is found
   */
  static async getKeyWithFallback(service: string = 'openai', envVarName: string = 'OPENAI_API_KEY'): Promise<string | null> {
    // Try to get a key from the database first
    const dbKey = await this.getActiveKey(service);
    
    if (dbKey) {
      return dbKey;
    }
    
    // Fall back to environment variable
    const envKey = process.env[envVarName];
    
    if (envKey) {
      console.log(`Using environment variable ${envVarName} for ${service} API key`);
      return envKey;
    }
    
    console.error(`No API key found for service: ${service}`);
    return null;
  }
} 