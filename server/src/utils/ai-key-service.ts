import { db } from "../../config/db";
import { apiKeys } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import OpenAILib from "openai";

/**
 * API Key Service
 * Provides utility functions for managing and retrieving API keys
 */
export class ApiKeyService {
  /**
   * Get an OpenAI client with an API key from the database or fallback to environment
   * @returns An initialized OpenAI client
   */
  static async getOpenAIClient(): Promise<OpenAILib> {
    const apiKey = await this.getOpenAIKey();
    return new OpenAILib({ apiKey });
  }

  /**
   * Get an OpenAI API key from the database or fallback to environment
   * @returns A valid API key string
   */
  static async getOpenAIKey(): Promise<string> {
    try {
      // Find an active key for OpenAI
      const keys = await db.select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.service, 'openai'),
            eq(apiKeys.isActive, true)
          )
        )
        .orderBy(desc(apiKeys.lastUsed)) // Get most recently used key first
        .limit(1);

      // If we found a key in the database, update its usage timestamp and return it
      if (keys.length > 0) {
        const key = keys[0];
        // Update the last used timestamp
        await this.updateLastUsed(key.id);
        console.log(`Using database API key "${key.name}" for OpenAI`);
        return key.key;
      }
      
      // Fall back to environment variable
      const envKey = process.env.OPENAI_API_KEY;
      
      if (!envKey) {
        console.error('No API key found for OpenAI in database or environment');
        throw new Error('OpenAI API key not configured');
      }
      
      console.log(`Using environment variable OPENAI_API_KEY for OpenAI`);
      return envKey;
    } catch (error) {
      console.error("Error retrieving OpenAI API key:", error);
      
      // Final fallback to environment variable without DB operations
      const envKey = process.env.OPENAI_API_KEY;
      
      if (!envKey) {
        throw new Error('No OpenAI API key available');
      }
      
      return envKey;
    }
  }

  /**
   * Update the lastUsed timestamp for an API key
   * @param keyId The ID of the key to update
   */
  private static async updateLastUsed(keyId: number): Promise<void> {
    try {
      await db.update(apiKeys)
        .set({ lastUsed: new Date() })
        .where(eq(apiKeys.id, keyId));
    } catch (error) {
      console.error("Error updating API key last used timestamp:", error);
    }
  }
} 