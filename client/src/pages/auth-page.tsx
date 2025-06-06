import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LoginForm from "@/components/auth/login-form";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/components/branding/branding-provider";

// Compact mascot component with eye animations
const AuthMascot = () => {
  const [isPasswordField, setIsPasswordField] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorPositionInterval = useRef<NodeJS.Timeout | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const eyeLRef = useRef<SVGEllipseElement>(null);
  const eyeRRef = useRef<SVGEllipseElement>(null);
  const eyeLPupilRef = useRef<SVGCircleElement>(null);
  const eyeRPupilRef = useRef<SVGCircleElement>(null);
  
  // Track cursor position in input field when typing - memoized to avoid dependency loops
  const trackCursorPosition = useCallback(() => {
    if (!activeInput || isPasswordField) return;
    
    const input = activeInput;
    const rect = input.getBoundingClientRect();
    
    // Get cursor position - force it to update by direct manipulation
    const cursorPosition = input.selectionStart || 0;
    const inputValue = input.value || "";
    const textLength = inputValue.length;
    
    // Calculate horizontal position relative to the input width (0 to 1)
    // For empty inputs or cursor at beginning, look slightly left
    // For cursor at end, look slightly right
    let cursorRatio = 0.5; // Default to middle
    
    if (textLength === 0) {
      cursorRatio = 0.2; // Look slightly left for empty input
    } else if (cursorPosition === 0) {
      cursorRatio = 0.2; // Look slightly left at beginning of input
    } else if (cursorPosition >= textLength) {
      cursorRatio = 0.8; // Look slightly right at end of input
    } else {
      // Otherwise map to position in text
      cursorRatio = cursorPosition / textLength;
    }
    
    // Map this to the eye range (-3 to 3)
    const eyeX = (cursorRatio * 6) - 3;
    
    // Look slightly down at the input field
    setEyePosition({ x: eyeX, y: 3 });
    
    // Force the component to update
    setIsTyping(true);
  }, [activeInput, isPasswordField]);
  
  // Add direct event handling for input fields
  useEffect(() => {
    // Direct input event handler to capture real-time typing
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === 'INPUT' && target.getAttribute('type') !== 'checkbox') {
        setActiveInput(target);
        // Force immediate tracking
        requestAnimationFrame(() => {
          trackCursorPosition();
        });
      }
    };

    // Add event listeners for more reliable tracking
    document.addEventListener('input', handleInput, true);
    document.addEventListener('click', trackCursorPosition, true);
    document.addEventListener('keyup', trackCursorPosition, true);
    
    return () => {
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('click', trackCursorPosition, true);
      document.removeEventListener('keyup', trackCursorPosition, true);
    };
  }, [isPasswordField, trackCursorPosition]);
  
  // Track mouse movement for eye tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Don't track mouse when eyes are closed or when actively typing
      if (isPasswordField || (isTyping && activeInput)) return;
      
      if (svgRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const centerX = svgRect.left + svgRect.width / 2;
        const centerY = svgRect.top + svgRect.height / 2;
        
        // Calculate distance from center as a percentage (-1 to 1)
        const distX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (svgRect.width / 2))) * 3;
        const distY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (svgRect.height / 2))) * 2;
        
        setEyePosition({ x: distX, y: distY });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPasswordField, isTyping, activeInput]);
  
  // Detect focused input elements and track cursor position
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target.getAttribute('type') !== 'checkbox') {
        setActiveInput(target as HTMLInputElement);
        setIsTyping(true);
        
        // Immediately track the cursor position
        setTimeout(trackCursorPosition, 10);
        
        // Start tracking cursor position at regular intervals
        if (cursorPositionInterval.current) {
          clearInterval(cursorPositionInterval.current);
        }
        
        cursorPositionInterval.current = setInterval(trackCursorPosition, 100);
      }
    };
    
    const handleFocusOut = () => {
      setActiveInput(null);
      setIsTyping(false);
      
      if (cursorPositionInterval.current) {
        clearInterval(cursorPositionInterval.current);
        cursorPositionInterval.current = null;
      }
    };
    
    // Handle selection events directly to better track cursor
    const handleSelection = () => {
      trackCursorPosition();
    };
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('select', handleSelection);
    document.addEventListener('click', trackCursorPosition);
    document.addEventListener('keyup', trackCursorPosition);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('select', handleSelection);
      document.removeEventListener('click', trackCursorPosition);
      document.removeEventListener('keyup', trackCursorPosition);
      
      if (cursorPositionInterval.current) {
        clearInterval(cursorPositionInterval.current);
      }
    };
  }, [isPasswordField]);
  
  // Detect keyboard input to make eyes look down when typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPasswordField && activeInput) {
        // Force immediate cursor position update on key press
        requestAnimationFrame(() => {
          trackCursorPosition();
        });
        
        // Reset typing state after short delay
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          if (!activeInput) {
            setIsTyping(false);
          }
        }, 2000); // Longer timeout to maintain focus during typing
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isPasswordField, activeInput]);
  
  // Apply eye movement or closing animation
  useEffect(() => {
    if (eyeLPupilRef.current && eyeRPupilRef.current && eyeLRef.current && eyeRRef.current) {
      if (isPasswordField) {
        // Close eyes by making them appear as lines
        eyeLRef.current.setAttribute('ry', '0.5');
        eyeRRef.current.setAttribute('ry', '0.5');
        
        // Hide pupils when eyes are closed
        eyeLPupilRef.current.setAttribute('r', '0');
        eyeRPupilRef.current.setAttribute('r', '0');
      } else {
        // Open eyes
        eyeLRef.current.setAttribute('ry', '6');
        eyeRRef.current.setAttribute('ry', '6');
        
        // Show and position pupils
        eyeLPupilRef.current.setAttribute('r', '2');
        eyeRPupilRef.current.setAttribute('r', '2');
        eyeLPupilRef.current.setAttribute('cx', `${83 + eyePosition.x}`);
        eyeLPupilRef.current.setAttribute('cy', `${79 + eyePosition.y}`);
        eyeRPupilRef.current.setAttribute('cx', `${113 + eyePosition.x}`);
        eyeRPupilRef.current.setAttribute('cy', `${79 + eyePosition.y}`);
      }
    }
  }, [eyePosition, isPasswordField]);

  // Setup global access to mascot state for communication with forms
  useEffect(() => {
    // Initialize the basics first - these match what's expected in the type declaration
    window.authMascot = {
      isPasswordField: false,
      setPasswordMode: (active: boolean) => {
        setIsPasswordField(active);
        
        if (window.authMascot) {
          window.authMascot.isPasswordField = active;
        }
      }
    };
    
    // Now add the extra method safely with type assertion
    (window.authMascot as any).updateEyePosition = (x: number, y: number) => {
      if (!isPasswordField && !isTyping) {
        setEyePosition({ x, y });
      }
    };
    
    return () => {
      delete window.authMascot;
      
      if (cursorPositionInterval.current) {
        clearInterval(cursorPositionInterval.current);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isPasswordField, isTyping]);
  
  return (
    <div className="w-full h-full">
      <svg 
        className="w-full h-full" 
        viewBox="0 0 200 200" 
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        ref={svgRef}
      >
        {/* Body - blue circle background */}
        <circle cx="100" cy="100" r="90" fill="#a9ddf3" />
        
        {/* Body shape */}
        <path 
          fill="#FFFFFF" 
          d="M193.3,135.9c-5.8-8.4-15.5-13.9-26.5-13.9H151V72c0-27.6-22.4-50-50-50S51,44.4,51,72v50H32.1 c-10.6,0-20,5.1-25.8,13l0,78h187L193.3,135.9z"
        />
        
        {/* Face */}
        <path 
          className="face" 
          fill="#DDF1FA" 
          d="M134.5,46v35.5c0,21.815-15.446,39.5-34.5,39.5s-34.5-17.685-34.5-39.5V46"
        />
        
        {/* Ears */}
        <g className="ear-left">
          <circle cx="47" cy="83" r="11.5" fill="#ddf1fa" stroke="#3a5e77" strokeWidth="2.5" />
        </g>
        <g className="ear-right">
          <circle cx="153" cy="83" r="11.5" fill="#ddf1fa" stroke="#3a5e77" strokeWidth="2.5" />
        </g>
        
        {/* Eyes container */}
        <g className="eyes">
          {/* Left eye */}
          <g className="eye-left">
            <ellipse cx="85" cy="82" rx="6" ry="6" fill="#3a5e77" ref={eyeLRef} />
            <circle 
              cx="83" cy="79" r="2" 
              fill="#fff" 
              ref={eyeLPupilRef}
            />
          </g>
          {/* Right eye */}
          <g className="eye-right">
            <ellipse cx="115" cy="82" rx="6" ry="6" fill="#3a5e77" ref={eyeRRef} />
            <circle 
              cx="113" cy="79" r="2" 
              fill="#fff" 
              ref={eyeRPupilRef}
            />
          </g>
        </g>
        
        {/* Nose */}
        <path 
          className="nose" 
          d="M97.7 95 h4.7 c1.9 0 3 2.2 1.9 3.7 l-2.3 3.3 c-.9 1.3-2.9 1.3-3.8 0 l-2.3-3.3 c-1.3-1.6-.2-3.7 1.8-3.7 z" 
          fill="#3a5e77"
        />
        
        {/* Mouth */}
        <g className="mouth">
          <path 
            className="mouth-bg" 
            fill="#617E92" 
            d="M100.2,115c-0.4,0-1.4,0-1.8,0c-2.7-0.3-5.3-1.1-8-2.5c-0.7-0.3-0.9-1.2-0.6-1.8 c0.2-0.5,0.7-0.7,1.2-0.7c0.2,0,0.5,0.1,0.6,0.2c3,1.5,5.8,2.3,8.6,2.3s5.7-0.7,8.6-2.3c0.2-0.1,0.4-0.2,0.6-0.2 c0.5,0,1,0.3,1.2,0.7c0.4,0.7,0.1,1.5-0.6,1.9c-2.6,1.4-5.3,2.2-7.9,2.5C101.7,115,100.5,115,100.2,115z"
          />
        </g>
      </svg>
    </div>
  );
};

export default function AuthPage() {
  const branding = useBranding();
  const [location, navigate] = useLocation();
  const search = useSearch();
  const { user, isLoading } = useAuth();
  const [showSignupCTA, setShowSignupCTA] = useState<boolean>(false);
  
  // Check if there's a redirect parameter
  useEffect(() => {
    const params = new URLSearchParams(search);
    const redirect = params.get("redirect");
    // We'll use this redirect parameter later if needed
  }, [search]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    // Show signup CTA after a delay
    const timer = setTimeout(() => {
      setShowSignupCTA(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 w-full overflow-hidden">
      <div className="flex h-full w-full">
        {/* Illustration column - hidden on small screens, shown on large screens */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center relative">
          <div className="absolute inset-0 bg-primary-pattern opacity-10"></div>
          
          <div className="relative z-10 px-6 xl:px-12 max-w-lg w-full">
            <h1 className="text-white text-2xl xl:text-3xl font-bold mb-4">
              Welcome to {branding.appName}
            </h1>
            <p className="text-primary-foreground/80 text-sm xl:text-base mb-6">
              The AI-powered resume builder that helps you land your dream job. Craft standout resumes tailored to each job application in minutes.
            </p>
            
            <div className="flex flex-col space-y-4 items-center">
              <div className="w-32 h-32 xl:w-40 xl:h-40">
                <AuthMascot />
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm w-full">
                <h3 className="text-white text-lg font-medium mb-3">Why choose {branding.appName}?</h3>
                <ul className="space-y-2 text-primary-foreground/80 text-sm">
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI-powered resume tailoring</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>ATS-friendly templates</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI cover letter generation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form column - full width on mobile/tablet, half width on large screens */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6">
          <div className="w-full max-w-sm lg:max-w-md">
            {/* Mobile mascot - only shown on small screens */}
            <div className="flex lg:hidden justify-center mb-4">
              <div className="w-20 h-20">
                <AuthMascot />
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900">Log in to your account</h2>
              <p className="text-slate-600 mt-1 text-sm">
                Enter your credentials to access your account
              </p>
            </div>
            
            <div className="w-full">
              <LoginForm />
            </div>
            
            <AnimatePresence>
              {showSignupCTA && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg"
                >
                  <h3 className="text-base font-medium text-blue-900 mb-1">Don't have an account yet?</h3>
                  <p className="text-blue-700 mb-3 text-sm">Create a free account and start building ATS-friendly resumes today!</p>
                  <Button 
                    onClick={() => navigate('/register')} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-2"
                  >
                    Create Free Account
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
