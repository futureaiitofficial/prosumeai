import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus,
  Briefcase,
  ArrowRight,
  Trash2,
  Eye,
  Search,
  Calendar,
  Filter,
  X,
  ChevronDown
} from "lucide-react";
import DefaultLayout from "@/components/layouts/default-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { type DateRange } from "react-day-picker";
import {
  format,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
  endOfDay,
  parseISO
} from "date-fns";
import type { Resume } from "@shared/schema";
import { useSubscriptionErrorHandler } from "@/utils/error-handler";

export default function Resumes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    targetJobTitle: "",
    companyName: "",
    jobDescription: ""
  });
  const { handleError, ErrorDialog } = useSubscriptionErrorHandler();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: undefined, 
    to: undefined 
  });
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Fetch resumes
  const { data: resumes = [], isLoading } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
    enabled: !!user
  });

  // Filtered resumes
  const [filteredResumes, setFilteredResumes] = useState<Resume[]>([]);

  // Add state for checking references before deletion
  const [checkingReferences, setCheckingReferences] = useState(false);
  const [resumeReferences, setResumeReferences] = useState<any>(null);

  // Apply filters when search term or date range changes
  useEffect(() => {
    if (!resumes.length) {
      setFilteredResumes([]);
      return;
    }

    let filtered = [...resumes];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (resume) =>
          resume.title?.toLowerCase().includes(term) ||
          resume.targetJobTitle?.toLowerCase().includes(term) ||
          resume.companyName?.toLowerCase().includes(term)
      );
    }

    // Apply date filter
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter((resume) => {
        const createdDate = resume.createdAt ? new Date(resume.createdAt) : null;

        if (!createdDate) return false;

        if (dateRange?.from && dateRange?.to) {
          return (
            isAfter(createdDate, startOfDay(dateRange.from)) &&
            isBefore(createdDate, endOfDay(dateRange.to))
          );
        } else if (dateRange?.from) {
          return isAfter(createdDate, startOfDay(dateRange.from));
        } else if (dateRange?.to) {
          return isBefore(createdDate, endOfDay(dateRange.to));
        }

        return true;
      });
    }

    setFilteredResumes(filtered);
  }, [resumes, searchTerm, dateRange]);

  // Create resume mutation
  const createResumeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/resumes", {
        ...data,
        userId: user?.id,
        template: "professional", // Default template, will be changed later in the process
        // Initialize arrays to prevent null reference errors
        workExperience: [],
        education: [],
        skills: [],
        technicalSkills: [],
        softSkills: [],
        certifications: [],
        projects: [],
        useSkillCategories: false
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({
        title: "Resume Started",
        description: "Let's build your professional resume."
      });
      setOpen(false);
      setFormData({
        title: "",
        targetJobTitle: "",
        companyName: "",
        jobDescription: ""
      });

      // Navigate to resume builder with the new resume ID
      navigate(`/resume-builder?id=${data.id}`);
    },
    onError: (error: Error) => {
      // Handle subscription errors
      const handled = handleError(error);
      
      // Only show generic error if subscription error wasn't caught
      if (!handled) {
        toast({
          title: "Failed to create resume",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  });

  // Delete resume mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/resumes/${id}`);
      // If the response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({
        title: "Resume Deleted",
        description: "Your resume has been permanently deleted."
      });
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    },
    onError: (error: Error) => {
      // Handle subscription errors first
      const handled = handleError(error);
      
      // If not a subscription error, handle constraint violations
      if (!handled) {
        let errorMessage = "Failed to delete resume";
        let errorDescription = error.message;
        
        try {
          // Try to parse the error as JSON (from our enhanced error response)
          const errorData = JSON.parse(error.message);
          
          if (errorData.constraint === "cover_letters") {
            errorMessage = "Cannot Delete Resume";
            errorDescription = "This resume is linked to one or more cover letters. Please delete the cover letters first or remove the links.";
          } else if (errorData.constraint === "job_applications") {
            errorMessage = "Cannot Delete Resume";
            errorDescription = "This resume is linked to one or more job applications. Please remove those links first.";
          } else if (errorData.detail === "foreign key constraint violation") {
            errorMessage = "Cannot Delete Resume";
            errorDescription = errorData.error || "This resume is referenced by other data. Please remove those references first.";
          } else {
            errorDescription = errorData.message || errorData.error || error.message;
          }
        } catch {
          // If parsing fails, use the original error message
          errorDescription = error.message;
        }
        
        toast({
          title: errorMessage,
          description: errorDescription,
          variant: "destructive",
          duration: 6000
        });
      }
      
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    }
  });

  // Function to check resume references
  const checkResumeReferences = async (resumeId: number) => {
    try {
      setCheckingReferences(true);
      console.log('Checking references for resume ID:', resumeId);
      
      const response = await apiRequest("GET", `/api/resumes/${resumeId}/references`);
      console.log('References response status:', response.status);
      
      const data = await response.json();
      console.log('References response data:', data);
      
      setResumeReferences(data);
      
      if (data.canDelete) {
        // If no references, proceed with normal deletion
        setResumeToDelete(resumeId);
        setDeleteDialogOpen(true);
      } else {
        // If there are references, show the enhanced dialog
        setResumeToDelete(resumeId);
        setDeleteDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Error checking resume references:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to check resume references. Please try again.";
      
      if (error.message) {
        if (error.message.includes('Authentication required')) {
          errorMessage = "Authentication required. Please refresh the page and try again.";
        } else if (error.message.includes('404')) {
          errorMessage = "Resume not found. Please refresh the page.";
        } else if (error.message.includes('403')) {
          errorMessage = "You don't have permission to access this resume.";
        } else if (error.message.includes('500')) {
          errorMessage = "Server error occurred. Please try again later.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      // Set fallback state - allow deletion but show warning
      setResumeReferences({
        resumeId,
        resumeTitle: "Unknown Resume",
        references: { coverLetters: [], jobApplications: [] },
        canDelete: true,
        checkFailed: true,
        errorMessage
      });
      
      setResumeToDelete(resumeId);
      setDeleteDialogOpen(true);
      
      toast({
        title: "Warning",
        description: `${errorMessage} Proceeding with deletion dialog, but please be cautious.`,
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setCheckingReferences(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createResumeMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle date filter clearing
  const handleClearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  // Function to format date range for display
  const formatDateRange = () => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "MMM d, yyyy")} - ${format(
        dateRange.to,
        "MMM d, yyyy"
      )}`;
    } else if (dateRange?.from) {
      return `From ${format(dateRange.from, "MMM d, yyyy")}`;
    } else if (dateRange?.to) {
      return `Until ${format(dateRange.to, "MMM d, yyyy")}`;
    }
    return "All dates";
  };

  // Function to display creation date
  const displayDate = (dateString?: string | Date | null) => {
    if (!dateString) return "Unknown date";
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return format(date, "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <DefaultLayout
      pageTitle="Resumes"
      pageDescription="Create and manage your professional resumes"
    >
      {/* Subscription Error Dialog */}
      <ErrorDialog />
      
      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex w-full max-w-md items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title, job title, or company..."
            className="w-full pl-8 pr-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              className="absolute right-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">{formatDateRange()}</span>
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Date Range</h4>
                  {(dateRange.from || dateRange.to) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearDateFilter}
                      className="h-auto p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(selectedRange: DateRange | undefined) => {
                  if (selectedRange) {
                    setDateRange(selectedRange);
                  }
                }}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Resume
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Resume</DialogTitle>
                <DialogDescription>
                  Let's get started with some basic information for your resume.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Resume Name</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g. Software Developer Resume"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      A unique name to identify this resume
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="targetJobTitle">Target Position</Label>
                    <Input
                      id="targetJobTitle"
                      name="targetJobTitle"
                      placeholder="e.g. Senior Software Engineer"
                      value={formData.targetJobTitle}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      The job position you're applying for
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder="e.g. Acme Corporation"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="jobDescription">Job Description</Label>
                    <Textarea
                      id="jobDescription"
                      name="jobDescription"
                      placeholder="Paste the job description here to optimize your resume..."
                      value={formData.jobDescription}
                      onChange={handleChange}
                      rows={5}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      This helps tailor your resume to match the job requirements
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createResumeMutation.isPending}
                  >
                    {createResumeMutation.isPending
                      ? "Creating..."
                      : "Continue to Resume Builder"}
                    {!createResumeMutation.isPending && (
                      <ArrowRight className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-gray-200 dark:bg-gray-800 rounded-t-lg" />
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-3/4 mb-4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full w-full mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <Card className="w-full h-60 flex flex-col items-center justify-center text-center p-6">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-primary-50 p-4 dark:bg-primary-900">
                <Briefcase className="h-6 w-6 text-primary-600 dark:text-primary-300" />
              </div>
              <h3 className="text-lg font-medium">No Resumes Yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create your first resume to get started with your job
                applications.
              </p>
              <Button onClick={() => setOpen(true)}>Create Resume</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {filteredResumes.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No matching resumes found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
          
          {filteredResumes.length === 0 && dateRange.from && (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No resumes found in selected date range</h3>
              <p className="text-muted-foreground">
                Try selecting a different date range
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleClearDateFilter}
              >
                Clear Date Filter
              </Button>
            </div>
          )}
          
          {filteredResumes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResumes.map((resume) => (
                <Card key={resume.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{resume.title}</CardTitle>
                        <CardDescription>{resume.targetJobTitle}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          checkResumeReferences(resume.id);
                        }}
                        disabled={checkingReferences}
                      >
                        {checkingReferences ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 mr-2">Company:</span>
                        <span className="font-medium">
                          {resume.companyName || "Not specified"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 mr-2">Created:</span>
                        <span className="font-medium">
                          {displayDate(resume.createdAt)}
                        </span>
                      </div>
                      {resume.jobDescription && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {resume.jobDescription.substring(0, 100)}...
                        </p>
                      )}
                      <div className="flex items-center text-sm mt-1">
                        <span className="text-gray-500 mr-2">Template:</span>
                        <span className="capitalize">{resume.template}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/resume-builder?id=${resume.id}`)}
                    >
                      Edit Resume
                    </Button>
                    <Button size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {resumeReferences?.canDelete ? "Are you sure?" : "Cannot Delete Resume"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {resumeReferences?.checkFailed && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <strong>Warning:</strong> Unable to verify resume references due to: {resumeReferences.errorMessage}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Deletion may fail if this resume is linked to other items.
                      </p>
                    </div>
                  )}
                  
                  {resumeReferences?.canDelete ? (
                    "This action cannot be undone. This will permanently delete your resume and all associated data."
                  ) : (
                    <div className="space-y-3">
                      <p>This resume cannot be deleted because it's linked to other items:</p>
                      
                      {resumeReferences?.references?.coverLetters?.length > 0 && (
                        <div>
                          <p className="font-semibold text-sm">Cover Letters ({resumeReferences.references.coverLetters.length}):</p>
                          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                            {resumeReferences.references.coverLetters.map((cl: any) => (
                              <li key={cl.id}>
                                {cl.title} - {cl.company} ({cl.jobTitle})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {resumeReferences?.references?.jobApplications?.length > 0 && (
                        <div>
                          <p className="font-semibold text-sm">Job Applications ({resumeReferences.references.jobApplications.length}):</p>
                          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                            {resumeReferences.references.jobApplications.map((ja: any) => (
                              <li key={ja.id}>
                                {ja.company} - {ja.jobTitle} ({ja.status})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600">
                        Please remove these links or delete the linked items first, then try again.
                      </p>
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setResumeReferences(null);
                }}>
                  {resumeReferences?.canDelete ? "Cancel" : "Close"}
                </AlertDialogCancel>
                {resumeReferences?.canDelete && (
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-600"
                    onClick={() =>
                      resumeToDelete && deleteResumeMutation.mutate(resumeToDelete)
                    }
                    disabled={deleteResumeMutation.isPending}
                  >
                    {deleteResumeMutation.isPending
                      ? "Deleting..."
                      : "Delete Resume"}
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </DefaultLayout>
  );
}