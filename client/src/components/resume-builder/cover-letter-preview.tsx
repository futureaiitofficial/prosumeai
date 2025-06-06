import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { coverLetterTemplateMetadata } from "@/templates/registerCoverLetterTemplates";
import { ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define a cover letter preview props interface
interface CoverLetterPreviewProps {
  data: any; // Use any to accept the builder's data format
  hideDownloadButton?: boolean; // Add prop to hide download button
  inMobileModal?: boolean; // Add prop to indicate if preview is in mobile modal
  inDesktopPreview?: boolean; // Add prop to indicate if preview is in desktop preview panel
}

// REMOVE: Don't register templates at the module level
// This causes recursive imports and stack overflow

export default function CoverLetterPreview({ data, hideDownloadButton = false, inMobileModal = false, inDesktopPreview = false }: CoverLetterPreviewProps) {
  // Add zoom control with better initial value
  const [scale, setScale] = useState(1);
  // Track viewport width for responsive adjustments
  const [isMobile, setIsMobile] = useState(false);
  // Track if dark mode is enabled
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Calculate adaptive zoom based on screen size
  const calculateAdaptiveZoom = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Calculate scale based on available space
    // Standard A4 dimensions: 210mm x 297mm (roughly 794px x 1123px at 96 DPI)
    const paperWidth = 794;
    const paperHeight = 1123;
    
    // Calculate available space more accurately
    let availableWidth, availableHeight;
    
    if (inMobileModal) {
      // In mobile modal, use most of the screen space
      availableWidth = width - 24;
      availableHeight = height - 80; // Account for modal header/controls
    } else if (inDesktopPreview) {
      // For desktop preview panel (side-by-side layout)
      const previewPanelWidth = width * 0.55; // Preview panel takes about 55% of screen width
      availableWidth = previewPanelWidth - 40;
      availableHeight = height - 160;
    } else if (isMobile) {
      // On mobile, use most of the screen width
      availableWidth = width - 32; // Account for padding
      availableHeight = height - 180; // Account for header, controls, and navigation
    } else {
      // On desktop in standard layout, account for the form sidebar
      // The preview area is approximately 60% of the total width
      const previewAreaWidth = width * 0.6;
      availableWidth = previewAreaWidth - 100;
      availableHeight = height - 200;
    }
    
    // Calculate scale to fit both width and height
    const scaleByWidth = availableWidth / paperWidth;
    const scaleByHeight = availableHeight / paperHeight;
    
    // Use the smaller scale to ensure it fits, with reasonable min/max bounds
    let adaptiveScale = Math.min(scaleByWidth, scaleByHeight);
    
    // Apply reasonable bounds with better defaults for different screen sizes
    if (isMobile || inMobileModal) {
      adaptiveScale = Math.max(0.4, Math.min(0.9, adaptiveScale));
    } else if (inDesktopPreview) {
      adaptiveScale = Math.max(0.42, Math.min(0.85, adaptiveScale));
    } else {
      adaptiveScale = Math.max(0.45, Math.min(1.0, adaptiveScale));
    }
    
    // Round to nearest 0.05 for cleaner values
    return Math.round(adaptiveScale * 20) / 20;
  }, [isMobile, inMobileModal, inDesktopPreview]);
  
  // Listen for window resize to adjust UI for mobile/desktop
  useEffect(() => {
    const updateLayout = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      
      // Calculate and set adaptive zoom
      const adaptiveZoom = calculateAdaptiveZoom();
      setScale(adaptiveZoom);
    };
    
    // Check if dark mode is enabled
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Initial setup
    updateLayout();
    checkDarkMode();
    
    // Set up the resize listener with debounce
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateLayout, 100);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    // Set up dark mode change observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // Clean up
    return () => {
      window.removeEventListener('resize', debouncedResize);
      observer.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, [calculateAdaptiveZoom]);

  // Get the template component and render the cover letter
  const renderCoverLetterTemplate = () => {
    if (!data?.template || typeof data.template !== 'string') {
      console.log("No template selected or invalid template", data?.template);
      return <div className="p-4 text-red-500">No template selected</div>;
    }
    
    // Get the template metadata
    const selectedTemplateMetadata = coverLetterTemplateMetadata[data.template as keyof typeof coverLetterTemplateMetadata];
    console.log("Selected cover letter template metadata:", selectedTemplateMetadata);
    
    if (!selectedTemplateMetadata) {
      console.log("Template metadata not found for", data.template);
      return <div className="p-4 text-red-500">Template metadata not found</div>;
    }
    
    // Check if the template has a component property
    if (selectedTemplateMetadata && 'component' in selectedTemplateMetadata) {
      try {
        // Using type assertion to tell TypeScript that component exists
        const TemplateComponent = (selectedTemplateMetadata as any).component;
        if (!TemplateComponent) {
          console.log("Template component is undefined");
          return <div className="p-4 text-red-500">Template component not found</div>;
        }
        
        console.log("Rendering cover letter template component:", TemplateComponent.name);
        
        // Create the data object to pass to the template
        const templateData = {
          title: data.title || "Cover Letter",
          fullName: data.fullName || "Your Name",
          email: data.email || "email@example.com",
          phone: data.phone || "(123) 456-7890",
          address: data.address || "City, State",
          recipientName: data.recipientName || "Hiring Manager",
          companyName: data.companyName || "Company Name",
          jobTitle: data.jobTitle || "Position",
          content: data.content || "Your cover letter content will appear here...",
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        };
        
        return <TemplateComponent data={templateData} />;
      } catch (error) {
        console.error("Error rendering cover letter template:", error);
        return <div className="p-4 text-red-500">Error rendering template: {String(error)}</div>;
      }
    }
    
    console.log("No component property found in template metadata");
    return <div className="p-4 text-red-500">Template component not available</div>;
  };

  const hasCoverLetterData = data && Object.keys(data).length > 0;
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 1.5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.2));
  
  // Add reset to adaptive zoom function
  const resetToAdaptiveZoom = () => {
    const adaptiveZoom = calculateAdaptiveZoom();
    setScale(adaptiveZoom);
  };

  // Handle scroll positioning when scale changes (especially important for mobile zoom)
  useEffect(() => {
    // Small delay to ensure DOM has updated with new scale
    const timer = setTimeout(() => {
      const scrollContainer = document.querySelector('.flex-1.overflow-auto');
      const previewContainer = document.querySelector('.cover-letter-preview-container');
      
      if (scrollContainer && previewContainer && (isMobile || inMobileModal)) {
        // When zoomed in significantly, center the content initially
        if (scale > 0.7) {
          const containerWidth = scrollContainer.clientWidth;
          const contentWidth = 794 * scale; // A4 width * scale
          const scrollLeft = Math.max(0, (contentWidth - containerWidth) / 2);
          
          scrollContainer.scrollLeft = scrollLeft;
          scrollContainer.scrollTop = 0; // Reset to top when zooming
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [scale, isMobile, inMobileModal]);


  return (
    <div className={`flex h-full w-full flex-col relative ${inMobileModal || inDesktopPreview ? 'pt-0 mt-0' : ''}`}>
      {/* Controls bar - Fixed positioning with higher z-index */}
      <div className={`${(isMobile || inMobileModal) ? 'sticky top-0' : 'absolute top-0'} right-0 left-0 z-20 bg-white dark:bg-slate-900 bg-opacity-95 dark:bg-opacity-95 backdrop-blur-sm ${inMobileModal ? 'p-2' : 'p-3'} rounded-t-lg flex justify-between items-center border-b border-gray-200 dark:border-slate-700 shadow-sm`}>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-[40%]">
          {data?.template && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
              {data.template.replace(/-/g, ' ')} Cover Letter
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`${inMobileModal ? 'h-6 w-6' : 'h-7 w-7'} text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200`}
              onClick={zoomOut}
              title="Zoom out"
            >
              <ZoomOut className={`${inMobileModal ? 'h-3 w-3' : 'h-4 w-4'}`} />
            </Button>
            <button
              onClick={resetToAdaptiveZoom}
              className={`text-xs text-gray-600 dark:text-gray-300 font-medium ${inMobileModal ? 'px-1 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors`}
              title="Reset to fit screen"
            >
              {Math.round(scale * 100)}%
            </button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`${inMobileModal ? 'h-6 w-6' : 'h-7 w-7'} text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200`}
              onClick={zoomIn}
              title="Zoom in"
            >
              <ZoomIn className={`${inMobileModal ? 'h-3 w-3' : 'h-4 w-4'}`} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Preview area with proper spacing to avoid overlap */}
      <div 
        className={`flex-1 overflow-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 rounded-lg ${
          inMobileModal 
            ? 'pt-16 pb-4 px-2' 
            : inDesktopPreview 
              ? 'pt-20 pb-4 px-4'
              : isMobile 
                ? 'pt-20 pb-4 px-2' 
                : 'pt-24 pb-8 px-8'
        }`}
        style={{
          // Enable smooth scrolling and proper touch scrolling on mobile
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          // Ensure scrollbars are visible when needed
          overflowX: 'auto',
          overflowY: 'auto',
        }}
      >
        {hasCoverLetterData ? (
          <div 
            className="cover-letter-preview-container transition-all duration-300 ease-in-out flex items-start justify-center relative z-10"
            style={{
              transformOrigin: 'top center',
              paddingTop: (isMobile || inMobileModal) ? '10px' : '20px',
              paddingBottom: (isMobile || inMobileModal) ? '10px' : '20px',
              // Calculate minimum dimensions based on scaled content
              minWidth: `${794 * scale + 40}px`, // A4 width * scale + padding
              minHeight: `${1123 * scale + 40}px`, // A4 height * scale + padding
              width: scale > 0.8 ? `${794 * scale + 40}px` : '100%',
              height: scale > 0.8 ? `${1123 * scale + 40}px` : 'auto',
            }}
          >
            {/* Drop shadow and paper effect - only on larger screens */}
            {!isMobile && !inMobileModal && (
              <>
                <div className="absolute -bottom-2 left-1 right-1 bg-black opacity-5 blur-md rounded-lg" style={{ transform: `scale(${scale})`, transformOrigin: 'top center', height: 'calc(100% + 8px)' }}></div>
                <div className="absolute -right-2 top-1 bottom-1 bg-black opacity-5 blur-md rounded-lg" style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: 'calc(210mm + 8px)' }}></div>
              </>
            )}
            
            {/* Main cover letter paper - always white even in dark mode */}
            <div 
              className={`bg-white rounded-md shadow-lg relative z-10 ${inMobileModal || inDesktopPreview ? 'rounded-t-none' : ''}`}
              style={{
                width: '210mm',
                minHeight: (isMobile || inMobileModal) ? 'auto' : '297mm',
                height: 'auto',
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                boxShadow: (isMobile || inMobileModal) 
                  ? (isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)')
                  : (isDarkMode ? '0 10px 30px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.25)' : '0 10px 30px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.12)')
              }}
            >
              <div 
                className="w-full h-full relative z-20"
                style={{ backgroundColor: 'white' }}
              >
                {/* Always show the template preview */}
                {renderCoverLetterTemplate()}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 h-64 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-md w-full max-w-md text-center relative z-10">
            <div className="mb-4">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-400 dark:text-gray-500 mb-1">Cover letter preview will appear here</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{isMobile ? 'Complete the form fields to generate your cover letter' : 'Fill out the form sections to build your cover letter'}</p>
          </div>
        )}
      </div>
      
      {/* Mobile indicator for zoom controls */}
      {(isMobile || inMobileModal) && hasCoverLetterData && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="bg-black/20 dark:bg-white/20 rounded-full py-1 px-3 backdrop-blur-sm">
            <p className="text-xs text-black/70 dark:text-white/70 text-center">
              {scale > 0.7 ? 'Swipe to scroll • ' : 'Pinch to zoom • '}Current: {Math.round(scale * 100)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 