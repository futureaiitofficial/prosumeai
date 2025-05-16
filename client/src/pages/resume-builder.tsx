import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  Save, 
  Download, 
  ChevronRight,
  ChevronLeft,
  FileText,
  Briefcase,
  GraduationCap,
  ListTodo,
  Code,
  Award,
  Download as DownloadIcon,
  User,
  Plus,
  Eye,
  X,
  Sparkles
} from "lucide-react";
import Header from "@/components/layouts/header";
import { motion } from "framer-motion";


// Import form components
import PersonalInfoForm from "@/components/resume-builder/personal-info-form";
import SummaryForm from "@/components/resume-builder/summary-form";
import WorkExperienceForm from "@/components/resume-builder/work-experience-form";
import EducationForm from "@/components/resume-builder/education-form";
import SkillsForm from "@/components/resume-builder/skills-form";
import ProjectsForm from "@/components/resume-builder/projects-form";
import CertificationsForm from "@/components/resume-builder/certifications-form";
import ImportResumeForm from "@/components/resume-builder/import-resume-form";
import JobDescriptionForm from "@/components/resume-builder/job-description-form";
import ResumePreview from "@/components/resume-builder/resume-preview";
import ATSScore from "@/components/resume-builder/ats-score";
import TemplateSelection from "@/components/resume-builder/template-selection";
import SectionReorder from "@/components/resume-builder/section-reorder";

// Import the new download button component
import ResumeDownloadButton from "@/components/resume-download-button";

// Add a wrapper for ResumeDownloadButton to ensure animation is shown
interface AnimatedResumeDownloadButtonProps {
  resumeData: ResumeData;
  className?: string;
}

