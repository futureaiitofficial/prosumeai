import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle, FileCheck, Settings, FilePlus } from "lucide-react";
import { TemplateFactory } from "@/templates/core/TemplateFactory";
import { useToast } from "@/hooks/use-toast";
import { registerTemplates } from "@/templates/registerTemplates";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface ResumeDownloadButtonProps {
  resumeData: any; // Use any to accept different resume data structures
  className?: string;
}

// 3D PDF Generation Animation Component
const ResumeLoaderAnimation = () => {
  const paperVariants = {
    initial: { y: -5, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const barVariants = {
    initial: {
      scaleY: 0.5,
      opacity: 0,
    },
    animate: {
      scaleY: 1,
      opacity: 1,
      transition: {
        repeat: Infinity,
        repeatType: "mirror" as const,
        duration: 1,
        ease: "circIn",
      },
    },
  };

  return (
    <div className="flex flex-col items-center gap-4 py-8 px-4">
      {/* Paper with shadow effect */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={paperVariants}
        className="w-28 h-36 bg-white rounded-md shadow-lg relative flex items-center justify-center"
        style={{
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
        }}
      >
        {/* Lines on paper */}
        <div className="absolute top-0 left-0 right-0 bottom-0 p-4 flex flex-col gap-2 opacity-60">
          <div className="h-2 bg-gray-200 rounded-full w-full"></div>
          <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
          <div className="h-2 bg-gray-200 rounded-full w-full"></div>
          <div className="h-2 bg-gray-200 rounded-full w-5/6"></div>
          <div className="h-2 bg-gray-200 rounded-full w-full"></div>
          <div className="h-2 bg-gray-200 rounded-full w-4/5"></div>
        </div>
        
        {/* PDF icon overlay */}
        <div className="absolute bottom-4 right-4 text-red-500 opacity-40 font-bold text-xs">
          PDF
        </div>
      </motion.div>
      
      {/* Bar loader */}
      <motion.div
        transition={{
          staggerChildren: 0.15,
        }}
        initial="initial"
        animate="animate"
        className="flex gap-1 mt-2"
      >
        <motion.div variants={barVariants} className="h-8 w-1.5 bg-blue-500 rounded-full" />
        <motion.div variants={barVariants} className="h-8 w-1.5 bg-blue-500 rounded-full" />
        <motion.div variants={barVariants} className="h-8 w-1.5 bg-blue-500 rounded-full" />
        <motion.div variants={barVariants} className="h-8 w-1.5 bg-blue-500 rounded-full" />
        <motion.div variants={barVariants} className="h-8 w-1.5 bg-blue-500 rounded-full" />
      </motion.div>
      
      <p className="text-sm text-center text-gray-700 dark:text-gray-300 font-medium">
        Preparing your document...
      </p>
    </div>
  );
};

// Helper type guard to check for our custom API error structure
function isApiError(error: any): error is { statusCode: number; data?: { error?: string; message?: string; current?: number; limit?: number | null } } {
  return typeof error === 'object' && error !== null && typeof error.statusCode === 'number';
}

export default function ResumeDownloadButton({ resumeData, className }: ResumeDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'generating' | 'downloading' | 'error'>('idle');
  const [showAnimation, setShowAnimation] = useState(false);
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
      setShowAnimation(true); // Show the animation
      
      // Set animation start time to enforce minimum display duration
      const animationStartTime = Date.now();
      const minimumAnimationDuration = 3000; // 3 seconds minimum display time
      
      // Check for large content and warn user if needed
      if (hasLargeContent()) {
        toast({
          title: "Preparing Multi-Page Resume",
          description: "Your resume has substantial content and will likely generate multiple pages.",
          duration: 5000,
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
      
      // Ensure animation shows for minimum time before download
      const elapsedTime = Date.now() - animationStartTime;
      const remainingTime = Math.max(0, minimumAnimationDuration - elapsedTime);
      
      // Wait to ensure animation displays for minimum time
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      
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
        
        // Keep animation visible for a bit after download starts
        setTimeout(() => {
          setStatus('idle');
          setShowAnimation(false); // Hide the animation
        }, 500);
      }, 500);
      
    } catch (error: any) {
      console.error("Error downloading resume:", error);
      console.log("Caught error structure:", error);

      // Hide the animation
      setShowAnimation(false);
      
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
        // We won't set showAnimation to false here anymore
        // as we're controlling it more precisely above
      }, 1000);
    }
  };

  const retryDownload = () => {
    setHasError(false);
    setStatus('idle');
    handleDownload();
  };

  // If already downloading, show loading state or animation dialog
  if (showAnimation) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-80 overflow-hidden"
        >
          <ResumeLoaderAnimation />
          <div className="px-4 pb-4 flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAnimation(false)}
              className="mt-2"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // For error state
  if (status === 'error') {
    return (
      <Button
        onClick={retryDownload}
        variant="destructive"
        size="sm"
        className={className}
      >
        <AlertCircle className="mr-2 h-4 w-4" /> Retry
      </Button>
    );
  }

  // Default state
  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      size="sm"
      className={className}
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </>
      )}
    </Button>
  );
} 