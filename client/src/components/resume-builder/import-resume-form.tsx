import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, FileX, Loader2, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ImportResumeFormProps {
  data: any;
  updateData: (data: any) => void;
}

export default function ImportResumeForm({ updateData }: ImportResumeFormProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseProgress, setParseProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resume parsing mutation
  const parseResumeMutation = useMutation({
    mutationFn: async (fileData: FormData) => {
      setParseProgress(10);
      
      try {
        // Set up a timeout to abort the request if it takes too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const res = await apiRequest(
          "POST", 
          "/api/ai/parse-resume", 
          fileData,
          { 
            isFormData: true,
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);
        setParseProgress(70);
        
        // Check response status
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `Error ${res.status}: ${res.statusText}`);
        }
        
        setParseProgress(90);
        return await res.json();
      } catch (error: any) {
        console.error("Resume parsing error:", error);
        
        // Handle specific error cases
        if (error.name === 'AbortError') {
          throw new Error("Request timed out. The server took too long to respond.");
        }
        
        // For server errors, consider retrying
        if (error.message.includes("500") || error.message.includes("503")) {
          if (retryCount < maxRetries) {
            throw new Error("SERVER_RETRY_NEEDED");
          }
        }
        
        throw error;
      } finally {
        setParseProgress(100);
      }
    },
    onSuccess: (data) => {
      // Reset any retry count on success
      setRetryCount(0);
      
      // Handle potentially missing fields by providing defaults
      const mappedData = {
        fullName: data.personalInfo?.fullName || "",
        email: data.personalInfo?.email || "",
        phone: data.personalInfo?.phone || "",
        location: data.personalInfo?.location || "",
        country: data.personalInfo?.country || "",
        city: data.personalInfo?.city || "",
        linkedinUrl: data.personalInfo?.linkedinUrl || "",
        portfolioUrl: data.personalInfo?.portfolioUrl || "",
        summary: data.summary || "",
        workExperience: Array.isArray(data.workExperience) ? data.workExperience : [],
        education: Array.isArray(data.education) ? data.education : [],
        skills: Array.isArray(data.skills) ? data.skills : [],
        technicalSkills: Array.isArray(data.technicalSkills) ? data.technicalSkills : [],
        softSkills: Array.isArray(data.softSkills) ? data.softSkills : [],
        certifications: Array.isArray(data.certifications) ? data.certifications : [],
        projects: Array.isArray(data.projects) ? data.projects : []
      };
      
      updateData(mappedData);
      
      // Show detailed feedback to the user
      const emptyFields = Object.entries(mappedData)
        .filter(([key, value]) => {
          return Array.isArray(value) ? value.length === 0 : !value;
        })
        .map(([key]) => key);
      
      if (emptyFields.length > 0) {
        const fieldNames = emptyFields.map(field => {
          // Convert camelCase to readable format
          return field.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
        }).join(', ');
        
        toast({
          title: "Resume imported with some gaps",
          description: `We couldn't extract: ${fieldNames}. Please fill these sections manually.`,
          duration: 8000,
        });
      } else {
        toast({
          title: "Resume imported successfully",
          description: "Your resume has been parsed. Please review each section carefully.",
          duration: 6000,
        });
      }
    },
    onError: (error: Error) => {
      console.error("Resume parsing error:", error);
      
      // Special case for retry
      if (error.message === "SERVER_RETRY_NEEDED") {
        setRetryCount(prev => prev + 1);
        
        toast({
          title: `Retrying (${retryCount + 1}/${maxRetries})...`,
          description: "The server encountered an issue. Retrying automatically...",
        });
        
        // Retry the operation with the same file
        if (selectedFile) {
          setTimeout(() => {
            const formData = new FormData();
            formData.append('resume', selectedFile);
            parseResumeMutation.mutate(formData);
          }, 2000); // Wait 2 seconds before retrying
        }
        return;
      }
      
      // Handle specific error messages for better user feedback
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        toast({
          title: "Resume too complex",
          description: "Your resume contains too much text to process. Try uploading a shorter resume or wait a few minutes before trying again.",
          variant: "destructive",
        });
      } else if (error.message.includes("timeout") || error.message.includes("timed out")) {
        toast({
          title: "Request Timeout",
          description: "The server took too long to process your resume. Try again with a simpler document.",
          variant: "destructive",
        });
      } else if (error.message.includes("500")) {
        toast({
          title: "Server Error",
          description: "There was a problem processing your resume. Please try again with a simpler or shorter resume.",
          variant: "destructive",
        });
      } else if (error.message.includes("401") || error.message.includes("authentication")) {
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please refresh the page and try again.",
          variant: "destructive",
        });
      } else if (error.message.includes("404")) {
        toast({
          title: "API Endpoint Not Found",
          description: "The resume parsing service is currently unavailable. Please contact support or try again later.",
          variant: "destructive",
        });
      } else if (error.message.includes("API_CONFIGURATION_ERROR") || error.message.includes("API key")) {
        toast({
          title: "AI Service Configuration Error",
          description: "The AI service is not properly configured. Please contact an administrator to set up the OpenAI API key.",
          variant: "destructive",
          duration: 8000,
        });
      } else if (error.message.includes("unsupported") || error.message.includes("format")) {
        toast({
          title: "Unsupported Format",
          description: "The document format could not be processed. Please ensure you're uploading a valid DOCX file.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to parse resume",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
      
      // Reset progress on error
      setParseProgress(0);
    },
  });

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Process the first file
    const file = files[0];
    
    // Reset any existing progress
    setParseProgress(0);
    
    // Validate and handle the file
    handleFileSelect(file);
    
    // Reset the file input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const isValidResumeFile = (file: File): boolean => {
    // Check if file is one of the supported types
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/pdf', // .pdf
      'text/plain' // .txt
    ];
    
    // Check for valid mime type
    if (!allowedTypes.includes(file.type)) {
      // Also check by extension as a fallback
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!['docx', 'doc', 'pdf', 'txt'].includes(extension || '')) {
        toast({
          title: "Unsupported file format",
          description: "Please upload a DOCX, DOC, PDF, or TXT file.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB. Please upload a smaller file.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleFileSelect = (file: File) => {
    // Validate the file
    if (!isValidResumeFile(file)) {
      return;
    }
    
    setSelectedFile(file);
    
    // Auto-upload if file is valid
    const formData = new FormData();
    formData.append('resume', file);
    
    toast({
      title: "Processing resume...",
      description: "Extracting text content and analyzing with AI. This may take a moment.",
    });
    
    parseResumeMutation.mutate(formData);
  };

  // Handle manual retry
  const handleRetry = () => {
    if (!selectedFile) return;
    
    // Reset progress and retry count
    setParseProgress(0);
    setRetryCount(0);
    
    // Create new form data and submit
    const formData = new FormData();
    formData.append('resume', selectedFile);
    parseResumeMutation.mutate(formData);
  };

  // Handle form submission
  const handleImportResume = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a resume file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    // Reset progress before starting
    setParseProgress(0);
    
    const formData = new FormData();
    formData.append('resume', selectedFile);
    
    parseResumeMutation.mutate(formData);
  };

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    setParseProgress(0);
    setRetryCount(0);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Import Existing Resume</h2>
        <p className="text-muted-foreground">
          Upload your existing resume to automatically fill in your information. 
          We'll use AI to extract and organize your details.
          <span className="block mt-1 text-sm">(Supported formats: DOCX, DOC, PDF, TXT - Max 5MB)</span>
        </p>
        <div className="space-y-2">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
            <p><strong>How it works:</strong> Our AI will analyze your resume, extract key details, and populate the form fields automatically.</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>The more structured your resume is, the better the extraction will be</li>
              <li>You can review and edit any information after import</li>
              <li>All processing happens securely on our servers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Progress bar for parsing */}
      {parseProgress > 0 && parseProgress < 100 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Parsing resume...</span>
            <span>{parseProgress}%</span>
          </div>
          <Progress value={parseProgress} className="h-2" />
        </div>
      )}

      {/* File upload area */}
      <div className="mt-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
            dragActive ? "border-primary bg-primary/10" : "border-gray-300 dark:border-gray-600"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {!selectedFile && !parseResumeMutation.isPending ? (
            <>
              <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm mb-1">Drag and drop your resume file, or click to browse</p>
              <p className="text-xs text-gray-500">
                Supported formats: DOCX, DOC, PDF, TXT (Max 5MB)
              </p>
            </>
          ) : selectedFile && !parseResumeMutation.isPending ? (
            <div className="flex flex-col items-center">
              <FileText className="h-10 w-10 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium mb-1 text-primary">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearFile();
                }}
                className="mt-2"
              >
                <FileX className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-2" />
              <p className="text-sm font-medium mb-1">Processing resume...</p>
              <div className="w-full max-w-xs mx-auto mt-2">
                <Progress value={parseProgress} className="h-2" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Analyzing your resume with AI
              </p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".docx,.doc,.pdf,.txt"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Alternatively, skip */}
      <div className="flex justify-between items-center border-t pt-4 mt-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Don't have a resume? You can build one from scratch.
          </p>
        </div>
        <Button 
          type="button" 
          onClick={handleImportResume}
          disabled={!selectedFile || parseResumeMutation.isPending}
        >
          {parseResumeMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Parsing Resume...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import Resume
            </>
          )}
        </Button>
      </div>
    </div>
  );
}