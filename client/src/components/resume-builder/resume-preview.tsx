import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { TemplateFactory } from "@/templates/core/TemplateFactory";
import { registerTemplates } from "@/templates/registerTemplates";
import ResumeDownloadButton from "@/components/resume-download-button";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedResumeDownloadButton } from "@/pages/resume-builder";

// Define a more flexible resume data interface for the preview
interface ResumePreviewProps {
  data: any; // Use any to accept the builder's data format
  hideDownloadButton?: boolean; // Add prop to hide download button
}

// Format date for display - needed because template still expects this
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
};

// Truncate summary to max characters
const MAX_SUMMARY_CHARS = 300;

// REMOVE: Don't register templates at the module level
// This causes recursive imports and stack overflow
// registerTemplates();

export default function ResumePreview({ data, hideDownloadButton = false }: ResumePreviewProps) {
  // Add zoom control with better initial value
  const [scale, setScale] = useState(1);
  // Track viewport width for responsive adjustments
  const [isMobile, setIsMobile] = useState(false);
  // Track if dark mode is enabled
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Track page break indicators visibility
  const [showPageBreaks, setShowPageBreaks] = useState(true);
  // Track actual page break positions
  const [pageBreakPositions, setPageBreakPositions] = useState<number[]>([]);
  // Track debug info about page breaks
  const [pageBreakDebugInfo, setPageBreakDebugInfo] = useState<string[]>([]);
  // Ref for the resume content container
  const resumeContentRef = useRef<HTMLDivElement>(null);
  // Track server-side page break calculation mode
  const [useServerPreview, setUseServerPreview] = useState(false);
  // Track PDF image preview mode (100% accurate)
  const [usePdfPreview, setUsePdfPreview] = useState(false);
  // Store PDF preview images
  const [pdfPreviewImages, setPdfPreviewImages] = useState<Array<{page: number, image: string}>>([]);
  
  // Register templates on mount instead of at module level
  useEffect(() => {
    try {
      registerTemplates();
    } catch (error) {
      console.error("Error registering templates in ResumePreview:", error);
    }
  }, []);

  // Function to calculate actual page break positions
  const calculateActualPageBreaks = useCallback(() => {
    if (!resumeContentRef.current || !showPageBreaks) {
      setPageBreakPositions([]);
      setPageBreakDebugInfo([]);
      return;
    }

    try {
      const container = resumeContentRef.current;
      const pageHeight = 297; // A4 height in mm
      
      // Use standard conversion: 96 DPI browser standard
      const mmToPx = 96 / 25.4; // ~3.779 pixels per mm
      const actualMmToPx = mmToPx * scale;
      const pageHeightPx = pageHeight * actualMmToPx;
      
      // Get all elements that have page break CSS rules
      const avoidBreakElements = container.querySelectorAll('.experience-item, .education-item, .project-item, .certification-item, .resume-section h2, .resume-section h3');
      
      // Calculate page breaks considering CSS rules only
      const breakPositions: number[] = [];
      const debugInfo: string[] = [];
      
      let currentPageTop = 0;
      let pageNumber = 1;
      
      debugInfo.push(`🔧 CSS-driven page breaks only`);
      debugInfo.push(`Page height: ${pageHeight}mm (${Math.round(pageHeightPx)}px)`);
      debugInfo.push(`Scale: ${scale}`);
      debugInfo.push(`Found ${avoidBreakElements.length} elements with page-break rules`);
      
      // Check each element that has page-break-inside: avoid
      avoidBreakElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate position relative to container in mm
        const elementTopPx = rect.top - containerRect.top;
        const elementBottomPx = rect.bottom - containerRect.top;
        const elementTopMm = elementTopPx / actualMmToPx;
        const elementBottomMm = elementBottomPx / actualMmToPx;
        const elementHeightMm = elementBottomMm - elementTopMm;
        
        // Check if this element would span across a natural page boundary
        const currentPageEnd = (pageNumber * pageHeight);
        const nextPageStart = currentPageEnd;
        
        // If element starts before page end but extends beyond it
        if (elementTopMm < currentPageEnd && elementBottomMm > currentPageEnd) {
          // This element would be split across pages
          const computedStyle = window.getComputedStyle(element);
          const pageBreakInside = computedStyle.getPropertyValue('page-break-inside');
          
          // If CSS says avoid breaking inside this element
          if (pageBreakInside === 'avoid' || element.classList.contains('experience-item') || 
              element.classList.contains('education-item') || element.classList.contains('project-item') || 
              element.classList.contains('certification-item')) {
            
            // Force a page break before this element
            const pageBreakPosition = elementTopMm;
            
            // Only add if it's not too close to existing breaks and not at the very start
            const minDistance = 50; // Minimum 50mm between breaks
            const tooCloseToExisting = breakPositions.some(pos => Math.abs(pos - pageBreakPosition) < minDistance);
            
            if (pageBreakPosition > minDistance && !tooCloseToExisting) {
              breakPositions.push(pageBreakPosition);
              debugInfo.push(`🔧 CSS break at ${Math.round(pageBreakPosition)}mm (${element.className}) - element would split`);
              
              // Update page tracking
              pageNumber = Math.floor(pageBreakPosition / pageHeight) + 1;
            }
          }
        }
        
        // Update current page if we've moved significantly
        if (elementBottomMm > currentPageTop + pageHeight) {
          pageNumber = Math.floor(elementBottomMm / pageHeight) + 1;
        }
      });
      
      // Sort breaks by position
      breakPositions.sort((a, b) => a - b);
      
      const contentHeightPx = container.scrollHeight;
      const contentHeightMm = contentHeightPx / actualMmToPx;
      
      debugInfo.push(`Total content: ${Math.round(contentHeightMm)}mm`);
      debugInfo.push(`CSS page breaks: [${breakPositions.map(p => Math.round(p)).join(', ')}]mm`);
      debugInfo.push(`Estimated pages: ${breakPositions.length + 1}`);
      
      setPageBreakPositions(breakPositions);
      setPageBreakDebugInfo(debugInfo);
      
    } catch (error) {
      console.error('Error calculating CSS-aware page breaks:', error);
      setPageBreakPositions([]);
      setPageBreakDebugInfo(['Error: ' + (error instanceof Error ? error.message : String(error))]);
    }
  }, [scale, showPageBreaks]);

  // Recalculate page breaks when content changes or scale changes
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateActualPageBreaks();
    }, 100); // Small delay to ensure content is rendered

    return () => clearTimeout(timer);
  }, [calculateActualPageBreaks, data, scale]);

  // Also recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(calculateActualPageBreaks, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateActualPageBreaks]);

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
      // On desktop, account for the sidebar (template selection takes ~40% of width)
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
  
  // Process data to ensure summary is truncated and achievements have bullet points
  const processedData = useMemo(() => {
    if (!data) return data;

    // Handler for null dates and formatting achievements
    const processNullDates = (obj: any): any => {
      if (!obj) return obj;
      
      // Process arrays of objects
      if (Array.isArray(obj)) {
        return obj.map(item => processNullDates(item));
      }
      
      // Process objects
      if (typeof obj === 'object') {
        const result: any = {};
        
        // Convert each property
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            // Handle dates
            if ((key === 'startDate' || key === 'endDate' || key === 'date' || key === 'publicationDate') && obj[key] === null) {
              result[key] = '';
            } 
            // Handle achievements arrays to ensure bullet points
            else if (key === 'achievements' && Array.isArray(obj[key])) {
              result[key] = obj[key].map((achievement: string) => {
                if (!achievement) return achievement;
                const trimmed = achievement.trim();
                // Add bullet point if it doesn't already have one
                return trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') ? 
                  trimmed : `• ${trimmed}`;
              });
            }
            else if (typeof obj[key] === 'object') {
              result[key] = processNullDates(obj[key]);
            } else {
              result[key] = obj[key];
            }
          }
        }
        
        return result;
      }
      
      return obj;
    };
    
    // Format URLs for display
    const formatContactUrls = (data: any) => {
      const result = { ...data };
      
      // Format LinkedIn URL
      if (result.linkedinUrl) {
        try {
          const url = new URL(result.linkedinUrl);
          let host = url.hostname;
          if (host.startsWith('www.')) {
            host = host.substring(4);
          }
          result.formattedLinkedinUrl = host + url.pathname;
        } catch (e) {
          result.formattedLinkedinUrl = result.linkedinUrl;
        }
      }
      
      // Format portfolio/website URL
      if (result.portfolioUrl) {
        try {
          const url = new URL(result.portfolioUrl);
          let host = url.hostname;
          if (host.startsWith('www.')) {
            host = host.substring(4);
          }
          result.formattedPortfolioUrl = host + url.pathname;
        } catch (e) {
          result.formattedPortfolioUrl = result.portfolioUrl;
        }
      }
      
      return result;
    };
    
    // Add contact separator to data for templates to use
    const addContactSeparator = (data: any) => {
      return {
        ...data,
        contactSeparator: "|", // Compact separator for contact info
      };
    };
    
    return {
      ...addContactSeparator(formatContactUrls(processNullDates(data))),
      summary: data.summary && data.summary.length > MAX_SUMMARY_CHARS 
        ? data.summary.substring(0, MAX_SUMMARY_CHARS - 3) + "..."
        : data.summary,
      formatDate: formatDate, // Add formatDate function to the data for templates that need it
      sectionOrder: data.sectionOrder || ["summary", "workExperience", "education", "skills", "projects", "publications", "certifications"] // Ensure sectionOrder exists with default fallback
    };
  }, [data]);

  // Get template from factory
  const template = useMemo(() => {
    if (!processedData?.template) {
      console.log("No template specified in data:", processedData);
      return null;
    }
    
    try {
      console.log("Getting template for:", processedData.template);
      const factory = TemplateFactory.getInstance();
      const registeredTypes = factory.getRegisteredTypes();
      console.log("Registered template types:", registeredTypes);
      
      const template = factory.getTemplate(processedData.template);
      console.log("Template found:", template ? "Yes" : "No", template);
      
      return template;
    } catch (error) {
      console.error("Error getting template:", error);
      return null;
    }
  }, [processedData?.template]);

  const hasResumeData = processedData && Object.keys(processedData).length > 0;
  
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
              {data.template.replace(/-/g, ' ')}
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
          
          {/* Page break toggle */}
          <Button 
            variant={showPageBreaks ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowPageBreaks(!showPageBreaks)}
            title={showPageBreaks ? "Hide page breaks" : "Show page breaks"}
          >
            {showPageBreaks ? "📄" : "📋"} Pages
          </Button>
          
          {hasResumeData && template && !hideDownloadButton && (
            <AnimatedResumeDownloadButton 
              resumeData={processedData}
              className="h-8 text-xs" 
            />
          )}
        </div>
      </div>
      
      {/* Preview area with proper spacing to avoid overlap */}
      <div className={`flex-1 flex items-start justify-center overflow-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 rounded-lg ${isMobile ? 'pt-20 pb-4 px-2' : 'pt-24 pb-8 px-8'}`}>
        {hasResumeData && template ? (
          <div 
            className="resume-preview-container transition-all duration-300 ease-in-out w-full flex items-start justify-center relative z-10"
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
            
            {/* Main resume paper - always white even in dark mode */}
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
              {/* Page break indicators - only for preview */}
              {showPageBreaks && pageBreakPositions.length > 0 && (
                <div className="absolute inset-0 pointer-events-none z-30">
                  {pageBreakPositions.map((position, index) => (
                    <div key={`page-break-${position}`}>
                      {/* CSS-driven page break line */}
                      <div 
                        className="absolute left-0 right-0 border-b-2 border-dashed border-orange-500/80"
                        style={{ top: `${position}mm` }}
                      >
                        {/* Page end indicator */}
                        <div className="absolute -top-7 right-2 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md bg-gradient-to-r from-orange-500 to-red-600">
                          Page {index + 1} End 🔧
                        </div>
                      </div>
                      
                      {/* Page start indicator for next page */}
                      <div 
                        className="absolute left-0 right-0"
                        style={{ top: `${position + 3}mm` }}
                      >
                        <div className="absolute top-2 left-2 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md bg-gradient-to-r from-green-500 to-emerald-600">
                          Page {index + 2} Start 🔧
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Page 1 Start indicator */}
                  <div className="absolute top-2 left-2 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md bg-gradient-to-r from-green-500 to-emerald-600">
                    Page 1
                  </div>
                </div>
              )}

              <div 
                ref={resumeContentRef}
                className="w-full relative z-20"
                style={{ backgroundColor: 'white' }}
              >
                {/* Always show the template preview with CSS-aware page breaks */}
                {template.renderPreview(processedData)}
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
            <p className="text-gray-400 dark:text-gray-500 mb-1">Resume preview will appear here</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{isMobile ? 'Complete the form fields to generate your resume' : 'Fill out the form sections to build your resume'}</p>
          </div>
        )}
      </div>
      
      {/* Mobile indicator for zoom controls */}
      {isMobile && hasResumeData && (
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