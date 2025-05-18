import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDarkMode } from '../../hooks/use-dark-mode';

// Define branding settings type
interface BrandingSettings {
  appName: string;
  appTagline: string;
  logoUrl: string;
  faviconUrl: string;
  enableDarkMode: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  footerText: string;
  customCss?: string;
  customJs?: string;
}

// Default settings if API is unavailable
const defaultSettings: BrandingSettings = {
  appName: "atScribe",
  appTagline: "AI-powered resume and career tools",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  enableDarkMode: true,
  primaryColor: "#4f46e5",
  secondaryColor: "#10b981",
  accentColor: "#f97316",
  footerText: "© 2023 ProsumeAI. All rights reserved."
};

export const BrandingContext = React.createContext<BrandingSettings>(defaultSettings);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    // Fetch branding settings from the API
    const fetchBrandingSettings = async () => {
      try {
        const response = await axios.get('/api/branding');
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch branding settings:', error);
        // Keep using default settings on error
      }
    };

    fetchBrandingSettings();
  }, []);

  useEffect(() => {
    // Apply custom CSS variables
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', settings.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    
    // Update document title
    document.title = settings.appName;
    
    // Update favicon
    const faviconElement = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (faviconElement) {
      faviconElement.href = settings.faviconUrl;
    }
    
    // Inject custom CSS if available (admin only)
    if (settings.customCss) {
      let styleElement = document.getElementById('custom-branding-css');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-branding-css';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = settings.customCss;
    }
    
    // Inject custom JavaScript if available (admin only)
    if (settings.customJs) {
      let scriptElement = document.getElementById('custom-branding-js');
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
      
      scriptElement = document.createElement('script');
      scriptElement.id = 'custom-branding-js';
      // Use innerHTML for script content
      scriptElement.innerHTML = settings.customJs;
      document.head.appendChild(scriptElement);
    }
    
    // Only allow dark mode if enabled in settings
    if (!settings.enableDarkMode && isDarkMode) {
      toggleDarkMode(false);
    }
  }, [settings, isDarkMode, toggleDarkMode]);

  return (
    <BrandingContext.Provider value={settings}>
      {children}
    </BrandingContext.Provider>
  );
}

// Hook to use branding settings anywhere in the app
export function useBranding() {
  return React.useContext(BrandingContext);
} 