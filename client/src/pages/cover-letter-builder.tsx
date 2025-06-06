import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Wand2, FileText, Briefcase, ChevronRight, ArrowLeft, FileEdit, FileDown, Building, Lock, AlertTriangle, Loader2, Sparkles, Eye, X } from "lucide-react";
import { handleSubscriptionError } from "@/utils/error-handler";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateCoverLetter, enhanceCoverLetter } from "@/utils/ai-cover-letter-helpers";
import { sanitizeInput, sanitizeObject } from "@/utils/sanitize";
import type { Resume } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generatePDFFromReactElement } from "@/templates/utils/exportUtils";
import React from "react";
import Header from "@/components/layouts/header";
import { registerCoverLetterTemplates, coverLetterTemplateMetadata } from '@/templates/registerCoverLetterTemplates';
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { coverLetterTemplates as importedTemplates } from "@/templates/registerCoverLetterTemplates";
// Token usage imports removed
import CoverLetterTemplateSelection from "@/components/resume-builder/cover-letter-template-selection";
import CoverLetterPreview from "@/components/resume-builder/cover-letter-preview";

// Add Dialog imports
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Cover letter creation steps
type BuilderStep = "template" | "job-details" | "personal-info" | "company-info" | "content" | "export";

// Cover letter template previews
const templatePreviews = {
  standard: {
    description: "Standard template with a clean, professional layout that works for most industries"
  },
  modern: {
    description: "Modern template with a contemporary design and styling for forward-thinking companies"
  }
};

// Register cover letter templates immediately
registerCoverLetterTemplates();

interface CoverLetterTemplate {
  id: string;
  name: string;
  description: string;
}

interface CoverLetter {
  id: number;
  jobTitle?: string | null;
  jobDescription?: string | null;
  company?: string | null;
  recipientName?: string | null;
  fullName: string | null;
  email: string | null;
  phone?: string | null;
  address?: string | null;
  resumeId?: number | null;
  isDraft?: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  summary?: string | null;
  template: string;
  title: string;
  currentStep?: string | null;
  content: string | null;
  isComplete?: boolean | null;
}

