import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Component that scrolls to the top of the page when the route changes
 * This helps solve the issue of maintaining scroll position between page navigations
 */
export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top when the location changes
    window.scrollTo(0, 0);
  }, [location]);

  // This component doesn't render anything
  return null;
} 