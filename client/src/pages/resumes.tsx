import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Briefcase, ArrowRight, Trash2, Eye, Search, Calendar, Filter, X, ChevronDown } from "lucide-react";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { SelectRangeEventHandler } from "react-day-picker";

export default function Resumes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    targetJobTitle: '',
    companyName: '',
    jobDescription: '',
  });
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: undefined, 
    to: undefined 
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // Fetch resumes
  const { data: resumes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/resumes"],
    enabled: !!user,
  });
  
  // Filtered resumes
  const [filteredResumes, setFilteredResumes] = useState<any[]>([]);
  
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
      filtered = filtered.filter((resume) => 
        resume.title?.toLowerCase().includes(term) || 
        resume.targetJobTitle?.toLowerCase().includes(term) || 
        resume.companyName?.toLowerCase().includes(term)
      );
    }
    
    // Apply date filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((resume) => {
        const createdDate = resume.createdAt ? new Date(resume.createdAt) : null;
        
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
    
    setFilteredResumes(filtered);
  }, [resumes, searchTerm, dateRange]);

  const createResumeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest(
        "POST", 
        "/api/resumes", 
        { 
          ...data, 
          userId: user?.id,
          template: 'professional', // Default template, will be changed later in the process
          // Initialize arrays to prevent null reference errors
          workExperience: [],
          education: [],
          skills: [],
          technicalSkills: [],
          softSkills: [],
          certifications: [],
          projects: [],
          useSkillCategories: false
        }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({
        title: "Resume Started",
        description: "Let's build your professional resume.",
      });
      setOpen(false);
      setFormData({
        title: '',
        targetJobTitle: '',
        companyName: '',
        jobDescription: '',
      });
      
      // Navigate to resume builder with the new resume ID
      navigate(`/resume-builder?id=${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create resume",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete resume mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/resumes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({
        title: "Resume Deleted",
        description: "Your resume has been permanently deleted.",
      });
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete resume",
        description: error.message,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createResumeMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle date filter clearing
  const handleClearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
  };
  
  // Calendar date selection handler
  const handleDateRangeSelect: SelectRangeEventHandler = (range) => {
    setDateRange(range || { from: undefined, to: undefined });
  };
  
  // Function to format date range for display
  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    } else if (dateRange.from) {
      return `From ${format(dateRange.from, 'MMM d, yyyy')}`;
    } else if (dateRange.to) {
      return `Until ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    return 'All dates';
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <Header />
      
      {/* Main content with improved scrolling */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Resumes</h1>
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
                        <p className="text-xs text-gray-500">A unique name to identify this resume</p>
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
                        <p className="text-xs text-gray-500">The job position you're applying for</p>
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
                        <p className="text-xs text-gray-500">This helps tailor your resume to match the job requirements</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createResumeMutation.isPending}
                      >
                        {createResumeMutation.isPending ? "Creating..." : "Continue to Resume Builder"}
                        {!createResumeMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar - sticky */}
        <div className="bg-white border-b sticky top-16 z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    onClick={() => setSearchTerm('')}
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
                          <Button variant="ghost" size="sm" onClick={handleClearDateFilter} className="h-auto p-1">
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
                      onSelect={handleDateRangeSelect}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* Resumes content area - scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-8">
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
                      Create your first resume to get started with your job applications.
                    </p>
                    <Button onClick={() => setOpen(true)}>Create Resume</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResumes.map((resume: any) => (
                    <Card key={resume.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
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
                              setResumeToDelete(resume.id);
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
                            <span className="font-medium truncate">{resume.companyName || 'Not specified'}</span>
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
                      <CardFooter className="flex justify-between pt-2 border-t bg-gray-50">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/resume-builder?id=${resume.id}`)}>
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
                
                {/* Empty state for filtered results */}
                {filteredResumes.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No matching resumes found</h3>
                    <p className="text-gray-500 max-w-md mb-6">
                      Try adjusting your search terms or filters to find what you're looking for.
                    </p>
                    <Button variant="outline" onClick={() => {
                      setSearchTerm('');
                      setDateRange({ from: undefined, to: undefined });
                    }}>
                      Clear all filters
                    </Button>
                  </div>
                )}
                
                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your resume and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => resumeToDelete && deleteResumeMutation.mutate(resumeToDelete)}
                        disabled={deleteResumeMutation.isPending}
                      >
                        {deleteResumeMutation.isPending ? "Deleting..." : "Delete Resume"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}