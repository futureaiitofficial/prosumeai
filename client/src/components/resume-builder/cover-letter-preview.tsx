import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { coverLetterTemplateMetadata } from "@/templates/registerCoverLetterTemplates";
import { ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define a cover letter preview props interface
interface CoverLetterPreviewProps {
  data: any; // Use any to accept the builder's data format
  hideDownloadButton?: boolean; // Add prop to hide download button
}

// REMOVE: Don't register templates at the module level
// This causes recursive imports and stack overflow

export default function CoverLetterPreview({ data, hideDownloadButton = false }: CoverLetterPreviewProps) {
  // Add zoom control with better initial value
  const [scale, setScale] = useState(1);
  // Track viewport width for responsive adjustments
  const [isMobile, setIsMobile] = useState(false);
  // Track if dark mode is enabled
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Calculate adaptive zoom based on screen size
  const calculateAdaptiveZoom = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Calculate scale based on available space
    // Standard A4 dimensions: 210mm x 297mm (roughly 794px x 1123px at 96 DPI)
    const paperWidth = 794;
    const paperHeight = 1123;
    
    // Account for the split layout - the preview typically takes about 60% of width on desktop
    // and full width on mobile, minus padding and controls
    let availableWidth, availableHeight;
    
    if (isMobile) {
      // On mobile, use most of the screen width
      availableWidth = width - 40; // Account for padding
      availableHeight = height - 180; // Account for header, controls, and navigation
    } else {
      // On desktop, account for the sidebar (cover letter form takes ~40% of width)
      // The preview area is approximately 60% of the total width
      const previewAreaWidth = width * 0.6; // Approximate preview area width
      availableWidth = previewAreaWidth - 100; // Account for padding within preview area
      availableHeight = height - 200; // Account for header, controls, and padding
    }
    
    // Calculate scale to fit both width and height
    const scaleByWidth = availableWidth / paperWidth;
    const scaleByHeight = availableHeight / paperHeight;
    
    // Use the smaller scale to ensure it fits, with reasonable min/max bounds
    let adaptiveScale = Math.min(scaleByWidth, scaleByHeight);
    
    // Apply reasonable bounds with better defaults for different screen sizes
    if (isMobile) {
      adaptiveScale = Math.max(0.4, Math.min(1.0, adaptiveScale));
    } else {
      adaptiveScale = Math.max(0.5, Math.min(1.2, adaptiveScale));
    }
    
    // Round to nearest 0.05 for cleaner values
    const finalScale = Math.round(adaptiveScale * 20) / 20;
    
    return finalScale;
  };
  
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
  }, [isMobile]);

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

  return (
    <div className="flex h-full w-full flex-col relative">
      {/* Controls bar - Fixed positioning with higher z-index */}
      <div className={`${isMobile ? 'sticky top-0' : 'absolute top-0'} right-0 left-0 z-20 bg-white dark:bg-slate-900 bg-opacity-95 dark:bg-opacity-95 backdrop-blur-sm p-3 rounded-t-lg flex justify-between items-center border-b border-gray-200 dark:border-slate-700 shadow-sm`}>
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
              className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              onClick={zoomOut}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <button
              onClick={resetToAdaptiveZoom}
              className="text-xs text-gray-600 dark:text-gray-300 font-medium px-2 py-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Reset to fit screen"
            >
              {Math.round(scale * 100)}%
            </button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              onClick={zoomIn}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Preview area with proper spacing to avoid overlap */}
      <div className={`flex-1 flex items-start justify-center overflow-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 rounded-lg ${isMobile ? 'pt-20 pb-4 px-2' : 'pt-24 pb-8 px-8'}`}>
        {hasCoverLetterData ? (
          <div 
            className="cover-letter-preview-container transition-all duration-300 ease-in-out w-full flex items-start justify-center relative z-10"
            style={{
              transformOrigin: 'top center',
              paddingTop: isMobile ? '10px' : '20px',
              paddingBottom: isMobile ? '10px' : '20px',
            }}
          >
            {/* Drop shadow and paper effect - only on larger screens */}
            {!isMobile && (
              <>
                <div className="absolute -bottom-2 left-1 right-1 bg-black opacity-5 blur-md rounded-lg" style={{ transform: `scale(${scale})`, transformOrigin: 'top center', height: 'calc(100% + 8px)' }}></div>
                <div className="absolute -right-2 top-1 bottom-1 bg-black opacity-5 blur-md rounded-lg" style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: 'calc(210mm + 8px)' }}></div>
              </>
            )}
            
            {/* Main cover letter paper - always white even in dark mode */}
            <div 
              className="bg-white rounded-md shadow-lg relative z-10"
              style={{
                width: '210mm',
                minHeight: isMobile ? 'auto' : '297mm',
                height: 'auto',
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                boxShadow: isMobile 
                  ? (isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)')
                  : (isDarkMode ? '0 10px 30px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.25)' : '0 10px 30px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.12)')
              }}
            >
              <div 
                className="w-full relative z-20"
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
      {isMobile && hasCoverLetterData && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="bg-black/20 dark:bg-white/20 rounded-full py-1 px-3 backdrop-blur-sm">
            <p className="text-xs text-black/70 dark:text-white/70 text-center">
              Pinch to zoom • Current: {Math.round(scale * 100)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 