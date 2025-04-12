import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, FileX, Loader2 } from "lucide-react";

interface ImportResumeFormProps {
  data: any;
  updateData: (data: any) => void;
}

export default function ImportResumeForm({ updateData }: ImportResumeFormProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Resume parsing mutation
  const parseResumeMutation = useMutation({
    mutationFn: async (fileData: FormData) => {
      const res = await apiRequest(
        "POST", 
        "/api/resume-parse", 
        fileData,
        { isFormData: true }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      updateData({
        fullName: data.personalInfo.fullName || "",
        email: data.personalInfo.email || "",
        phone: data.personalInfo.phone || "",
        location: data.personalInfo.location || "",
        country: data.personalInfo.country || "",
        city: data.personalInfo.city || "",
        linkedinUrl: data.personalInfo.linkedinUrl || "",
        portfolioUrl: data.personalInfo.portfolioUrl || "",
        summary: data.summary || "",
        workExperience: data.workExperience || [],
        education: data.education || [],
        skills: data.skills || [],
        technicalSkills: data.technicalSkills || [],
        softSkills: data.softSkills || [],
        certifications: data.certifications || [],
        projects: data.projects || []
      });
      
      toast({
        title: "Resume imported successfully",
        description: "Your resume has been parsed. Please review each section carefully and add any missing information.",
        duration: 6000, // Show for longer to ensure user reads it
      });
    },
    onError: (error: Error) => {
      console.error("Resume parsing error:", error);
      
      // Handle specific error messages for better user feedback
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        toast({
          title: "Resume too complex",
          description: "Your resume contains too much text to process. Try uploading a shorter resume or wait a few minutes before trying again.",
          variant: "destructive",
        });
      } else if (error.message.includes("500")) {
        toast({
          title: "Server Error",
          description: "There was a problem processing your resume. Please try again with a simpler or shorter resume.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to parse resume",
          description: error.message,
          variant: "destructive",
        });
      }
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
    e.stopPropagation();
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelect(file);
      
      // Reset the file input value so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  // Process selected file
  const handleFileSelect = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX only
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a DOCX file only. PDF parsing is currently limited.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    // Show warning for large files (may cause token limit issues)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Large file detected",
        description: "Large files may be truncated during processing for optimal results. The most important information will be prioritized."
      });
    }
    
    // We now only accept DOCX files, so PDF handling is removed
    
    setSelectedFile(file);
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
    
    const formData = new FormData();
    formData.append('resume', selectedFile);
    
    parseResumeMutation.mutate(formData);
  };

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Import Existing Resume</h2>
        <p className="text-muted-foreground">
          Upload your existing resume to automatically fill in your information. 
          Supported format: DOCX only. 
          <span className="block mt-1 text-sm">(Max file size: 5MB)</span>
        </p>
        <div className="space-y-2">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm mt-2">
            <p><strong>Note:</strong> Currently, only Microsoft Word (.docx) files are supported for reliable parsing.</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
            <p><strong>Important:</strong> Our parser may not extract all information correctly, especially:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Education history may be incomplete or missing</li>
              <li>Some skills might not be properly categorized</li>
              <li>Project details might need manual enhancement</li>
            </ul>
            <p className="mt-2">Please review all sections carefully after import and add any missing information.</p>
          </div>
        </div>
      </div>

      {/* Drag and drop area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          !selectedFile ? "cursor-pointer" : ""
        } ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (!selectedFile) {
            const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
            if (fileInput) {
              fileInput.click();
            }
          }
        }}
      >
        {selectedFile ? (
          <div className="space-y-4">
            <FileText className="h-12 w-12 text-primary mx-auto" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button 
              variant="outline" 
              type="button" 
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the parent div's click handler
                handleClearFile();
              }}
              className="mt-2"
            >
              <FileX className="h-4 w-4 mr-2" />
              Remove File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium">Drag and drop your resume file here</p>
              <p className="text-sm text-muted-foreground">or click to browse files</p>
            </div>
            <div className="flex items-center justify-center">
              <Button 
                variant="outline" 
                type="button" 
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the parent div's click handler
                  const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
                  if (fileInput) {
                    fileInput.click();
                  }
                }}
              >
                Choose File
              </Button>
              <input 
                id="resume-upload" 
                type="file" 
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
            </div>
          </div>
        )}
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