export const AnimatedResumeDownloadButton = ({ resumeData, className }: AnimatedResumeDownloadButtonProps) => {
  // Track if animation is showing
  const [showAnimation, setShowAnimation] = useState(false);
  const { toast } = useToast();
  
  // Duplicated from ResumeDownloadButton to ensure functionality
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
      // Show animation
      setShowAnimation(true);
      
      // Set animation start time to enforce minimum display duration
      const animationStartTime = Date.now();
      const minimumAnimationDuration = 3000; // 3 seconds minimum display time
      
      // Import required components
      const { registerTemplates } = await import("@/templates/registerTemplates");
      const { TemplateFactory } = await import("@/templates/core/TemplateFactory");
      
      // Register templates to ensure they're available
      registerTemplates();
      
      // Get the template instance to render HTML
      const templateFactory = TemplateFactory.getInstance();
      const template = templateFactory.getTemplate(resumeData.template);
      
      if (!template) {
        throw new Error(`Template not found: ${resumeData.template}`);
      }
      
      // Format URLs for display before rendering
      const formatUrls = (data: any) => {
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

        // Add contact separator
        result.contactSeparator = "|";
        
        return result;
      };

      // Apply URL formatting to data before rendering
      const formattedData = formatUrls(resumeData);
      
      // Get the rendered HTML content with formatted data
      const element = template.renderPreview(formattedData);

      // Create temporary container to render the element
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      
      // Render to get HTML content
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(container);
      root.render(element);
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get HTML content
      const htmlContent = container.innerHTML;
      
      // Clean up
      root.unmount();
      document.body.removeChild(container);
      
      // Prepare the request payload with HTML content
      const payload = {
        html: htmlContent,
        styles: "", // Server will handle styles
        data: resumeData
      };
      
      // Send to server for PDF generation
      const response = await fetch("/api/resume-templates/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      // Check if the response is successful
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server failed to generate PDF: ${errorText}`);
      }
      
      // Get the PDF blob from the response
      const pdfBlob = await response.blob();
      
      // Ensure animation shows for minimum time before download
      const elapsedTime = Date.now() - animationStartTime;
      const remainingTime = Math.max(0, minimumAnimationDuration - elapsedTime);
      
      // Wait to ensure animation displays for minimum time
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      
      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resumeData.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
      
      // Show success notification
      toast({
        title: "Resume Downloaded!",
        description: "Your resume has been downloaded successfully.",
        duration: 5000,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      // Hide animation after a short delay
      setTimeout(() => {
        setShowAnimation(false);
      }, 500);
    }
  };

  return (
    <>
      {/* Animation modal */}
      {showAnimation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-96 sm:w-[480px] overflow-hidden"
          >
            <div className="flex flex-col items-center gap-6 py-10 px-6">
              {/* Paper with shadow effect */}
              <motion.div
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-40 h-52 bg-white rounded-md shadow-lg relative flex items-center justify-center"
                style={{
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
                }}
              >
                {/* Lines on paper */}
                <div className="absolute top-0 left-0 right-0 bottom-0 p-6 flex flex-col gap-3 opacity-60">
                  <div className="h-2.5 bg-gray-200 rounded-full w-full"></div>
                  <div className="h-2.5 bg-gray-200 rounded-full w-3/4"></div>
                  <div className="h-2.5 bg-gray-200 rounded-full w-full"></div>
                  <div className="h-2.5 bg-gray-200 rounded-full w-5/6"></div>
                  <div className="h-2.5 bg-gray-200 rounded-full w-full"></div>
                  <div className="h-2.5 bg-gray-200 rounded-full w-4/5"></div>
                </div>
                
                {/* PDF icon overlay */}
                <div className="absolute bottom-6 right-6 text-red-500 opacity-40 font-bold text-lg">
                  PDF
                </div>
              </motion.div>
              
              {/* Bar loader */}
              <motion.div
                initial="initial"
                animate="animate"
                transition={{
                  staggerChildren: 0.15,
                }}
                className="flex gap-2 mt-2"
              >
                {[1, 2, 3, 4, 5].map(index => (
                  <motion.div 
                    key={index}
                    variants={{
                      initial: { scaleY: 0.5, opacity: 0 },
                      animate: { 
                        scaleY: 1, 
                        opacity: 1,
                        transition: {
                          repeat: Infinity,
                          repeatType: "mirror",
                          duration: 1,
                          ease: "circIn",
                        }
                      }
                    }} 
                    className="h-10 w-2.5 bg-blue-500 rounded-full" 
                  />
                ))}
              </motion.div>
              
              <p className="text-base text-center text-gray-700 dark:text-gray-300 font-medium">
                Preparing your document...
              </p>
            </div>
            <div className="px-4 pb-6 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setShowAnimation(false)}
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Actual download button that triggers our custom handler */}
      <Button
        onClick={handleDownload}
        className={className}
        size="sm"
      >
        <Download className="mr-2 h-4 w-4" /> Download PDF
      </Button>
    </>
  );
};

// Define types for work experience and education
interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  description: string;
  achievements: string[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  description: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string | null;
  expires: boolean;
  expiryDate: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  url: string | null;
}

// Define the resume data interface
interface ResumeData {
  title: string;
  targetJobTitle: string;
  jobDescription: string;
  template: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  country: string;
  city: string;
  linkedinUrl: string;
  portfolioUrl: string;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  technicalSkills: string[];
  softSkills: string[];
  certifications: Certification[];
  projects: Project[];
  useSkillCategories: boolean;
  sectionOrder: string[];
  keywordsFeedback?: {
    found: string[];
    missing: string[];
    all: string[];
    categories: {
      [category: string]: {
        found: string[];
        missing: string[];
        all: string[];
      }
    }
  };
}

// Initial state for resume data
const initialResumeData: ResumeData = {
  title: "Untitled",
  targetJobTitle: "",
  jobDescription: "",
  template: "professional",
  
  // Personal Info
  fullName: "",
  email: "",
  phone: "",
  location: "",
  country: "",
  city: "",
  linkedinUrl: "",
  portfolioUrl: "",
  
  // Professional Summary
  summary: "",
  
  // Work Experience
  workExperience: [],
  
  // Education
  education: [],
  
  // Skills
  skills: [],
  technicalSkills: [],
  softSkills: [],
  
  // Additional sections
  certifications: [],
  projects: [],
  useSkillCategories: false,
  
  // Default section order
  sectionOrder: ["summary", "workExperience", "education", "skills", "projects", "certifications"]
};

// Resume builder steps
type BuilderStep = "template" | "import-option" | "job-description" | "personal-info" | "employment-history" | "summary" | "education" | "skills" | "projects" | "certifications" | "section-order" | "download";

// Create a new AI helpers file to contain the content generation functions
export default function ResumeBuilder() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Define steps array to ensure consistency
  const BUILDER_STEPS: BuilderStep[] = ["template", "import-option", "job-description", "personal-info", "employment-history", "summary", "education", "skills", "projects", "certifications", "section-order", "download"];
  
  // Change from activeSection to currentStep for consistency with cover letter builder
  const [currentStep, setCurrentStep] = useState<BuilderStep>("template");
  
  // Create resume mutation
  const createResumeMutation = useMutation({
    mutationFn: async (data: ResumeData) => {
      const res = await apiRequest(
        "POST", 
        "/api/resumes", 
        { ...data, userId: user?.id }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      setResumeId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({
        title: "Resume Saved",
        description: "Your resume has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save resume",
        description: error.message,
        variant: "destructive",
      });
      console.error("Resume save error:", error);
    },
  });
  
  // Update resume mutation
  const updateResumeMutation = useMutation({
    mutationFn: async (data: ResumeData & { id: number }) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/resumes/${data.id}`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({
        title: "Resume Updated",
        description: "Your resume has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update resume",
        description: error.message,
        variant: "destructive",
      });
      console.error("Resume update error:", error);
    },
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
  };
  
  // Save resume (create or update)
  const saveResume = () => {
    try {
      // Helper function to ensure dates are strings
      const formatDateField = (dateValue: any) => {
        if (!dateValue) return null;
        if (typeof dateValue === 'string') return dateValue;
        if (dateValue instanceof Date) return dateValue.toISOString().split('T')[0];
        return String(dateValue);
      };

      // Process each array to ensure date fields are properly formatted
      const processedWorkExperience = (resumeData.workExperience || []).map((exp: WorkExperience) => ({
        ...exp,
        startDate: formatDateField(exp.startDate),
        endDate: formatDateField(exp.endDate)
      }));

      const processedEducation = (resumeData.education || []).map((edu: Education) => ({
        ...edu,
        startDate: formatDateField(edu.startDate),
        endDate: formatDateField(edu.endDate)
      }));

      const processedCertifications = (resumeData.certifications || []).map((cert: Certification) => ({
        ...cert,
        date: formatDateField(cert.date),
        expiryDate: formatDateField(cert.expiryDate)
      }));

      const processedProjects = (resumeData.projects || []).map((proj: Project) => ({
        ...proj,
        startDate: formatDateField(proj.startDate),
        endDate: formatDateField(proj.endDate)
      }));

      const dataToSave = {
        ...resumeData,
        // Ensure arrays are initialized and dates are properly formatted
        skills: resumeData.skills || [],
        technicalSkills: resumeData.technicalSkills || [],
        softSkills: resumeData.softSkills || [],
        useSkillCategories: resumeData.useSkillCategories ?? false,
        workExperience: processedWorkExperience,
        education: processedEducation,
        certifications: processedCertifications,
        projects: processedProjects
      };
      
      if (resumeId) {
        updateResumeMutation.mutate({ ...dataToSave, id: resumeId });
      } else {
        createResumeMutation.mutate(dataToSave);
      }
    } catch (error) {
      console.error("Error preparing resume data:", error);
      toast({
        title: "Error",
        description: "Failed to prepare resume data for saving",
        variant: "destructive",
      });
    }
  };
  
  // Handle form field updates
  const updateField = (field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle component updates
  const handleComponentUpdate = (updates: any) => {
    setResumeData(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Get URL parameters for resume ID
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get("id");
    
    if (id) {
      setResumeId(parseInt(id));
      // Fetch resume data if ID is provided
      fetchResumeData(parseInt(id));
    } else {
      // Redirect to resumes page if no ID is provided
      toast({
        title: "Access Denied",
        description: "Please create a new resume first to use the builder",
        variant: "destructive",
      });
      navigate("/resumes");
    }
  }, [navigate]);

  // Fetch resume data function
  const fetchResumeData = async (id: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/resumes/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch resume data");
      }
      const data: ResumeData = await res.json();
      
      // Check if the resume has required initial fields
      if (!data.title || !data.targetJobTitle) {
        toast({
          title: "Invalid Resume",
          description: "This resume is missing required information. Please create a new resume.",
          variant: "destructive",
        });
        navigate("/resumes");
        return;
      }
      
      // Prepare default section order if needed
      const defaultSectionOrder = ["summary", "workExperience", "education", "skills", "projects", "certifications"];
      const ensuredSectionOrder = Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0 
        ? data.sectionOrder 
        : defaultSectionOrder;
      
      setResumeData({
        ...data,
        jobDescription: data.jobDescription || "", // Ensure jobDescription is always a string
        sectionOrder: ensuredSectionOrder
      });
    } catch (error) {
      console.error("Error fetching resume:", error);
      toast({
        title: "Error",
        description: "Failed to load resume data",
        variant: "destructive",
      });
      navigate("/resumes");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to next section
  const navigateToNext = () => {
    // Save current state before navigating
    saveResume();
    
    const currentIndex = BUILDER_STEPS.indexOf(currentStep);
    if (currentIndex < BUILDER_STEPS.length - 1) {
      setCurrentStep(BUILDER_STEPS[currentIndex + 1]);
    }
  };

  // Navigate to previous section
  const navigateToPrevious = () => {
    // Save current state before navigating
    saveResume();
    
    const currentIndex = BUILDER_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(BUILDER_STEPS[currentIndex - 1]);
    }
  };

  // Render specific section content
  const renderSectionContent = () => {
    switch (currentStep) {
      case "template":
        return (
          <div className="space-y-4">
            <TemplateSelection 
              selectedTemplate={resumeData.template} 
              onChange={(template) => updateField("template", template)} 
            />
          </div>
        );
      
      case "import-option":
        return (
          <div className="space-y-6">
            <ImportResumeForm data={resumeData} updateData={handleComponentUpdate} />
            

          </div>
        );
      
      case "job-description":
        return <JobDescriptionForm data={resumeData} updateData={handleComponentUpdate} />;
      
      case "personal-info":
        return <PersonalInfoForm data={resumeData} updateData={handleComponentUpdate} />;
        
      case "employment-history":
        return <WorkExperienceForm data={resumeData} updateData={handleComponentUpdate} />;
        
      case "summary":
        return <SummaryForm data={resumeData} updateData={handleComponentUpdate} />;
        
      case "education":
        return <EducationForm data={resumeData} updateData={handleComponentUpdate} />;
        
      case "skills":
        return <SkillsForm data={resumeData} updateData={handleComponentUpdate} />;
        
      case "projects":
        return <ProjectsForm data={resumeData} updateData={handleComponentUpdate} />;
        
      case "certifications":
        return <CertificationsForm data={resumeData} updateData={handleComponentUpdate} />;
        
      case "section-order":
        return (
          <SectionReorder 
            sectionOrder={resumeData.sectionOrder}
            updateSectionOrder={(newOrder) => updateField("sectionOrder", newOrder)}
          />
        );
        
      case "download":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Your Resume is Ready!</h2>
            
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-100">
              {/* Animated particles */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
                <div className="animate-float absolute top-1/4 left-1/4 w-12 h-12 rounded-full bg-blue-400"></div>
                <div className="animate-float-delayed absolute top-3/4 left-2/3 w-8 h-8 rounded-full bg-indigo-400"></div>
                <div className="animate-float-slow absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-purple-400"></div>
                <div className="animate-spin-slow absolute top-1/3 right-1/4 w-20 h-20 opacity-20">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1L15 5H9L12 1Z" fill="currentColor"/>
                    <path d="M12 23L9 19H15L12 23Z" fill="currentColor"/>
                    <path d="M1 12L5 9V15L1 12Z" fill="currentColor"/>
                    <path d="M23 12L19 15V9L23 12Z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900">Resume Created Successfully</h3>
                  
                  <p className="text-gray-600 max-w-md">
                    Your professional resume has been created and is ready to download. Use it to impress employers and land your dream job!
                  </p>
                  
                  <div className="animate-bounce mt-4">
                    <AnimatedResumeDownloadButton 
                      resumeData={resumeData}
                      className="py-3 px-8 text-base"
                    />
                  </div>
                </div>
                
                {/* Resume Stats */}
                <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-gray-500">Job Target</p>
                    <p className="text-lg font-bold mt-1 truncate">{resumeData.targetJobTitle || "Not specified"}</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="text-lg font-bold mt-1">{resumeData.workExperience?.length || 0} Positions</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-gray-500">Skills</p>
                    <p className="text-lg font-bold mt-1">{
                      (resumeData.useSkillCategories 
                        ? [...(resumeData.technicalSkills || []), ...(resumeData.softSkills || [])]
                        : (resumeData.skills || [])
                      ).length
                    } Skills</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-gray-500">Template</p>
                    <p className="text-lg font-bold mt-1 capitalize truncate">{resumeData.template?.replace(/-/g, ' ') || "Professional"}</p>
                  </div>
                </div>
                
                {/* Tips */}
                <div className="mt-10">
                  <h4 className="font-medium text-gray-900 mb-3">Next Steps</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="ml-2 text-gray-600">Tailor your resume for each job application for better results.</p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="ml-2 text-gray-600">Pair your resume with a compelling cover letter.</p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="ml-2 text-gray-600">Practice answering interview questions based on your resume content.</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <PersonalInfoForm data={resumeData} updateData={handleComponentUpdate} />;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Resume Builder</h1>
        <div className="flex items-center justify-center h-64">
          <p>Please log in to use the resume builder.</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-medium">Loading Resume Data...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Step sidebar - now sticky */}
        <div className="w-64 bg-card border-r hidden md:block sticky top-0 h-screen overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold mb-6">Build Your Resume</h2>
            <ul className="space-y-1">
              {[
                { id: "template", label: "Template", icon: <FileText className="h-4 w-4" /> },
                { id: "import-option", label: "Import Resume", icon: <Plus className="h-4 w-4" /> },
                { id: "job-description", label: "Job Details", icon: <Briefcase className="h-4 w-4" /> },
                { id: "personal-info", label: "Personal Info", icon: <User className="h-4 w-4" /> },
                { id: "employment-history", label: "Experience", icon: <Briefcase className="h-4 w-4" /> },
                { id: "summary", label: "Summary", icon: <FileText className="h-4 w-4" /> },
                { id: "education", label: "Education", icon: <GraduationCap className="h-4 w-4" /> },
                { id: "skills", label: "Skills", icon: <ListTodo className="h-4 w-4" /> },
                { id: "projects", label: "Projects", icon: <Code className="h-4 w-4" /> },
                { id: "certifications", label: "Certifications", icon: <Award className="h-4 w-4" /> },
                { id: "section-order", label: "Section Order", icon: <Sparkles className="h-4 w-4" /> },
                { id: "download", label: "Download", icon: <DownloadIcon className="h-4 w-4" /> },
              ].map((step) => (
                <li key={step.id}>
                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${
                      currentStep === step.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => setCurrentStep(step.id as BuilderStep)}
                  >
                    {step.icon}
                    <span className="ml-3">{step.label}</span>
                    {currentStep === step.id && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main content area with better overflow control */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-slate-900 dark:border-slate-800 z-10">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => navigate("/resumes")} 
              className="h-9"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Resumes</span>
              <span className="sm:hidden">Back</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <ATSScore resumeData={{
                  ...resumeData,
                  workExperience: resumeData.workExperience?.map(exp => ({
                    ...exp,
                    startDate: exp.startDate || '', 
                    endDate: exp.endDate || undefined
                  })) || [],
                  education: resumeData.education?.map(edu => ({
                    ...edu,
                    startDate: edu.startDate || '', 
                    endDate: edu.endDate || undefined
                  })) || [],
                  projects: resumeData.projects?.map(proj => ({
                    ...proj,
                    name: proj.name || '',
                    url: proj.url || undefined,
                    startDate: proj.startDate || undefined,
                    endDate: proj.endDate || undefined
                  })) || [],
                  certifications: resumeData.certifications?.map(cert => ({
                    ...cert,
                    name: cert.name,
                    issuer: cert.issuer,
                    date: cert.date || ''
                  })) || [],
                  updateData: handleComponentUpdate
                }} />
              </div>
              
              <Button
                variant="outline" 
                size="sm"
                onClick={saveResume}
                disabled={createResumeMutation.isPending || updateResumeMutation.isPending}
                className="h-9 flex items-center"
              >
                {(createResumeMutation.isPending || updateResumeMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">Save</span>
              </Button>
            </div>
          </div>

          {/* Mobile step indicator with direct step navigation */}
          <div className="block md:hidden px-4 py-2 bg-white dark:bg-slate-900 dark:border-slate-800 z-10 border-b overflow-x-auto hide-scrollbar">
            {/* Mobile step pills - scrollable horizontal */}
            <div className="flex space-x-2 pb-1 overflow-x-auto scrollbar-hide">
              {[
                { id: "template", label: "Template" },
                { id: "import-option", label: "Import" },
                { id: "job-description", label: "Job" },
                { id: "personal-info", label: "Info" },
                { id: "employment-history", label: "Work" },
                { id: "summary", label: "Summary" },
                { id: "education", label: "Education" },
                { id: "skills", label: "Skills" },
                { id: "projects", label: "Projects" },
                { id: "certifications", label: "Certs" },
                { id: "section-order", label: "Order" },
                { id: "download", label: "Download" },
              ].map((step) => (
                <button
                  key={step.id}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full 
                    ${currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                    }`}
                  onClick={() => setCurrentStep(step.id as BuilderStep)}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content container with improved scrolling */}
          <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-slate-950">
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden">
              {/* Form section - scrollable */}
              <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-130px)] md:max-h-[calc(100vh-115px)]">
                <div className="p-4 sm:p-6">
                  <div className="bg-card rounded-lg shadow-sm border p-4 sm:p-6 dark:bg-slate-900 dark:border-slate-800">
                    {renderSectionContent()}
                    
                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between mt-8 pt-4 border-t dark:border-slate-800">
                      <Button
                        variant="outline"
                        onClick={navigateToPrevious}
                        disabled={currentStep === "template"}
                        size={window.innerWidth < 640 ? "sm" : "default"}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      
                      {currentStep === "download" ? (
                        <Button
                          onClick={() => navigate("/resumes")}
                          size={window.innerWidth < 640 ? "sm" : "default"}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Back to Dashboard
                          <ArrowLeft className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={navigateToNext}
                          size={window.innerWidth < 640 ? "sm" : "default"}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Resume Preview - sticky and fixed on desktop, bottom sheet on mobile */}
              <div className="hidden lg:block h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 border-l dark:border-slate-800">
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0">
                      <ResumePreview data={resumeData} hideDownloadButton={true} />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile Resume Preview Button */}
              <div className="lg:hidden fixed bottom-4 right-4 z-30">
                <Button 
                  onClick={() => {
                    const dialog = document.getElementById('mobile-preview-dialog') as HTMLDialogElement;
                    if (dialog) dialog.showModal();
                  }}
                  size="lg"
                  className="rounded-full shadow-lg h-14 w-14 flex items-center justify-center"
                >
                  <Eye className="h-6 w-6" />
                </Button>
              </div>
              
              {/* Mobile Preview Dialog */}
              <dialog id="mobile-preview-dialog" className="fixed inset-0 z-50 bg-black/50 w-full h-full p-0 m-0 backdrop:bg-black/50">
                <div className="bg-white dark:bg-slate-900 w-full h-full flex flex-col">
                  <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-medium dark:text-white">Resume Preview</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const dialog = document.getElementById('mobile-preview-dialog') as HTMLDialogElement;
                        if (dialog) dialog.close();
                      }}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ResumePreview data={resumeData} hideDownloadButton={false} />
                  </div>
                </div>
              </dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}