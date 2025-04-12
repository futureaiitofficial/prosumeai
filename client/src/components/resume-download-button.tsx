import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle, FileCheck, Settings, FilePlus } from "lucide-react";
import { TemplateFactory } from "@/templates/core/TemplateFactory";
import { useToast } from "@/hooks/use-toast";
import { registerTemplates } from "@/templates/registerTemplates";
import { apiRequest } from "@/lib/queryClient";

interface ResumeDownloadButtonProps {
  resumeData: any; // Use any to accept different resume data structures
  className?: string;
}

// Helper type guard to check for our custom API error structure
function isApiError(error: any): error is { statusCode: number; data?: { error?: string; message?: string; current?: number; limit?: number | null } } {
  return typeof error === 'object' && error !== null && typeof error.statusCode === 'number';
}

export default function ResumeDownloadButton({ resumeData, className }: ResumeDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'generating' | 'downloading' | 'error'>('idle');
  const { toast } = useToast();
  
  // Register templates on component mount with retry
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const registerTemplatesWithRetry = () => {
      try {
        registerTemplates();
        console.log("Templates registered successfully on component mount");
        setStatus('idle');
      } catch (error) {
        console.error(`Error registering templates (attempt ${retryCount + 1}/${maxRetries}):`, error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(registerTemplatesWithRetry, 500);
        } else {
          setStatus('error');
          toast({
            title: "Template Registration Failed",
            description: "Could not register resume templates. Try refreshing the page.",
            variant: "destructive",
          });
        }
      }
    };
    
    registerTemplatesWithRetry();
  }, [toast]);

  // Handle large content
  const hasLargeContent = () => {
    // Count total number of content entries (experiences, education, projects, certifications)
    const experienceCount = resumeData.workExperience?.length || 0;
    const educationCount = resumeData.education?.length || 0;
    const projectCount = resumeData.projects?.length || 0;
    const certificationCount = resumeData.certifications?.length || 0;
    
    // Count achievements across all experiences
    let achievementCount = 0;
    if (resumeData.workExperience) {
      resumeData.workExperience.forEach((exp: any) => {
        achievementCount += exp.achievements?.length || 0;
      });
    }
    
    // If total content exceeds a threshold, it's likely to span multiple pages
    return (experienceCount + educationCount + projectCount + certificationCount + achievementCount) > 15;
  };

  // Function to safely generate a filename from resume data
  const getSafeFilename = () => {
    try {
      // Default to "Resume" if no name is available
      const baseName = resumeData.fullName ? 
        resumeData.fullName.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_') : 
        "Resume";
      return `${baseName}_${new Date().toISOString().split('T')[0]}.pdf`;
    } catch (error) {
      console.warn("Error creating filename, using default:", error);
      return "Resume.pdf";
    }
  };

  const handleDownload = async () => {
    if (!resumeData.template) {
      console.error("No template selected");
      toast({
        title: "Template Required",
        description: "Please select a resume template first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDownloading(true);
      setHasError(false);
      setStatus('preparing');
      
      // Check for large content and warn user if needed
      if (hasLargeContent()) {
        toast({
          title: "Preparing Multi-Page Resume",
          description: "Your resume has substantial content and will likely generate multiple pages.",
          duration: 5000,
        });
      } else {
        toast({
          title: "Preparing your resume",
          description: "This may take a few seconds...",
        });
      }
      
      console.log("Starting download process", {
        templateName: resumeData.template,
        dataFields: Object.keys(resumeData),
        hasSkills: Boolean(resumeData.skills?.length),
        hasWorkExperience: Boolean(resumeData.workExperience?.length),
      });
      
      // Re-register templates to ensure they're available
      try {
        registerTemplates();
        console.log("Templates re-registered for download");
      } catch (registerError: unknown) {
        console.error("Error re-registering templates:", registerError);
        throw new Error(`Template registration failed: ${registerError instanceof Error ? registerError.message : 'Unknown error'}`);
      }
      
      // Get the template factory and check registered templates
      const templateFactory = TemplateFactory.getInstance();
      const registeredTypes = templateFactory.getRegisteredTypes();
      console.log("Available template types:", registeredTypes);
      
      if (!registeredTypes.includes(resumeData.template)) {
        throw new Error(`Template "${resumeData.template}" not found in registered templates: ${registeredTypes.join(', ')}`);
      }
      
      // Get the template instance
      const template = templateFactory.getTemplate(resumeData.template);
      
      if (!template) {
        throw new Error(`Failed to instantiate template: ${resumeData.template}`);
      }
      
      setStatus('generating');
      console.log("Template instance found, generating PDF...");
      
      // Generate PDF blob with a timeout to prevent hanging
      let timeoutId: number;
      const pdfPromise = Promise.race([
        template.exportToPDF(resumeData),
        new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => {
            reject(new Error("PDF generation timed out after 45 seconds"));
          }, 45000); // Increased timeout for complex multi-page resumes
        })
      ]).finally(() => clearTimeout(timeoutId));
      
      const pdfBlob = await pdfPromise;
      
      console.log("PDF blob generated successfully", {
        size: pdfBlob.size,
        type: pdfBlob.type
      });
      
      if (!pdfBlob || pdfBlob.size < 1000) {
        throw new Error(`Generated PDF is too small (${pdfBlob.size} bytes). Possible rendering issue.`);
      }
      
      setStatus('downloading');
      
      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getSafeFilename();
      
      // Wait a moment before triggering download
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Trigger download
      document.body.appendChild(link);
      console.log("Triggering download");
      link.click();
      
      // Cleanup after a short delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
        console.log("Download link removed, URL revoked");
        
        // Show success notification
        const fileSize = Math.round(pdfBlob.size / 1024); // Size in KB
        toast({
          title: "Resume Downloaded!",
          description: hasLargeContent() 
            ? `Your multi-page resume (${fileSize} KB) has been downloaded successfully.` 
            : `Your resume has been downloaded successfully.`,
          duration: 5000,
        });
        
        setStatus('idle');
      }, 500);
      
    } catch (error: any) {
      console.error("Error downloading resume:", error);
      console.log("Caught error structure:", error);

      // Handle other errors
      setHasError(true);
      setStatus('error');
      
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
          if (error.message.includes("timeout")) {
             errorMessage = "PDF generation timed out..."; // Shortened for brevity
          } else if (error.message.includes("too small")) {
             errorMessage = "The generated PDF appears to be empty..."; // Shortened
          } else if (error.message.includes("not found")) {
             errorMessage = "Template not available..."; // Shortened
          } else {
             errorMessage = isApiError(error) ? (error.data?.message || error.message) : error.message;
          }
      } else if (typeof error === 'string') {
         errorMessage = error;
      } else if (isApiError(error) && error.data?.message) {
         errorMessage = error.data.message;
      }
      
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        if (!hasError) {
          setStatus('idle');
        }
      }, 1000);
    }
  };

  const retryDownload = () => {
    setHasError(false);
    setStatus('idle');
    handleDownload();
  };
  
  if (hasError) {
    return (
      <Button 
        onClick={retryDownload} 
        className={className}
        variant="destructive"
        size="sm"
      >
        <AlertCircle className="mr-2 h-4 w-4" />
        Retry Download
      </Button>
    );
  }
  
  if (status === 'preparing') {
    return (
      <Button 
        disabled
        className={className}
        variant="outline"
        size="sm"
      >
        <Settings className="mr-2 h-4 w-4 animate-spin" />
        Preparing...
      </Button>
    );
  }
  
  if (status === 'generating') {
    return (
      <Button 
        disabled
        className={className}
        variant="outline"
        size="sm"
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {hasLargeContent() ? "Generating Multi-Page PDF..." : "Generating PDF..."}
      </Button>
    );
  }
  
  if (status === 'downloading') {
    return (
      <Button 
        disabled
        className={className}
        variant="outline"
        size="sm"
      >
        <FileCheck className="mr-2 h-4 w-4 animate-pulse" />
        Downloading...
      </Button>
    );
  }

  return (
    <div>
        <Button 
          onClick={handleDownload} 
          disabled={isDownloading || !resumeData.template}
          className={className}
          variant="outline"
          size="sm"
          title="Download your resume as a PDF"
        >
          {hasLargeContent() ? (
            <>
              <FilePlus className="mr-2 h-4 w-4" />
              Download Multi-Page PDF
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
    </div>
  );
} 