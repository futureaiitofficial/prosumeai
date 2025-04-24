import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus,
  FileText,
  ArrowRight,
  Trash2,
  Eye,
  Search,
  Calendar,
  ChevronDown,
  X
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { CoverLetter, Resume } from "@shared/schema";

export default function CoverLetters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [coverLetterToDelete, setCoverLetterToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    resumeId: "",
    company: "",
    jobTitle: "",
    recipientName: "",
    recipientTitle: "",
  });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ 
    from: undefined, 
    to: undefined 
  });
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Add this state variable at the top level of the component
  const [jobApplicationsUrl, setJobApplicationsUrl] = useState<string | null>(null);

  // Fetch cover letters
  const { data: coverLetters = [], isLoading } = useQuery<CoverLetter[]>({
    queryKey: ["/api/cover-letters"],
    enabled: !!user
  });

  // Fetch resumes for the select dropdown
  const { data: resumes = [] } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
    enabled: !!user
  });

  // Filtered cover letters
  const [filteredCoverLetters, setFilteredCoverLetters] = useState<CoverLetter[]>([]);

  // Apply filters when search term or date range changes
  useEffect(() => {
    if (!coverLetters.length) {
      setFilteredCoverLetters([]);
      return;
    }

    let filtered = [...coverLetters];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (coverLetter) =>
          coverLetter.title?.toLowerCase().includes(term) ||
          coverLetter.company?.toLowerCase().includes(term) ||
          coverLetter.jobTitle?.toLowerCase().includes(term)
      );
    }

    // Apply date filter
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter((coverLetter) => {
        const createdDate = coverLetter.createdAt ? new Date(coverLetter.createdAt) : null;

        if (!createdDate) return false;

        if (dateRange.from && dateRange.to) {
          return (
            isAfter(createdDate, startOfDay(dateRange.from)) &&
            isBefore(createdDate, endOfDay(dateRange.to))
          );
        } else if (dateRange.from) {
          return isAfter(createdDate, startOfDay(dateRange.from));
        } else if (dateRange.to) {
          return isBefore(createdDate, endOfDay(dateRange.to));
        }

        return true;
      });
    }

    setFilteredCoverLetters(filtered);
  }, [coverLetters, searchTerm, dateRange]);

  // Create cover letter mutation
  const createCoverLetterMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Ensure we're only sending clean data to prevent mixing with existing cover letters
      const payload = {
        title: data.title.trim(),
        company: data.company.trim(),
        jobTitle: data.jobTitle.trim(),
        recipientName: data.recipientName?.trim() || "",
        recipientTitle: data.recipientTitle?.trim() || "",
        resumeId: data.resumeId ? parseInt(data.resumeId, 10) : null,
        template: "standard", // Default template that exists in the system
        content: " ", // Minimal content required by schema
        // Explicitly initialize fields to prevent data leakage
        fullName: "",
        email: "",
        phone: "",
        address: ""
      };
      
      const res = await apiRequest("POST", "/api/cover-letters", payload);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] });
      toast({
        title: "Cover Letter Started",
        description: "Let's build your professional cover letter."
      });
      setOpen(false);
      // Reset form data completely
      setFormData({
        title: "",
        resumeId: "",
        company: "",
        jobTitle: "",
        recipientName: "",
        recipientTitle: "",
      });

      // Navigate to cover letter builder with the new cover letter ID and a flag to indicate it's new
      navigate(`/cover-letter-builder?id=${data.id}&new=true`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create cover letter",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete cover letter mutation
  const deleteCoverLetterMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/cover-letters/${id}`);
      // If the response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json();
        // Check if it's a foreign key constraint error
        if (errorData.error && errorData.error.includes('foreign key constraint')) {
          throw new Error("LINKED_TO_JOB_APPLICATION");
        }
        throw new Error(errorData.message || "Failed to delete cover letter");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] });
      toast({
        title: "Cover Letter Deleted",
        description: "Your cover letter has been permanently deleted."
      });
      setDeleteDialogOpen(false);
      setCoverLetterToDelete(null);
    },
    onError: (error: Error) => {
      // Handle specific error cases
      if (error.message === "LINKED_TO_JOB_APPLICATION") {
        setJobApplicationsUrl('/job-applications-enhanced');
        toast({
          title: "Cannot Delete Cover Letter",
          description: "This cover letter is linked to one or more job applications. Please remove those links first.",
          variant: "destructive",
          duration: 6000
        });
      } else {
        toast({
          title: "Failed to delete cover letter",
          description: error.message,
          variant: "destructive"
        });
      }
      setDeleteDialogOpen(false);
      setCoverLetterToDelete(null);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCoverLetterMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value === "none" ? "" : value
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
  const displayDate = (date?: Date | string | null) => {
    if (!date) return "Unknown date";
    try {
      // Handle both string and Date objects
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Find resume title by ID
  const getResumeTitleById = (resumeId?: number | null) => {
    if (!resumeId) return "No resume linked";
    const resume = resumes.find(r => r.id === resumeId);
    return resume ? resume.title : "Unknown resume";
  };

  return (
    <DefaultLayout
      pageTitle="Cover Letters"
      pageDescription="Create and manage your professional cover letters"
    >
      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex w-full max-w-md items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title, company, or position..."
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
                  {(dateRange?.from || dateRange?.to) && (
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
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(selectedRange: DateRange | undefined) => {
                  setDateRange(selectedRange);
                }}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Cover Letter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Cover Letter</DialogTitle>
                <DialogDescription>
                  Let's get started with some basic information for your cover letter.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Cover Letter Name</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g. Application to Google"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      A unique name to identify this cover letter
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="resumeId">Resume (Optional)</Label>
                    <Select
                      value={formData.resumeId}
                      onValueChange={(value) => handleSelectChange("resumeId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a resume to link" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {resumes.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id.toString()}>
                            {resume.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Link a resume to use its information in your cover letter
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="e.g. Acme Corporation"
                      value={formData.company}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="jobTitle">Job Position</Label>
                    <Input
                      id="jobTitle"
                      name="jobTitle"
                      placeholder="e.g. Senior Software Engineer"
                      value={formData.jobTitle}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
                    <Input
                      id="recipientName"
                      name="recipientName"
                      placeholder="e.g. John Smith"
                      value={formData.recipientName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="recipientTitle">Recipient Title (Optional)</Label>
                    <Input
                      id="recipientTitle"
                      name="recipientTitle"
                      placeholder="e.g. Hiring Manager"
                      value={formData.recipientTitle}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createCoverLetterMutation.isPending}
                  >
                    {createCoverLetterMutation.isPending
                      ? "Creating..."
                      : "Continue to Cover Letter Builder"}
                    {!createCoverLetterMutation.isPending && (
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
      ) : coverLetters.length === 0 ? (
        <Card className="w-full h-60 flex flex-col items-center justify-center text-center p-6">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-primary-50 p-4 dark:bg-primary-900">
                <FileText className="h-6 w-6 text-primary-600 dark:text-primary-300" />
              </div>
              <h3 className="text-lg font-medium">No Cover Letters Yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create your first cover letter to get started with your job
                applications.
              </p>
              <Button onClick={() => setOpen(true)}>Create Cover Letter</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {filteredCoverLetters.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No matching cover letters found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
          
          {filteredCoverLetters.length === 0 && dateRange?.from && (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No cover letters found in selected date range</h3>
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
          
          {filteredCoverLetters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoverLetters.map((coverLetter) => (
                <Card key={coverLetter.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{coverLetter.title}</CardTitle>
                        <CardDescription>{coverLetter.jobTitle}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setCoverLetterToDelete(coverLetter.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 mr-2">Company:</span>
                        <span className="font-medium">
                          {coverLetter.company || "Not specified"}
                        </span>
                      </div>
                      {/* No resume link in schema - intentionally removed */}
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 mr-2">Created:</span>
                        <span className="font-medium">
                          {displayDate(coverLetter.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm mt-1">
                        <span className="text-gray-500 mr-2">Template:</span>
                        <span className="capitalize">{coverLetter.template || "Professional"}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/cover-letter-builder?id=${coverLetter.id}`)}
                    >
                      Edit Cover Letter
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
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  cover letter and all associated data.
                  
                  {jobApplicationsUrl && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                      <p className="font-medium">Note: Cover letters linked to job applications cannot be deleted.</p>
                      <p className="text-sm mt-1">You must first remove the connection in the job applications section.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                        onClick={() => {
                          setDeleteDialogOpen(false);
                          navigate(jobApplicationsUrl);
                        }}
                      >
                        View Job Applications
                      </Button>
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setJobApplicationsUrl(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500 hover:bg-red-600"
                  onClick={() =>
                    coverLetterToDelete && deleteCoverLetterMutation.mutate(coverLetterToDelete)
                  }
                  disabled={deleteCoverLetterMutation.isPending}
                >
                  {deleteCoverLetterMutation.isPending
                    ? "Deleting..."
                    : "Delete Cover Letter"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </DefaultLayout>
  );
}