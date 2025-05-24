import { db } from '../config/db';
import { appSettings, brandingSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Service for managing application settings and branding
 */
export class SettingsService {
  /**
   * Get all application settings
   * @returns All application settings
   */
  public static async getAllSettings(): Promise<any> {
    try {
      return await db.select().from(appSettings);
    } catch (error) {
      console.error('Error getting application settings:', error);
      throw error;
    }
  }

  /**
   * Get a specific application setting by key
   * @param key Setting key
   * @returns Setting value
   */
  public static async getSetting(key: string): Promise<any> {
    try {
      const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
      return result.length > 0 ? result[0].value : null;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all branding settings
   * @returns Branding settings
   */
  public static async getBrandingSettings(): Promise<any> {
    try {
      const result = await db.select().from(brandingSettings).limit(1);
      return result.length > 0 ? result[0] : {
        appName: 'ProsumeAI',
        appTagline: 'AI-powered resume and career tools',
        logoUrl: '/logo.png',
        faviconUrl: '/favicon.ico',
        enableDarkMode: true,
        primaryColor: '#4f46e5',
        secondaryColor: '#10b981',
        accentColor: '#f97316',
        footerText: '© 2023 ProsumeAI. All rights reserved.'
      };
    } catch (error) {
      console.error('Error getting branding settings:', error);
      throw error;
    }
  }

  /**
   * Update branding settings
   * @param settings Branding settings to update
   * @returns Updated branding settings
   */
  public static async updateBrandingSettings(settings: any): Promise<any> {
    try {
      const existing = await db.select().from(brandingSettings).limit(1);
      
      if (existing.length === 0) {
        // Insert new settings if none exist
        return await db.insert(brandingSettings)
          .values(settings)
          .returning();
      } else {
        // Update existing settings
        return await db.update(brandingSettings)
          .set({
            ...settings,
            updatedAt: new Date()
          })
          .where(eq(brandingSettings.id, existing[0].id))
          .returning();
      }
    } catch (error) {
      console.error('Error updating branding settings:', error);
      throw error;
    }
  }
}

/**
 * Get the application name
 * @returns Application name
 */
export async function getAppName(): Promise<string> {
  try {
    const branding = await SettingsService.getBrandingSettings();
    return branding.appName || 'ProsumeAI';
  } catch (error) {
    console.error('Error getting app name:', error);
    return 'ProsumeAI';
  }
}

export default SettingsService; 