import { useState, useEffect, useMemo } from 'react';

type Theme = 'dark' | 'light';

// List of public page paths that should not have dark mode
const PUBLIC_PAGES = [
  '/',               // Landing page
  '/about',          // About page
  '/pricing',        // Pricing page
  '/contact',        // Contact page
  '/register',       // Register page
  '/auth',           // Auth/login page
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy'
];

// Special landing page path that requires additional optimization
const LANDING_PAGE = '/';

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Get the current path once when the hook initializes
  const currentPath = useMemo(() => typeof window !== 'undefined' ? window.location.pathname : '', []);
  
  // Check if current page is a public page - memoized to improve performance
  const isPublicPage = useMemo(() => PUBLIC_PAGES.includes(currentPath), [currentPath]);
  
  // Check if it's the landing page - which needs special optimization
  const isLandingPage = useMemo(() => currentPath === LANDING_PAGE, [currentPath]);

  useEffect(() => {
    // Force light mode for public pages
    if (isPublicPage) {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      
      // Add performance optimization class for landing page
      if (isLandingPage) {
        document.documentElement.classList.add('landing-page');
        // Ensure smooth scrolling on landing page
        document.documentElement.style.scrollBehavior = 'smooth';
      }
      
      return;
    }
    
    // For authenticated/admin pages, check for stored preference or system preference
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial state based on stored preference or system preference
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
    
    // Remove landing page class if not on landing page
    if (!isLandingPage) {
      document.documentElement.classList.remove('landing-page');
    }
  }, [isPublicPage, isLandingPage]);

  const toggleDarkMode = (value?: boolean) => {
    // Prevent toggling dark mode on public pages
    if (isPublicPage) {
      return;
    }
    
    const newDarkMode = value !== undefined ? value : !isDarkMode;
    
    // Update state
    setIsDarkMode(newDarkMode);
    
    // Update DOM
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return { isDarkMode, toggleDarkMode };
} 