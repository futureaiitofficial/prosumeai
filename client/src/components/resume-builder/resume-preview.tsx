import { useMemo, useState, useEffect } from "react";
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

// Register templates immediately
registerTemplates();

export default function ResumePreview({ data, hideDownloadButton = false }: ResumePreviewProps) {
  // Add zoom control
  const [scale, setScale] = useState(0.75);
  // Track viewport width for responsive adjustments
  const [isMobile, setIsMobile] = useState(false);
  // Track if dark mode is enabled
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Listen for window resize to adjust UI for mobile/desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      
      // Adjust scale based on screen width
      if (window.innerWidth < 500) {
        setScale(0.5);
      } else if (window.innerWidth < 768) {
        setScale(0.65);
      } else if (window.innerWidth < 1024) {
        setScale(0.7);
      } else {
        setScale(0.75);
      }
    };
    
    // Check if dark mode is enabled
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Check on initial load
    checkMobile();
    checkDarkMode();
    
    // Set up the resize listener
    window.addEventListener('resize', checkMobile);
    
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
      window.removeEventListener('resize', checkMobile);
      observer.disconnect();
    };
  }, []);
  
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
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 1.2));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.4));

  return (
    <div className="flex h-full w-full flex-col relative">
      {/* Controls bar */}
      <div className={`${isMobile ? 'sticky top-0' : 'absolute top-0'} right-0 left-0 z-10 bg-white dark:bg-slate-900 bg-opacity-90 dark:bg-opacity-90 backdrop-blur-sm p-2 rounded-t-lg flex justify-between items-center border-b border-gray-200 dark:border-slate-700`}>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-[40%]">
          {data?.template && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
              {data.template.replace(/-/g, ' ')}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-md p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              onClick={zoomOut}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium px-1">{Math.round(scale * 100)}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              onClick={zoomIn}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {hasResumeData && template && !hideDownloadButton && (
            <AnimatedResumeDownloadButton 
              resumeData={processedData}
              className="h-8 text-xs" 
            />
          )}
        </div>
      </div>
      
      {/* Preview area with paper background */}
      <div className={`flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 rounded-lg ${isMobile ? 'pt-12' : 'p-6 mt-8'}`}>
        {hasResumeData && template ? (
          <div 
            className="resume-preview-container transition-all duration-200 ease-in-out h-full w-full flex items-center justify-center"
            style={{
              transformOrigin: 'center center',
            }}
          >
            {/* Drop shadow and paper effect */}
            <div className="relative" style={{ transform: `scale(${scale})` }}>
              {/* Page shadows for 3D effect - only on larger screens */}
              {!isMobile && (
                <>
                  <div className="absolute -bottom-2 left-1 right-1 h-[297mm] bg-black opacity-5 blur-md rounded-lg"></div>
                  <div className="absolute -right-2 top-1 bottom-1 w-[210mm] bg-black opacity-5 blur-md rounded-lg"></div>
                </>
              )}
              
              {/* Main resume paper - always white even in dark mode */}
              <div 
                className="bg-white rounded-md shadow-lg"
                style={{
                  width: '210mm',
                  height: isMobile ? 'auto' : '297mm',
                  maxHeight: isMobile ? '100vh' : '297mm',
                  position: 'relative',
                  boxShadow: isMobile 
                    ? (isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)')
                    : (isDarkMode ? '0 10px 30px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.25)' : '0 10px 30px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.12)')
                }}
              >
                <div 
                  className={`w-full ${isMobile ? 'min-h-full' : 'h-full'} overflow-auto`}
                  style={{ backgroundColor: 'white' }}
                >
                  {template.renderPreview(processedData)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 h-64 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-md w-full max-w-md text-center">
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
      
      {/* Mobile indicator for scrollability */}
      {isMobile && hasResumeData && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <div className="bg-black/10 dark:bg-white/10 rounded-full py-1 px-3">
            <p className="text-xs text-black/60 dark:text-white/60 text-center">Scroll to view full resume</p>
          </div>
        </div>
      )}
    </div>
  );
} 