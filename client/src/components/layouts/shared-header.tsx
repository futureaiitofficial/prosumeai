import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useBranding } from '@/components/branding/branding-provider';

type SharedHeaderProps = {
  isLandingPage?: boolean;
  forceBackground?: boolean;
};

export default function SharedHeader({ isLandingPage = false, forceBackground = false }: SharedHeaderProps) {
  const branding = useBranding();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const isLoggedIn = !!user;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking a link
  const handleNavLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 md:p-6 transition-all duration-300 ${isScrolled || forceBackground ? 'bg-indigo-950/95 shadow-md backdrop-blur-sm' : 'bg-transparent'}`}>
        <Link href="/" className="text-xl md:text-2xl font-bold text-white">
          {branding.appName}
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {isLandingPage ? (
            <a href="#features" className="text-white hover:text-blue-400 transition-colors">Features</a>
          ) : (
            <Link href="/#features" className="text-white hover:text-blue-400 transition-colors">
              Features
            </Link>
          )}
          
          <Link href="/pricing" className="text-white hover:text-blue-400 transition-colors">
            Pricing
          </Link>
          
          <Link href="/about" className="text-white hover:text-blue-400 transition-colors">
            About Us
          </Link>
          
          <Link href="/contact" className="text-white hover:text-blue-400 transition-colors">
            Contact Us
          </Link>
        </nav>
        
        {/* Desktop Auth/Dashboard Buttons */}
        <div className="hidden md:flex space-x-4">
          {isLoggedIn ? (
            <Link href="/dashboard" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth" className="px-4 py-2 text-white hover:text-blue-200 transition-colors">
                Login
              </Link>
              <Link href="/pricing" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-indigo-950/95 backdrop-blur-sm shadow-lg p-4"
          >
            <nav className="flex flex-col space-y-3">
              {isLandingPage ? (
                <a 
                  href="#features" 
                  className="text-white hover:text-blue-400 transition-colors py-2 px-2 border-b border-indigo-800/50 w-full text-left"
                  onClick={handleNavLinkClick}
                >
                  Features
                </a>
              ) : (
                <Link href="/#features" className="text-white hover:text-blue-400 transition-colors py-2 px-2 border-b border-indigo-800/50 w-full text-left" onClick={handleNavLinkClick}>
                  Features
                </Link>
              )}
              
              <Link href="/pricing" className="text-white hover:text-blue-400 transition-colors py-2 px-2 border-b border-indigo-800/50 w-full text-left" onClick={handleNavLinkClick}>
                Pricing
              </Link>
              
              <Link href="/about" className="text-white hover:text-blue-400 transition-colors py-2 px-2 border-b border-indigo-800/50 w-full text-left" onClick={handleNavLinkClick}>
                About Us
              </Link>
              
              <Link href="/contact" className="text-white hover:text-blue-400 transition-colors py-2 px-2 border-b border-indigo-800/50 w-full text-left" onClick={handleNavLinkClick}>
                Contact Us
              </Link>
              
              {/* Mobile Auth/Dashboard Buttons */}
              {isLoggedIn ? (
                <div className="w-full pt-3">
                  <Link href="/dashboard" className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors text-center block" onClick={handleNavLinkClick}>
                    Dashboard
                  </Link>
                </div>
              ) : (
                <div className="flex flex-row space-x-2 pt-3 w-full">
                  <Link href="/auth" className="flex-1 px-4 py-2 text-white hover:text-blue-200 transition-colors border border-indigo-700 rounded-md text-center" onClick={handleNavLinkClick}>
                    Login
                  </Link>
                  <Link href="/pricing" className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors text-center" onClick={handleNavLinkClick}>
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 