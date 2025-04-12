import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface LocationContextType {
  country: string | null;
  currency: string;
  setCurrency: (currency: string) => void;
}

const LocationContext = createContext<LocationContextType>({
  country: null,
  currency: 'USD',
  setCurrency: () => {}
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('USD');

  useEffect(() => {
    // Check for saved preference first
    const savedCurrency = localStorage.getItem('userCurrency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
      return;
    }
    
    // Otherwise attempt to detect location
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => {
        setCountry(data.country);
        const detectedCurrency = data.country === 'IN' ? 'INR' : 'USD';
        setCurrency(detectedCurrency);
        localStorage.setItem('userCurrency', detectedCurrency);
      })
      .catch(error => {
        console.error('Error detecting location:', error);
        // Default to USD if location detection fails
        setCurrency('USD');
        localStorage.setItem('userCurrency', 'USD');
      });
  }, []);

  const updateCurrency = (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem('userCurrency', newCurrency);
  };

  return (
    <LocationContext.Provider value={{ country, currency, setCurrency: updateCurrency }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  return useContext(LocationContext);
} 