export default function CoverLetterBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Define steps array once to ensure consistency
  const BUILDER_STEPS: BuilderStep[] = ["template", "job-details", "personal-info", "company-info", "content", "export"];
  
  const [currentStep, setCurrentStep] = useState<BuilderStep>("template");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [coverLetterId, setCoverLetterId] = useState<number | null>(null);
  const [isNewCoverLetter, setIsNewCoverLetter] = useState(false);
  
  // Add mobile preview state
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    template: 'standard'
  });
  
  // Job details state
  const [jobDetails, setJobDetails] = useState({
    jobTitle: '',
    jobDescription: '',
  });
  
  // Personal/Company info state
  const [personalInfo, setPersonalInfo] = useState({
    resumeId: null as number | null,
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    recipientName: '',
  });

  // Fetch resumes for the dropdown selection
  const { data: resumesQuery } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/resumes');
      return await response.json();
    },
    enabled: !!user
  });

  // Fetch cover letters query
  const { data: coverLetters = [] } = useQuery({
    queryKey: ['coverLetters'],
    queryFn: async (): Promise<CoverLetter[]> => {
      const response = await apiRequest('GET', '/api/cover-letters');
      return await response.json();
    },
    enabled: !!user
  });

  // Safely handle resumesQuery being undefined
  const resumes = resumesQuery || [];
  
  // Find resumes function with proper typing
  const findResume = (resumeId: string | number) => {
    if (!resumes || !Array.isArray(resumes)) return null;
    
    if (typeof resumeId === 'string') {
      resumeId = parseInt(resumeId);
    }
    return resumes.find((resume: { id: number }) => resume.id === resumeId);
  };

  // Form input change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setStateFunc: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const { name, value } = e.target;
    setStateFunc((prev: any) => ({
      ...prev,
      [name]: sanitizeInput(value)
    }));
  };

  // Create cover letter mutation
  const createCoverLetterMutation = useMutation({
    mutationFn: async (coverLetterData: Partial<CoverLetter>): Promise<CoverLetter> => {
      const cleanData = {
        ...coverLetterData,
        fullName: coverLetterData.fullName || '',
        email: coverLetterData.email || '',
        phone: coverLetterData.phone || '',
        address: coverLetterData.address || '',
        content: coverLetterData.content || ''
      };
      console.log('Creating cover letter with sanitized data:', cleanData);
      const response = await apiRequest('POST', '/api/cover-letters', cleanData);
      return await response.json();
    },
    onSuccess: (data) => {
      setCoverLetterId(data.id);
      queryClient.invalidateQueries({ queryKey: ['coverLetters'] });
      toast({
        title: "Success",
        description: "Cover letter saved successfully!",
      });
      
      // Redirect to the cover letter detail page
      if (currentStep === "export") {
        window.location.href = `/cover-letters`;
      }
    },
    onError: (error: Error) => {
      if (!handleSubscriptionError(error, toast)) {
        toast({
          title: "Error",
          description: error.message || "Failed to save cover letter. Please try again.",
          variant: "destructive",
        });
      }
      console.error("Error saving cover letter:", error);
    }
  });

  // Update cover letter mutation
  const updateCoverLetterMutation = useMutation({
    mutationFn: async (coverLetterData: Partial<CoverLetter>): Promise<CoverLetter> => {
      if (!coverLetterId) throw new Error("No cover letter ID specified for update.");
      const cleanedData = {
        ...coverLetterData,
        fullName: coverLetterData.fullName !== undefined ? coverLetterData.fullName : (coverLetters.find((c: CoverLetter) => c.id === coverLetterId)?.fullName || ''),
        email: coverLetterData.email !== undefined ? coverLetterData.email : (coverLetters.find((c: CoverLetter) => c.id === coverLetterId)?.email || ''),
        phone: coverLetterData.phone !== undefined ? coverLetterData.phone : (coverLetters.find((c: CoverLetter) => c.id === coverLetterId)?.phone || ''),
        address: coverLetterData.address !== undefined ? coverLetterData.address : (coverLetters.find((c: CoverLetter) => c.id === coverLetterId)?.address || ''),
      };
      console.log('Updating cover letter with data:', cleanedData);
      const response = await apiRequest('PUT', `/api/cover-letters/${coverLetterId}`, cleanedData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverLetters'] });
      toast({
        title: "Success",
        description: "Cover letter updated successfully!",
      });
      
      // Redirect to the cover letter detail page
      if (currentStep === "export") {
        window.location.href = `/cover-letters`;
      }
    },
    onError: (error: Error) => {
      if (!handleSubscriptionError(error, toast)) {
        toast({
          title: "Error",
          description: error.message || "Failed to update cover letter. Please try again.",
          variant: "destructive",
        });
      }
      console.error("Error updating cover letter:", error);
    }
  });

  // Navigate to a specific step
  const goToStep = (step: BuilderStep) => {
    setCurrentStep(step);
  };

  // Generate content mutation
  const generateContentMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest('POST', '/api/ai/generate', { prompt });
      return await response.json();
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      if (data && data.content) {
        setFormData(prev => ({
          ...prev,
          content: data.content
        }));
        toast({
          title: "Success",
          description: "Cover letter content generated successfully!",
          variant: "default",
        });
      }
    },
    onError: (error: Error) => {
      setIsGenerating(false);
      console.error("Error generating content:", error);
      if (!handleSubscriptionError(error, toast)) {
        toast({
          title: "Error",
          description: error.message || "Failed to generate content. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Token warning dialog removed

  // Function to generate content based on resume, job details, etc.
  const generateContent = async () => {
    setIsGenerating(true);
    
    try {
      // Create prompt with available information
      let prompt = `Create a professional cover letter body for a ${jobDetails.jobTitle} position at ${companyInfo.companyName}.\n\n`;
      
      // Add personal information section
      prompt += "Personal Information:\n";
      prompt += `Full Name: ${personalInfo.fullName || "Not provided"}\n`;
      prompt += `Email: ${personalInfo.email || "Not provided"}\n`;
      prompt += `Phone: ${personalInfo.phone || "Not provided"}\n`;
      prompt += `Address: ${personalInfo.address || "Not provided"}\n\n`;
      
      // Add job description if available
      if (jobDetails.jobDescription) {
        prompt += `Job Description:\n${jobDetails.jobDescription}\n\n`;
      }
      
      // Add resume information if available
      if (personalInfo.resumeId) {
        const selectedResume = findResume(personalInfo.resumeId);
        console.log("Resume data for content generation:", selectedResume);
        
        if (selectedResume) {
          prompt += `My Resume Information:\n`;
          
          // Try to get summary from different possible locations
          const summary = selectedResume.summary || 
                        selectedResume.profile?.summary || 
                        "";
          if (summary) {
            prompt += `Summary: ${summary}\n`;
          }
          
          // Try to get work experience from different possible formats
          const workExperience = selectedResume.workExperience || 
                               selectedResume.experience || 
                               selectedResume.work || 
                               [];
          if (workExperience && workExperience.length > 0) {
            prompt += `Work Experience: ${JSON.stringify(workExperience)}\n`;
          }
          
          // Try to get skills from different possible formats
          const skills = selectedResume.skills || 
                       (selectedResume.technicalSkills && selectedResume.softSkills ? 
                        [...selectedResume.technicalSkills, ...selectedResume.softSkills] : []);
          if (skills && skills.length > 0) {
            prompt += `Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}\n`;
          }
          
          // Try to get education details if available
          const education = selectedResume.education || [];
          if (education && education.length > 0) {
            prompt += `Education: ${JSON.stringify(education)}\n`;
          }
          
          prompt += `\n`;
        }
      }
      
      prompt += `Instructions:
1. Use ONLY the personal details I provided above - don't use placeholders
2. Create ONLY the body paragraphs of the cover letter
3. Do NOT include a header with contact information
4. Do NOT include a salutation/greeting line (like "Dear Hiring Manager")
5. Do NOT include any closing (like "Sincerely" or signature)
6. Focus on highlighting relevant skills and experiences for the position
7. Use a professional, confident tone
8. Limit to 3-4 paragraphs total\n`;

      const response = await axios.post('/api/ai/generate', { prompt });
      
      // Set the generated content
      const newContent = response.data.content;
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
      
      // Show success toast
      toast({
        title: "Success",
        description: "Cover letter content generated!",
      });
      
      // Update current step
      setCurrentStep("content");
    } catch (error) {
      console.error('Error generating content:', error);
      if (!handleSubscriptionError(error, toast)) {
        toast({
          title: "Error",
          description: "Failed to generate content. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Enhance cover letter content with AI
  const enhanceContent = async () => {
    if (!formData.content) {
      toast({
        title: "Missing content",
        description: "Please generate or write some content first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      // Extract metadata from existing content and clean up the content
      const contentWithoutMetadata = formData.content.replace(/<!--[\s\S]*?-->/g, '');
      
      // Enhance the content - pass only what's needed for enhancement
      const enhancedContent = await enhanceCoverLetter(
        contentWithoutMetadata,
        jobDetails.jobTitle,
        jobDetails.jobDescription,
        companyInfo.companyName
      );
      
      // Preserve the metadata
      const metadata = formData.content.match(/<!--[\s\S]*?-->/g) || [];
      
      setFormData(prev => ({
        ...prev,
        content: metadata.join('\n') + enhancedContent
      }));
      
      toast({
        title: "Success",
        description: "Cover letter content enhanced successfully!",
      });
    } catch (error) {
      console.error("Error enhancing cover letter:", error);
      if (!handleSubscriptionError(error, toast)) {
        toast({
          title: "Error",
          description: "Failed to enhance content. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Save cover letter to database
  const saveCoverLetter = async (isDraft: boolean): Promise<CoverLetter> => {
    const coverLetterData: Partial<CoverLetter> = {
      title: formData.title,
      content: formData.content,
      template: formData.template,
      jobTitle: jobDetails.jobTitle,
      jobDescription: jobDetails.jobDescription,
      company: companyInfo.companyName,
      recipientName: companyInfo.recipientName,
      fullName: personalInfo.fullName,
      email: personalInfo.email,
      phone: personalInfo.phone,
      address: personalInfo.address,
      resumeId: personalInfo.resumeId,
      isDraft
    };

    // Sanitize the data
    const sanitizedData = sanitizeObject(coverLetterData) as Partial<CoverLetter>;
    console.log('Sanitized data for save:', sanitizedData);

    if (coverLetterId) {
      return updateCoverLetterMutation.mutateAsync(sanitizedData);
    } else {
      const result = await createCoverLetterMutation.mutateAsync(sanitizedData);
      return result;
    }
  };

  // Handle resume selection
  const handleResumeSelect = (value: string) => {
    if (value && value !== "none" && resumes && Array.isArray(resumes)) {
      try {
        const selectedResume = resumes.find((r: Resume) => r.id === parseInt(value));
        if (selectedResume) {
          // Debug log to see the resume structure
          console.log("Selected resume structure:", selectedResume);
          
          // Extract personal information with fallbacks
          const fullName = selectedResume.fullName || 
                           selectedResume.name || 
                           selectedResume.profile?.fullName || 
                           "";
                           
          const email = selectedResume.email || 
                       selectedResume.profile?.email || 
                       "";
                       
          const phone = selectedResume.phone || 
                       selectedResume.profile?.phone || 
                       "";
          
          // Handle various address formats
          let address = "";
          if (selectedResume.location) {
            address = selectedResume.location;
          } else if (selectedResume.address) {
            address = selectedResume.address;
          } else if (selectedResume.profile?.location) {
            address = selectedResume.profile.location;
          } else if (selectedResume.city || selectedResume.state || selectedResume.country) {
            address = `${selectedResume.city || ""}, ${selectedResume.state || ""}, ${selectedResume.country || ""}`.replace(/^, |, $/g, '');
          }
          
          // Set personal info with all the extracted data
          setPersonalInfo(prev => ({
            ...prev,
            resumeId: selectedResume.id,
            fullName: fullName || prev.fullName,
            email: email || prev.email,
            phone: phone || prev.phone,
            address: address || prev.address
          }));
          
          // Show success toast if data was loaded
          if (fullName || email || phone || address) {
            toast({
              title: "Resume Selected",
              description: "Personal information loaded from your resume."
            });
          } else {
            toast({
              title: "Resume Selected",
              description: "Could not find personal information in this resume.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error("Error selecting resume:", error);
        toast({
          title: "Error",
          description: "Failed to load resume data. Please enter information manually.",
          variant: "destructive"
        });
      }
    } else {
      setPersonalInfo(prev => ({
        ...prev,
        resumeId: null
      }));
    }
  };

  // Handle step navigation
  const handleStepNavigation = (direction: 'next' | 'prev') => {
    const currentIndex = BUILDER_STEPS.indexOf(currentStep);
    let nextStep: BuilderStep;

    if (direction === 'next') {
      nextStep = BUILDER_STEPS[currentIndex + 1];
    } else {
      nextStep = BUILDER_STEPS[currentIndex - 1];
    }

    if (nextStep) {
      // Save the current state before navigating
      const state = {
        formData,
        jobDetails: {
          ...jobDetails,
          jobDescription: jobDetails.jobDescription || ""
        },
        companyInfo,
        personalInfo,
        currentStep: nextStep // Use the next step in the storage
      };
      sessionStorage.setItem('coverLetterBuilderState', JSON.stringify(state));
      
      // Now navigate to the next step
      goToStep(nextStep);
    }
  };

  // Handle save progress
  const handleSaveProgress = async () => {
    if (!formData.title || !jobDetails.jobTitle || !companyInfo.companyName) {
      toast({
        title: "Missing information",
        description: "Please provide at least a title, job title, and company name",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Disable the button while saving
      const saveButtons = document.querySelectorAll('button');
      saveButtons.forEach(button => {
        if (button.textContent?.includes('Save Progress')) {
          button.disabled = true;
        }
      });
      
      await saveCoverLetter(true);
    } catch (error) {
      console.error("Save progress failed:", error);
    } finally {
      // Re-enable the button
      const saveButtons = document.querySelectorAll('button');
      saveButtons.forEach(button => {
        if (button.textContent?.includes('Save Progress')) {
          button.disabled = false;
        }
      });
    }
  };

  // Handle final save
  const handleFinalSave = async () => {
    if (!formData.title || !formData.content || !jobDetails.jobTitle || !companyInfo.companyName) {
      toast({
        title: "Missing information",
        description: "Please provide a title, job title, company name, and content for your cover letter",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Disable the button while saving
      const saveButtons = document.querySelectorAll('button');
      saveButtons.forEach(button => {
        if (button.textContent?.includes('Save Cover Letter')) {
          button.disabled = true;
        }
      });
      
      await saveCoverLetter(false);
    } catch (error) {
      console.error("Final save failed:", error);
    } finally {
      // Re-enable the button
      const saveButtons = document.querySelectorAll('button');
      saveButtons.forEach(button => {
        if (button.textContent?.includes('Save Cover Letter')) {
          button.disabled = false;
        }
      });
    }
  };

  // Effect to handle the URL query parameter (for editing)
  useEffect(() => {
    const fetchCoverLetter = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      const isNew = params.get('new') === 'true';
      
      console.log('URL params:', { id, isNew });
      setIsNewCoverLetter(isNew);
      
      if (id) {
        const parsedId = parseInt(id);
        if (!isNaN(parsedId)) {
          setCoverLetterId(parsedId);
          
          // Fetch the cover letter data
          try {
            const response = await apiRequest('GET', `/api/cover-letters/${parsedId}`);
            if (response.ok) {
              const coverLetterData = await response.json();
              console.log('Loaded cover letter data:', coverLetterData);
              
              // Populate form data
              setFormData({
                title: coverLetterData.title || '',
                content: coverLetterData.content || '',
                template: coverLetterData.template || 'standard'
              });
              
              // Populate job details
              setJobDetails({
                jobTitle: coverLetterData.jobTitle || '',
                jobDescription: coverLetterData.jobDescription || ''
              });
              
              // Populate personal info
              setPersonalInfo({
                resumeId: coverLetterData.resumeId,
                fullName: coverLetterData.fullName || '',
                email: coverLetterData.email || '',
                phone: coverLetterData.phone || '',
                address: coverLetterData.address || ''
              });
              
              // Populate company info
              setCompanyInfo({
                companyName: coverLetterData.company || '',
                recipientName: coverLetterData.recipientName || ''
              });
              
              // Debug log to verify the state is correctly initialized
              console.log('After initialization:', {
                formData: {
                  title: coverLetterData.title || '',
                  content: coverLetterData.content || '',
                  template: coverLetterData.template || 'standard'
                },
                personalInfo: {
                  resumeId: coverLetterData.resumeId,
                  fullName: coverLetterData.fullName || '',
                  email: coverLetterData.email || '',
                  phone: coverLetterData.phone || '',
                  address: coverLetterData.address || ''
                },
                jobDetails: {
                  jobTitle: coverLetterData.jobTitle || '',
                  jobDescription: coverLetterData.jobDescription || ''
                },
                companyInfo: {
                  companyName: coverLetterData.company || '',
                  recipientName: coverLetterData.recipientName || ''
                }
              });
              
              // If this is a new cover letter, ensure all personal fields are empty
              if (isNew) {
                console.log('This is a new cover letter - resetting personal fields to empty strings');
                setPersonalInfo({
                  resumeId: null,
                  fullName: '',
                  email: '',
                  phone: '',
                  address: ''
                });
              }
            }
          } catch (error) {
            console.error('Error fetching cover letter:', error);
            toast({
              title: "Error",
              description: "Failed to load cover letter. Please try again.",
              variant: "destructive"
            });
          }
        }
      }
    };
    
    fetchCoverLetter();
  }, [toast]);

  // Add a function to generate PDF from the actual React template components
  const generatePDFFromCoverLetterTemplate = async (templateName: string, templateData: any) => {
    try {
      setIsGenerating(true);
      
      // Clean content by removing HTML comments and metadata
      let cleanContent = templateData.content;
      cleanContent = cleanContent
        .replace(/<!--[\s\S]*?-->/g, '')   // Remove HTML comments
        .replace(/\n\n\n+/g, '\n\n')       // Remove excessive line breaks
        .trim();                            // Trim any whitespace
      
      // Dynamically import the selected template component
      let TemplateComponent;
      try {
        if (templateName === 'modern') {
          const module = await import('@/templates/implementations/cover-letter/ModernCoverLetter');
          TemplateComponent = module.default;
        } else if (templateName === 'professional') {
          const module = await import('@/templates/implementations/cover-letter/ProfessionalCoverLetter');
          TemplateComponent = module.default;
        } else {
          // Default to standard
          const module = await import('@/templates/implementations/cover-letter/StandardCoverLetter');
          TemplateComponent = module.default;
        }
      } catch (error) {
        console.error("Error importing template:", error);
        throw new Error(`Failed to load template: ${templateName}`);
      }
      
      if (!TemplateComponent) {
        throw new Error('Template not found');
      }
      
      // Create the React element with the template component
      const element = React.createElement(TemplateComponent, {
        data: {
          ...templateData,
          content: cleanContent
        },
        customCss: `
          /* Page format with minimal margins */
          @page {
            size: A4;
            margin-top: 5mm;
            margin-right: 0;
            margin-bottom: 0;
            margin-left: 0;
          }
          
          /* First page should have no top margin */
          @page :first {
            margin: 0;
          }
          
          /* Page should fill the entire space */
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }
          
          /* Print-specific styles */
          @media print {
            body {
              background-color: white;
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .cover-letter-container, .cover-letter-standard, .cover-letter-modern, .cover-letter-professional {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              box-sizing: border-box;
            }
          }
          
          /* Keep logical sections together */
          header {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Recipient should stay together */
          .recipient, section:nth-of-type(1) {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Footer should stay together */
          footer {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Keep paragraphs together when possible */
          p {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        `
      });
      
      // Generate the PDF using the utility function, specifying the endpoint
      const filename = `${templateData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const coverLetterEndpoint = '/api/cover-letter-templates/generate-pdf'; // Define endpoint
      const pdfBlob = await generatePDFFromReactElement(element, filename, coverLetterEndpoint); // Pass endpoint
      
      // Create a download link for the PDF
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(pdfBlob);
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Revoke the URL to free memory
      setTimeout(() => {
        URL.revokeObjectURL(downloadLink.href);
      }, 100);
      
      toast({
        title: "Success",
        description: "PDF generated and downloaded successfully!",
      });
      
      return pdfBlob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Download as PDF - Add limit handling and state update
  const downloadAsPDF = async () => {
    // Reset limit state on new attempt
    setCoverLetterId(null); 
    // isGenerating state is already handled by generatePDFFromCoverLetterTemplate

    try {
      // First save the cover letter if it's not saved yet AND has content
      if (!coverLetterId && !isEditing && formData.content && formData.title && jobDetails.jobTitle && companyInfo.companyName) {
        await saveCoverLetter(false);
      } else if (!coverLetterId && !formData.content) {
        // If no content, show a message
        toast({
          title: "Missing content",
          description: "Please generate or enter content for your cover letter first",
          variant: "destructive",
        });
        return;
      }
      
      // Create the data object for the template
      const templateData = {
        title: formData.title || "Cover Letter",
        fullName: personalInfo.fullName || "Your Name",
        email: personalInfo.email || "email@example.com",
        phone: personalInfo.phone || "(123) 456-7890",
        address: personalInfo.address || "City, State",
        recipientName: companyInfo.recipientName || "Hiring Manager",
        companyName: companyInfo.companyName || "Company Name",
        jobTitle: jobDetails.jobTitle || "Position",
        content: formData.content || "Your cover letter content will appear here...",
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
      
      console.log("Using template data for PDF generation:", templateData);
      
      await generatePDFFromCoverLetterTemplate(formData.template || 'standard', templateData);
      
    } catch (error: any) {
      console.error('Error initiating PDF download:', error);

      // Use our standardized error handler
      if (!handleSubscriptionError(error, toast)) {
        toast({
          title: "Error Generating PDF",
          description: error.message || "Failed to generate PDF. Please try again.",
          variant: "destructive",
        });
      }
    } 
  };

  // Component rendering for the selected template
  const renderTemplateComponent = () => {
    if (!formData.template || typeof formData.template !== 'string') {
      console.log("No template selected or invalid template", formData.template);
      return <div className="p-4 text-red-500">No template selected</div>;
    }
    
    // Get the template metadata
    const selectedTemplateMetadata = coverLetterTemplateMetadata[formData.template as keyof typeof coverLetterTemplateMetadata];
    console.log("Selected template metadata:", selectedTemplateMetadata);
    
    if (!selectedTemplateMetadata) {
      console.log("Template metadata not found for", formData.template);
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
        
        console.log("Rendering template component:", TemplateComponent.name);
        
        // Create the data object to pass to the template
        const templateData = {
          title: formData.title || "Cover Letter",
          fullName: personalInfo.fullName || "Your Name",
          email: personalInfo.email || "email@example.com",
          phone: personalInfo.phone || "(123) 456-7890",
          address: personalInfo.address || "City, State",
          recipientName: companyInfo.recipientName || "Hiring Manager",
          companyName: companyInfo.companyName || "Company Name",
          jobTitle: jobDetails.jobTitle || "Position",
          content: formData.content || "Your cover letter content will appear here...",
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        };
        
        return <TemplateComponent data={templateData} />;
      } catch (error) {
        console.error("Error rendering template:", error);
        return <div className="p-4 text-red-500">Error rendering template: {String(error)}</div>;
      }
    }
    
    console.log("No component property found in template metadata");
    return <div className="p-4 text-red-500">Template component not available</div>;
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "template":
        return (
          <div className="space-y-4">
            <CoverLetterTemplateSelection 
              selectedTemplate={formData.template} 
              onChange={(template) => setFormData(prev => ({...prev, template}))} 
            />
          </div>
        );
      
      case "job-details":
        return (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Job Details</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentStep("template")}
                >
                  Back to Templates
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Cover Letter Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange(e, setFormData)}
                    placeholder="Senior Developer Application - Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    value={jobDetails.jobTitle}
                    onChange={(e) => handleInputChange(e, setJobDetails)}
                    placeholder="Senior Software Developer"
                  />
                </div>
                <div>
                  <Label htmlFor="jobDescription">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    name="jobDescription"
                    value={jobDetails.jobDescription}
                    onChange={(e) => handleInputChange(e, setJobDetails)}
                    placeholder="Paste the job description here..."
                    className="h-60"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case "personal-info":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              
              <div className="mb-6">
                <Label>Use Existing Resume</Label>
                <Select
                  value={personalInfo.resumeId?.toString() || "none"}
                  onValueChange={handleResumeSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Array.isArray(resumes) && resumes.map((resume: any) => (
                      <SelectItem key={resume.id.toString()} value={resume.id.toString()}>
                        {resume.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Your personal details will be auto-filled from the selected resume
                </p>
              </div>
              
              {!personalInfo.resumeId && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={personalInfo.fullName}
                      onChange={(e) => handleInputChange(e, setPersonalInfo)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      value={personalInfo.email}
                      onChange={(e) => handleInputChange(e, setPersonalInfo)}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={personalInfo.phone}
                      onChange={(e) => handleInputChange(e, setPersonalInfo)}
                      placeholder="(123) 456-7890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={personalInfo.address}
                      onChange={(e) => handleInputChange(e, setPersonalInfo)}
                      placeholder="City, State"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case "company-info":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Company Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={companyInfo.companyName}
                    onChange={(e) => handleInputChange(e, setCompanyInfo)}
                    placeholder="ABC Corporation"
                  />
                </div>
                <div>
                  <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
                  <Input
                    id="recipientName"
                    name="recipientName"
                    value={companyInfo.recipientName}
                    onChange={(e) => handleInputChange(e, setCompanyInfo)}
                    placeholder="Hiring Manager"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case "content":
        return (
          <div className="space-y-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
                <h2 className="text-base sm:text-lg font-semibold">Content</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateContent}
                    disabled={isGenerating}
                    className="flex-1 sm:flex-none justify-center text-xs sm:text-sm px-2 h-8 sm:h-9"
                  >
                    {isGenerating ? "Generating..." : "Generate with AI"}
                    <Wand2 className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={enhanceContent}
                    disabled={isGenerating || !formData.content}
                    className="flex-1 sm:flex-none justify-center text-xs sm:text-sm px-2 h-8 sm:h-9"
                  >
                    {isGenerating ? "Enhancing..." : "Enhance Content"}
                    <FileEdit className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                name="content"
                value={formData.content}
                onChange={(e) => handleInputChange(e, setFormData)}
                placeholder="Write or generate your cover letter content..."
                className="h-[calc(60vh-180px)] sm:h-80 min-h-[200px] w-full"
              />
            </div>
          </div>
        );
      
      case "export":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Export & Save</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Your cover letter is ready to save and export. A preview is shown on the right.
              </p>
              
              <div className="grid gap-6 mt-8">
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">Save & Download</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      {coverLetterId 
                        ? "Your cover letter is saved. You can download it as a PDF document."
                        : "Save your cover letter to your account first, then download it as a PDF document."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Hide the Save button if we're in the navigation footer */}
                      <div className="hidden">
                        <Button 
                          className="w-full flex items-center gap-2"
                          onClick={handleFinalSave} 
                          disabled={createCoverLetterMutation.isPending || updateCoverLetterMutation.isPending}
                        >
                          {createCoverLetterMutation.isPending || updateCoverLetterMutation.isPending ? "Saving..." : 
                          isEditing ? "Update Cover Letter" : "Save Cover Letter"}
                        </Button>
                      </div>
                      
                      {formData.content && (
                         // Container for button and potential limit message
                         <div className="flex-1 flex flex-col items-stretch gap-2">
                            <Button
                              variant="outline"
                              onClick={downloadAsPDF}
                              // Disable if generating, no content, OR limit reached
                              disabled={isGenerating || !formData.content}
                              className="w-full flex items-center gap-2"
                            >
                               {isGenerating ? (
                                   <>\
                                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                     Generating...
                                   </>
                               ) : (
                                   <>\
                                     <FileDown className="mr-2 h-4 w-4" />
                                    Download PDF
                                   </>
                               )}
                            </Button>
                         </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Cover Letter Preview - same design as resume builder */}
                <div className="hidden xl:block flex-1 h-[calc(100vh-150px)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 border-l dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="w-full h-full overflow-auto p-0">
                    <div className="w-full mx-auto h-full p-0">
                      <CoverLetterPreview 
                        inDesktopPreview={true}
                        data={{
                          template: formData.template,
                          title: formData.title,
                          fullName: personalInfo.fullName,
                          email: personalInfo.email,
                          phone: personalInfo.phone,
                          address: personalInfo.address,
                          recipientName: companyInfo.recipientName,
                          companyName: companyInfo.companyName,
                          jobTitle: jobDetails.jobTitle,
                          content: formData.content
                        }} 
                        hideDownloadButton={true} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Resumes panel component
  const ResumesPanel = () => {
    return (
      <div className="border rounded-lg p-4 mb-6 bg-card">
        <h3 className="text-lg font-medium mb-2">Select a Resume</h3>
        {Array.isArray(resumes) && resumes.length > 0 ? (
          <div className="grid gap-2">
            {resumes.map((resume: { id: number; title: string }) => (
              <div
                key={resume.id.toString()}
                className={`p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors ${
                  personalInfo.resumeId === resume.id ? "bg-accent" : ""
                }`}
                onClick={() => setPersonalInfo(prev => ({
                  ...prev,
                  resumeId: resume.id
                }))}
              >
                <div className="font-medium">{resume.title}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No resumes found. Please create a resume first.
          </p>
        )}
      </div>
    );
  };

  // In the component before the return statement, add debugging for initialization
  useEffect(() => {
    // Check query parameters for initialization
    const params = new URLSearchParams(window.location.search);
    const isNew = params.get('new') === 'true';
    const coverIdParam = params.get('id');
    
    // Only proceed if we have a valid cover ID
    if (!coverIdParam) return;
    
    const coverId = parseInt(coverIdParam);
    
    // Log initialization details
    console.log('Cover Letter Builder Initialization:', { 
      isNew,
      coverId,
      coverLetter: coverLetters.find((c: CoverLetter) => c.id === coverId),
      isLoading: createCoverLetterMutation.isPending || updateCoverLetterMutation.isPending
    });
    
    if (isNew) {
      console.log('New cover letter being created with ID:', coverId);
      
      // Verify if we should initialize from scratch or if unintended data exists
      const currentLetter = coverLetters.find((c: CoverLetter) => c.id === coverId);
      if (currentLetter) {
        console.log('Initial cover letter data:', {
          content: currentLetter.content,
          fullName: currentLetter.fullName || '',
          email: currentLetter.email || '',
          phone: currentLetter.phone || '',
          address: currentLetter.address || '',
          title: currentLetter.title || '',
          company: currentLetter.company || '',
        });
        
        // If this is a new cover letter but has unexpected data, we need to make sure it's properly initialized
        if (isNew && (currentLetter.fullName || currentLetter.email || currentLetter.phone || currentLetter.address)) {
          console.warn('Warning: New cover letter has pre-populated personal data which may indicate a data leak from another letter.');
        }
      }
    }
  }, [coverLetters, createCoverLetterMutation.isPending, updateCoverLetterMutation.isPending]);

    return (
    <>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950">
        <Header />
        <div className="flex flex-1 overflow-hidden">
        {/* Step sidebar */}
        <div className="w-64 bg-card border-r p-4 hidden md:block dark:border-slate-800 flex-shrink-0">
          <h2 className="font-semibold mb-6">Build Your Cover Letter</h2>
          <ul className="space-y-1">
            {[
              { id: BUILDER_STEPS[0], label: "Template", icon: <FileText className="h-4 w-4" /> },
              { id: BUILDER_STEPS[1], label: "Job Details", icon: <Briefcase className="h-4 w-4" /> },
              { id: BUILDER_STEPS[2], label: "Personal Info", icon: <Plus className="h-4 w-4" /> },
              { id: BUILDER_STEPS[3], label: "Company Info", icon: <Building className="h-4 w-4" /> },
              { id: BUILDER_STEPS[4], label: "Content", icon: <FileText className="h-4 w-4" /> },
              { id: BUILDER_STEPS[5], label: "Export", icon: <FileText className="h-4 w-4" /> },
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

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-6 pb-0">
            <div className="flex items-center mb-4 sm:mb-6 justify-between flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/cover-letters"}
                className="h-9 text-xs sm:text-sm px-2 sm:px-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Back to Cover Letters</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/cover-letter-builder"}
                className="h-9 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">New Cover Letter</span>
              </Button>
            </div>

            {/* Mobile step indicator with DIRECT step navigation */}
            <div className="sm:hidden flex flex-col gap-2 mb-4">
              <div className="grid grid-cols-3 gap-1.5">
                <Button 
                  variant={currentStep === "template" ? "default" : "outline"} 
                  size="sm"
                  className="h-10 px-2 text-xs"
                  onClick={() => setCurrentStep("template")}
                >
                  <span className="truncate">Template</span>
                </Button>
                <Button 
                  variant={currentStep === "job-details" ? "default" : "outline"} 
                  size="sm"
                  className="h-10 px-2 text-xs"
                  onClick={() => setCurrentStep("job-details")}
                >
                  <span className="truncate">Job Details</span>
                </Button>
                <Button 
                  variant={currentStep === "personal-info" ? "default" : "outline"} 
                  size="sm"
                  className="h-10 px-2 text-xs"
                  onClick={() => setCurrentStep("personal-info")}
                >
                  <span className="truncate">Personal</span>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <Button 
                  variant={currentStep === "company-info" ? "default" : "outline"} 
                  size="sm"
                  className="h-10 px-2 text-xs"
                  onClick={() => setCurrentStep("company-info")}
                >
                  <span className="truncate">Company</span>
                </Button>
                <Button 
                  variant={currentStep === "content" ? "default" : "outline"} 
                  size="sm"
                  className="h-10 px-2 text-xs"
                  onClick={() => setCurrentStep("content")}
                >
                  <span className="truncate">Content</span>
                </Button>
                <Button 
                  variant={currentStep === "export" ? "default" : "outline"} 
                  size="sm"
                  className="h-10 px-2 text-xs"
                  onClick={() => setCurrentStep("export")}
                >
                  <span className="truncate">Export</span>
                </Button>
              </div>
            </div>

            {/* Mobile preview button */}
            <div className="block xl:hidden mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobilePreview(true)}
                className="w-full h-10 flex items-center justify-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Cover Letter
              </Button>
            </div>
          </div>

          {/* Builder content */}
          <div className="flex-1 flex flex-col xl:flex-row gap-6 px-6 pb-6 overflow-hidden">
            {/* Form area */}
            <div className="bg-card p-3 sm:p-6 rounded-lg shadow-sm border dark:border-slate-800 xl:w-[45%] w-full flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                {renderStepContent()}
              </div>
              
              {/* Navigation buttons */}
              <div className="flex-shrink-0 flex justify-between mt-6 sm:mt-8 pt-4 border-t">
                <div className="flex gap-1 sm:gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => handleStepNavigation('prev')}
                    disabled={currentStep === "template"}
                    size="sm"
                    className="h-10 px-3 sm:px-4 text-xs sm:text-sm"
                  >
                    Back
                  </Button>
                  
                  {currentStep !== "template" && currentStep !== "export" && (
                    <Button
                      variant="outline"
                      onClick={handleSaveProgress}
                      disabled={
                        !formData.title || 
                        !jobDetails.jobTitle || 
                        !companyInfo.companyName || 
                        createCoverLetterMutation.isPending || 
                        updateCoverLetterMutation.isPending
                      }
                      size="sm"
                      className="h-10 px-3 sm:px-4 text-xs sm:text-sm"
                    >
                      {createCoverLetterMutation.isPending || updateCoverLetterMutation.isPending ? "Saving..." : "Save Progress"}
                    </Button>
                  )}
                </div>
                
                {currentStep === "export" ? (
                  <Button 
                    onClick={handleFinalSave}
                    disabled={
                      !formData.title || 
                      !formData.content || 
                      !jobDetails.jobTitle || 
                      !companyInfo.companyName || 
                      createCoverLetterMutation.isPending || 
                      updateCoverLetterMutation.isPending
                    }
                    size="sm"
                    className="h-10 px-3 sm:px-4 text-xs sm:text-sm"
                  >
                    {createCoverLetterMutation.isPending || updateCoverLetterMutation.isPending ? 
                     "Saving..." : isEditing ? "Update" : "Save"}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleStepNavigation('next')}
                    disabled={
                      (currentStep === "job-details" && (!formData.title || !jobDetails.jobTitle)) ||
                      (currentStep === "company-info" && !companyInfo.companyName) ||
                      (currentStep === "content" && !formData.content)
                    }
                    size="sm"
                    className="h-10 px-3 sm:px-4 text-xs sm:text-sm"
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>

            {/* Preview area */}
            <div className="hidden xl:block flex-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 border-l dark:border-slate-800 rounded-lg overflow-hidden">
              <CoverLetterPreview 
                inDesktopPreview={true}
                data={{
                  template: formData.template,
                  title: formData.title,
                  fullName: personalInfo.fullName,
                  email: personalInfo.email,
                  phone: personalInfo.phone,
                  address: personalInfo.address,
                  recipientName: companyInfo.recipientName,
                  companyName: companyInfo.companyName,
                  jobTitle: jobDetails.jobTitle,
                  content: formData.content
                }} 
                hideDownloadButton={true} 
              />
            </div>
          </div>
        </div>
      </div>
      </div>
      
      {/* Mobile Preview Dialog */}
      <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
        <DialogContent className="max-w-full w-[98vw] h-[95vh] max-h-[95vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-3 py-2 border-b">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-base">Cover Letter Preview</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0" 
                onClick={() => setShowMobilePreview(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 pt-0 pb-0 px-0 overflow-hidden">
            <CoverLetterPreview 
              inMobileModal={true}
              data={{
                template: formData.template,
                title: formData.title,
                fullName: personalInfo.fullName,
                email: personalInfo.email,
                phone: personalInfo.phone,
                address: personalInfo.address,
                recipientName: companyInfo.recipientName,
                companyName: companyInfo.companyName,
                jobTitle: jobDetails.jobTitle,
                content: formData.content
              }} 
              hideDownloadButton={false} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}