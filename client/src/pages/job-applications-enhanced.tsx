import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { KanbanView } from "@/components/kanban/kanban-view";
import { 
  Plus, Edit, ExternalLink, Clock, Briefcase, MapPin, Calendar, 
  File, Mail, Phone, FileText, User, Star, StarOff, ChevronDown, 
  ChevronUp, CheckCheck, Filter, Search, ArrowUpDown, MoreHorizontal, Pencil,
  X as Cross2, TableProperties, LayoutGrid, KanbanSquare
} from "lucide-react";
import DefaultLayout from "@/components/layouts/default-layout";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { sanitizeObject } from "@/utils/sanitize";
import { format, parseISO, isAfter, isBefore, isToday, addDays, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusHistoryEntry } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import shared types from the types file
import { 
  JobApplicationStatus, 
  JobApplication, 
  JobApplicationFormData,
  statusColors
} from "@/types/job-application";

const priorityColors = {
  high: "red",
  medium: "yellow",
  low: "blue",
};

const workTypeIcons = {
  onsite: <Briefcase className="h-4 w-4 mr-1" />,
  hybrid: <Briefcase className="h-4 w-4 mr-1" />,
  remote: <Briefcase className="h-4 w-4 mr-1" />,
};

// Add a helper function near the top of the file before the component definition
// This will format a Date object into the format required by datetime-local inputs (YYYY-MM-DDThh:mm)
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Update the getStatusBadgeColor function to return proper Tailwind classes
function getStatusBadgeColor(status: string | JobApplicationStatus) {
  // Convert status to lowercase for consistency if it's a string
  const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : status;
  switch (normalizedStatus) {
    case JobApplicationStatus.Applied:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case JobApplicationStatus.Screening:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case JobApplicationStatus.Interview:
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300";
    case JobApplicationStatus.Assessment:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case JobApplicationStatus.Offer:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case JobApplicationStatus.Rejected:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case JobApplicationStatus.Accepted:
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}

export default function JobApplicationsEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<JobApplicationStatus>(JobApplicationStatus.Applied);
  const [statusNotes, setStatusNotes] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterWorkType, setFilterWorkType] = useState<string | null>(null);
  const [filterDeadline, setFilterDeadline] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('appliedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const initialFormData: JobApplicationFormData = {
    company: "",
    jobTitle: "",
    jobDescription: "",
    location: "",
    workType: "onsite",
    salary: "",
    jobUrl: "",
    status: JobApplicationStatus.Applied,
    statusNotes: "",
    resumeId: "",
    coverLetterId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
    priority: "medium",
    deadlineDate: null,
    interviewDate: null,
    interviewType: "",
    interviewNotes: "",
  };
  
  const [formData, setFormData] = useState<JobApplicationFormData>(initialFormData);

  const { data: jobApplications = [], isLoading } = useQuery<JobApplication[]>({
    queryKey: ["/api/job-applications"],
    enabled: !!user,
    select: (data: any[]) => {
      // Convert string status to enum status for type safety
      return data.map(app => ({
        ...app,
        status: app.status as JobApplicationStatus
      }));
    }
  });

  const { data: resumes = [] } = useQuery<any[]>({
    queryKey: ["/api/resumes"],
    enabled: !!user,
  });

  const { data: coverLetters = [] } = useQuery<any[]>({
    queryKey: ["/api/cover-letters"],
    enabled: !!user,
  });

  const createJobApplicationMutation = useMutation({
    mutationFn: async (data: JobApplicationFormData) => {
      // Prepare the data
      const unsanitizedPayload = {
        ...data,
        userId: user?.id,
        resumeId: data.resumeId && data.resumeId !== "none" ? parseInt(data.resumeId) : null,
        coverLetterId: data.coverLetterId && data.coverLetterId !== "none" ? parseInt(data.coverLetterId) : null,
      };
      
      // Handle deadlineDate - convert to ISO string if it's a Date object
      if (data.deadlineDate instanceof Date) {
        unsanitizedPayload.deadlineDate = data.deadlineDate.toISOString();
      } else {
        unsanitizedPayload.deadlineDate = data.deadlineDate || null;
      }
      
      // Handle interviewDate - convert to ISO string if it's a Date object
      if (data.interviewDate instanceof Date) {
        unsanitizedPayload.interviewDate = data.interviewDate.toISOString();
      } else {
        unsanitizedPayload.interviewDate = data.interviewDate || null;
      }
      
      // Sanitize the data to prevent SQL injection and other attacks
      const payload = sanitizeObject(unsanitizedPayload);
      
      const res = await apiRequest("POST", "/api/job-applications", payload);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create job application');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      toast({
        title: "Job Application Created",
        description: "Your job application has been tracked successfully.",
      });
      setOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: any) => {
      if (error.message.includes('Feature usage limit exceeded') || error.message.includes('limit exceeded')) {
        toast({
          title: "Subscription Limit Reached",
          description: "You've reached your job application limit for this billing cycle. Please upgrade your plan for more job applications.",
          variant: "destructive",
          duration: 6000,
        });
      } else {
        toast({
          title: "Failed to create job application",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: JobApplicationStatus; notes: string }) => {
      // Sanitize the data to prevent SQL injection and other attacks
      const payload = sanitizeObject({ 
        status, 
        notes 
      });
      const res = await apiRequest("POST", `/api/job-applications/${id}/status-history`, payload);
      return await res.json();
    },
    onSuccess: (updatedApplication) => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      toast({
        title: "Status Updated",
        description: "The job application status has been updated successfully.",
      });
      setStatusUpdateOpen(false);
      setNewStatus(JobApplicationStatus.Applied);
      setStatusNotes("");
      
      // Directly use the returned updated application data
      if (updatedApplication && selectedApplication && updatedApplication.id === selectedApplication.id) {
        setSelectedApplication(updatedApplication);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateJobApplicationMutation = useMutation({
    mutationFn: async (data: JobApplicationFormData & { id: number }) => {
      const { id, ...formData } = data;
      
      // Prepare the data
      const unsanitizedPayload = {
        ...formData,
        userId: user?.id,
        resumeId: formData.resumeId && formData.resumeId !== "none" ? parseInt(formData.resumeId) : null,
        coverLetterId: formData.coverLetterId && formData.coverLetterId !== "none" ? parseInt(formData.coverLetterId) : null,
      };
      
      // Handle dates - convert to ISO strings if they're Date objects
      if (formData.deadlineDate instanceof Date) {
        unsanitizedPayload.deadlineDate = formData.deadlineDate.toISOString();
      } else {
        unsanitizedPayload.deadlineDate = formData.deadlineDate || null;
      }
      
      if (formData.interviewDate instanceof Date) {
        unsanitizedPayload.interviewDate = formData.interviewDate.toISOString();
      } else {
        unsanitizedPayload.interviewDate = formData.interviewDate || null;
      }
      
      // Sanitize the data to prevent SQL injection and other attacks
      const payload = sanitizeObject(unsanitizedPayload);
      
      const res = await apiRequest("PUT", `/api/job-applications/${id}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      toast({
        title: "Job Application Updated",
        description: "Your job application has been updated successfully.",
      });
      setDetailOpen(false);
      setEditMode(false);
      setFormData(initialFormData);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update job application",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete job application mutation
  const deleteJobApplicationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/job-applications/${id}`);
      // For successful deletion (204 No Content), there won't be a response body
      if (res.status === 204) {
        return { success: true };
      }
      // For other successful statuses, try to parse the response
      if (res.status >= 200 && res.status < 300) {
        try {
          return await res.json();
        } catch {
          return { success: true };
        }
      }
      // For error responses
      const errorText = await res.text();
      throw new Error(errorText || "Failed to delete job application");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      toast({
        title: "Job Application Deleted",
        description: "The job application has been deleted successfully.",
      });
      setDetailOpen(false);
      setSelectedApplication(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete job application",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const openStatusUpdate = (application: JobApplication) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setStatusNotes("");
    setStatusUpdateOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.company.trim()) {
      toast({
        title: "Missing information",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.jobTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Job title is required",
        variant: "destructive",
      });
      return;
    }
    
    // Validate email format if provided
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      toast({
        title: "Invalid format",
        description: "Please enter a valid email address (format: name@domain.com)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate phone format if provided
    if (formData.contactPhone && !/^[\d\s\-\(\)]+$/.test(formData.contactPhone)) {
      toast({
        title: "Invalid format",
        description: "Please enter a valid phone number format",
        variant: "destructive",
      });
      return;
    }
    
    // Proceed with form submission
    createJobApplicationMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleStatusUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;
    
    // Update the status normally
    updateStatusMutation.mutate({
      id: selectedApplication.id,
      status: newStatus,
      notes: statusNotes
    });
  };

  const getPriorityBadgeColor = (priority: string) => {
    return priorityColors[priority as keyof typeof priorityColors] || "gray";
  };

  const viewApplicationDetails = (application: JobApplication) => {
    setSelectedApplication(application);
    setDetailOpen(true);
    setEditMode(false);
  };

  const startEditingApplication = (application: JobApplication) => {
    setSelectedApplication(application);
    // Convert string date to Date object if needed
    const formattedApplication = {
      ...application,
      deadlineDate: application.deadlineDate ? new Date(application.deadlineDate) : null,
      resumeId: application.resumeId ? application.resumeId.toString() : "none",
      coverLetterId: application.coverLetterId ? application.coverLetterId.toString() : "none"
    };
    
    setFormData(formattedApplication as unknown as JobApplicationFormData);
    setEditMode(true);
    setDetailOpen(true);
  };
  
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;
    
    // Validate required fields
    if (!formData.company.trim()) {
      toast({
        title: "Missing information",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.jobTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Job title is required",
        variant: "destructive",
      });
      return;
    }
    
    // Validate email format if provided
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      toast({
        title: "Invalid format",
        description: "Please enter a valid email address (format: name@domain.com)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate phone format if provided
    if (formData.contactPhone && !/^[\d\s\-\(\)]+$/.test(formData.contactPhone)) {
      toast({
        title: "Invalid format",
        description: "Please enter a valid phone number format",
        variant: "destructive",
      });
      return;
    }
    
    updateJobApplicationMutation.mutate({
      ...formData,
      id: selectedApplication.id
    });
  };

  // Filtering and sorting functions
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleViewMode = () => {
    // Cycle through view modes: table -> cards -> kanban -> table
    if (viewMode === 'table') {
      setViewMode('cards');
    } else if (viewMode === 'cards') {
      setViewMode('kanban');
    } else {
      setViewMode('table');
    }
  };

  // Filter applications based on search and filter criteria
  const filteredApplications = jobApplications.filter((app: JobApplication) => {
    // Search query filtering
    if (searchQuery && !`${app.company} ${app.jobTitle} ${app.location || ''}`.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status filtering
    if (filterStatus && app.status !== filterStatus) {
      return false;
    }
    
    // Priority filtering
    if (filterPriority && app.priority !== filterPriority) {
      return false;
    }
    
    // Work Type filtering
    if (filterWorkType && app.workType !== filterWorkType) {
      return false;
    }
    
    // Deadline filtering
    if (filterDeadline) {
      if (filterDeadline === 'upcoming' && app.deadlineDate) {
        const deadline = new Date(app.deadlineDate);
        const today = new Date();
        const next7Days = addDays(today, 7);
        
        if (!(isAfter(deadline, today) && isBefore(deadline, next7Days))) {
          return false;
        }
      } else if (filterDeadline === 'past' && app.deadlineDate) {
        const deadline = new Date(app.deadlineDate);
        const today = new Date();
        
        if (!isBefore(deadline, today)) {
          return false;
        }
      } else if (filterDeadline === 'none' && app.deadlineDate) {
        return false;
      }
    }
    
    return true;
  });

  // Sort applications
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortField) {
      case 'company':
        aValue = a.company.toLowerCase();
        bValue = b.company.toLowerCase();
        break;
      case 'jobTitle':
        aValue = a.jobTitle.toLowerCase();
        bValue = b.jobTitle.toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'priority':
        aValue = a.priority || 'low';
        bValue = b.priority || 'low';
        break;
      case 'deadlineDate':
        aValue = a.deadlineDate ? new Date(a.deadlineDate).getTime() : Infinity;
        bValue = b.deadlineDate ? new Date(b.deadlineDate).getTime() : Infinity;
        break;
      case 'appliedAt':
      default:
        aValue = new Date(a.appliedAt).getTime();
        bValue = new Date(b.appliedAt).getTime();
        break;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Add additional state for subscription plan information display
  const [showingPlanDetails, setShowingPlanDetails] = useState(false);

  // Add function to display upgrade subscription message
  const displayUpgradeMessage = () => {
    setShowingPlanDetails(true);
    toast({
      title: "Want to track more job applications?",
      description: "Upgrade your subscription plan for higher job application limits.",
      duration: 5000,
      action: (
        <ToastAction 
          altText="Upgrade" 
          onClick={() => {
            window.location.href = '/user/subscription';
          }}
        >
          View Plans
        </ToastAction>
      ),
    });
  };

  // Check if user is approaching their limit and display a helpful message 
  useEffect(() => {
    // Only show message if we have more than 70% of limit
    if (jobApplications.length > 0) {
      const fetchFeatureUsage = async () => {
        try {
          const response = await apiRequest("GET", "/api/user/token-usage");
          const data = await response.json();
          
          if (data && data.features && data.features.length > 0) {
            const jobAppFeature = data.features.find((f: any) => f.featureCode === 'job_application');
            if (jobAppFeature) {
              const { usageCount, tokenLimit } = jobAppFeature;
              const usagePercent = (usageCount / tokenLimit) * 100;
              
              if (usagePercent >= 70 && !showingPlanDetails) {
                displayUpgradeMessage();
              }
            }
          }
        } catch (error) {
          console.error("Error fetching usage data:", error);
        }
      };
      
      fetchFeatureUsage();
    }
  }, [jobApplications.length, user, showingPlanDetails]);

  return (
    <DefaultLayout pageTitle="Job Applications" pageDescription="Track and manage your job applications and interviews">
      <div className="w-full max-w-[100%] px-2">
        <div className="flex mb-6 items-center justify-between">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Job Application
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Job Application</DialogTitle>
                <DialogDescription>
                  Track a new job application. Add all the relevant details to help you monitor your progress.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="description">Job Details</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="contact">Contact Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic">
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            name="company"
                            placeholder="e.g. TechCorp"
                            value={formData.company}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="jobTitle">Job Title</Label>
                          <Input
                            id="jobTitle"
                            name="jobTitle"
                            placeholder="e.g. Frontend Developer"
                            value={formData.jobTitle}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            name="location"
                            placeholder="e.g. New York, NY"
                            value={formData.location}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="workType">Work Type</Label>
                          <Select
                            value={formData.workType}
                            onValueChange={(value) => handleSelectChange("workType", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select work type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="onsite">On-site</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                              <SelectItem value="remote">Remote</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="jobUrl">Job Posting URL</Label>
                          <Input
                            id="jobUrl"
                            name="jobUrl"
                            placeholder="e.g. https://example.com/jobs/123"
                            value={formData.jobUrl}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="salary">Salary Range</Label>
                          <Input
                            id="salary"
                            name="salary"
                            placeholder="e.g. $80,000 - $100,000"
                            value={formData.salary}
                            onChange={(e) => {
                              // Allow empty input, numbers, commas, dollar signs, and dashes
                              const value = e.target.value;
                              if (value === '' || /^[\d,.$\s\-]+$/.test(value)) {
                                handleChange(e);
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Format: $min - $max (e.g. $80,000 - $100,000)</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="description">
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="jobDescription">Job Description</Label>
                        <Textarea
                          id="jobDescription"
                          name="jobDescription"
                          placeholder="Copy and paste the job description here"
                          value={formData.jobDescription}
                          onChange={handleChange}
                          rows={10}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={formData.priority}
                            onValueChange={(value) => handleSelectChange("priority", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="deadlineDate">Application Deadline</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {formData.deadlineDate ? (
                                  format(formData.deadlineDate, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={formData.deadlineDate instanceof Date ? formData.deadlineDate : formData.deadlineDate ? new Date(formData.deadlineDate) : undefined}
                                onSelect={(date) => setFormData({
                                  ...formData,
                                  deadlineDate: date
                                })}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="documents">
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="status">Application Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => handleSelectChange("status", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="screening">Screening</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="assessment">Assessment</SelectItem>
                              <SelectItem value="offer">Offer</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.status === "interview" && (
                          <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="interviewDate">Interview Date</Label>
                                <Input
                                  id="interviewDate"
                                  name="interviewDate"
                                  type="datetime-local"
                                  value={typeof formData.interviewDate === 'string' ? formData.interviewDate : formData.interviewDate instanceof Date ? formatDateForInput(formData.interviewDate) : ""}
                                  onChange={(e) => {
                                    const value = e.target.value ? e.target.value : null;
                                    setFormData({ ...formData, interviewDate: value });
                                  }}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="interviewType">Interview Type</Label>
                                <Select
                                  value={formData.interviewType}
                                  onValueChange={(value) => handleSelectChange("interviewType", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select interview type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="onsite">On-site</SelectItem>
                                    <SelectItem value="technical">Technical</SelectItem>
                                    <SelectItem value="behavioral">Behavioral</SelectItem>
                                    <SelectItem value="final">Final</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="interviewNotes">Interview Notes</Label>
                              <Textarea
                                id="interviewNotes"
                                name="interviewNotes"
                                placeholder="Add any notes about the interview"
                                value={formData.interviewNotes}
                                onChange={handleChange}
                                rows={3}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="statusNotes">Status Notes</Label>
                          <Input
                            id="statusNotes"
                            name="statusNotes"
                            placeholder="e.g. Applied via company website"
                            value={formData.statusNotes}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4 mt-2">
                        <h3 className="font-medium mb-3">Linked Documents</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="resumeId">Resume</Label>
                            <Select
                              value={formData.resumeId || "none"}
                              onValueChange={(value) => handleSelectChange("resumeId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a resume" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {resumes.map((resume: any) => (
                                  <SelectItem key={resume.id} value={resume.id.toString()}>
                                    {resume.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="coverLetterId">Cover Letter</Label>
                            <Select
                              value={formData.coverLetterId || "none"}
                              onValueChange={(value) => handleSelectChange("coverLetterId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a cover letter" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {coverLetters.map((letter: any) => (
                                  <SelectItem key={letter.id} value={letter.id.toString()}>
                                    {letter.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="contact">
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="contactName">Contact Person</Label>
                          <Input
                            id="contactName"
                            name="contactName"
                            placeholder="e.g. Jane Smith"
                            value={formData.contactName}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contactEmail">Contact Email</Label>
                          <Input
                            id="contactEmail"
                            name="contactEmail"
                            type="email"
                            placeholder="e.g. jane.smith@example.com"
                            value={formData.contactEmail}
                            onChange={handleChange}
                          />
                          <p className="text-xs text-muted-foreground">Format: name@domain.com</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="contactPhone">Contact Phone</Label>
                          <Input
                            id="contactPhone"
                            name="contactPhone"
                            placeholder="e.g. (555) 123-4567"
                            value={formData.contactPhone}
                            onChange={handleChange}
                          />
                          <p className="text-xs text-muted-foreground">Format: (XXX) XXX-XXXX</p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="notes">Additional Notes</Label>
                          <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Any other notes about this application"
                            value={formData.notes}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <DialogFooter className="mt-6">
                  <Button
                    type="submit"
                    disabled={createJobApplicationMutation.isPending}
                  >
                    {createJobApplicationMutation.isPending ? "Adding..." : "Add Application"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6 space-y-4">
          {/* Search and filter controls */}
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search" 
                  placeholder="Search applications..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={toggleViewMode}>
                {viewMode === 'table' && (
                  <>
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Card View
                  </>
                )}
                {viewMode === 'cards' && (
                  <>
                    <KanbanSquare className="h-4 w-4 mr-2" />
                    Kanban View
                  </>
                )}
                {viewMode === 'kanban' && (
                  <>
                    <TableProperties className="h-4 w-4 mr-2" />
                    Table View
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Filter by Status</h4>
                      <Select 
                        value={filterStatus || 'all'} 
                        onValueChange={(val) => setFilterStatus(val === 'all' ? null : val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="assessment">Assessment</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Filter by Priority</h4>
                      <Select 
                        value={filterPriority || 'all'} 
                        onValueChange={(val) => setFilterPriority(val === 'all' ? null : val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Priorities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Filter by Work Type</h4>
                      <Select 
                        value={filterWorkType || 'all'} 
                        onValueChange={(val) => setFilterWorkType(val === 'all' ? null : val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Work Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Work Types</SelectItem>
                          <SelectItem value="onsite">On-site</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Filter by Deadline</h4>
                      <Select 
                        value={filterDeadline || 'all'} 
                        onValueChange={(val) => setFilterDeadline(val === 'all' ? null : val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Deadlines" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Deadlines</SelectItem>
                          <SelectItem value="upcoming">Next 7 Days</SelectItem>
                          <SelectItem value="past">Past Deadlines</SelectItem>
                          <SelectItem value="none">No Deadline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Applied filters display */}
          {(filterStatus || filterPriority || filterWorkType || filterDeadline) && (
            <div className="flex flex-wrap gap-2">
              {filterStatus && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Status: {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => setFilterStatus(null)}
                  >
                    <Cross2 className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filterPriority && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Priority: {filterPriority.charAt(0).toUpperCase() + filterPriority.slice(1)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => setFilterPriority(null)}
                  >
                    <Cross2 className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filterWorkType && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Work Type: {filterWorkType.charAt(0).toUpperCase() + filterWorkType.slice(1)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => setFilterWorkType(null)}
                  >
                    <Cross2 className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filterDeadline && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Deadline: {filterDeadline === 'upcoming' ? 'Next 7 Days' : filterDeadline === 'past' ? 'Past Deadlines' : 'No Deadline'}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => setFilterDeadline(null)}
                  >
                    <Cross2 className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setFilterStatus(null);
                  setFilterPriority(null);
                  setFilterWorkType(null);
                  setFilterDeadline(null);
                }}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="mb-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-full mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-3/4" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : sortedApplications.length === 0 ? (
          <Card className="w-full h-60 flex flex-col items-center justify-center text-center p-6">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-primary-50 p-4 dark:bg-primary-900">
                  <Plus className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                </div>
                <h3 className="text-lg font-medium">No Job Applications Found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery || filterStatus || filterPriority || filterWorkType || filterDeadline 
                    ? "Try adjusting your filters to see more results." 
                    : "Start tracking your job applications to monitor your progress."}
                </p>
                <Button onClick={() => setOpen(true)}>Add Job Application</Button>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'kanban' ? (
          <KanbanView 
            applications={sortedApplications} 
            onStatusUpdate={async (applicationId, newStatus) => {
              // First update the status
              await updateStatusMutation.mutateAsync({
                id: applicationId,
                status: newStatus,
                notes: `Moved to ${newStatus} status`
              });
            }}
            onViewDetails={viewApplicationDetails}
            onEditApplication={startEditingApplication}
          />
        ) : viewMode === 'table' ? (
          <div className="rounded-md border w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort('company')}>
                    <div className="flex items-center space-x-1">
                      <span>Company</span>
                      {sortField === 'company' && (
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('jobTitle')}>
                    <div className="flex items-center space-x-1">
                      <span>Job Title</span>
                      {sortField === 'jobTitle' && (
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => handleSort('status')}>
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortField === 'status' && (
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hidden lg:table-cell" onClick={() => handleSort('appliedAt')}>
                    <div className="flex items-center space-x-1">
                      <span>Applied On</span>
                      {sortField === 'appliedAt' && (
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hidden xl:table-cell" onClick={() => handleSort('deadlineDate')}>
                    <div className="flex items-center space-x-1">
                      <span>Deadline</span>
                      {sortField === 'deadlineDate' && (
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hidden lg:table-cell" onClick={() => handleSort('priority')}>
                    <div className="flex items-center space-x-1">
                      <span>Priority</span>
                      {sortField === 'priority' && (
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedApplications.map((application) => (
                  <TableRow key={application.id} className="cursor-pointer hover:bg-muted/30" onClick={() => viewApplicationDetails(application)}>
                    <TableCell className="font-medium">{application.company}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{application.jobTitle}</span>
                        {application.location && (
                          <span className="text-xs text-muted-foreground hidden md:inline-block">• {application.location}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={getStatusBadgeColor(application.status)}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(application.appliedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {application.deadlineDate 
                        ? format(new Date(application.deadlineDate), "MMM d, yyyy") 
                        : "No deadline"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {application.priority && (
                        <Badge variant="outline" className={`bg-${getPriorityBadgeColor(application.priority)}-50 text-${getPriorityBadgeColor(application.priority)}-700 dark:bg-${getPriorityBadgeColor(application.priority)}-900 dark:text-${getPriorityBadgeColor(application.priority)}-300 w-fit`}>
                          {application.priority.charAt(0).toUpperCase() + application.priority.slice(1)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            viewApplicationDetails(application);
                          }}>
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            startEditingApplication(application);
                          }}>
                            Edit application
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            openStatusUpdate(application);
                          }}>
                            Update status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedApplications.map((application: JobApplication) => (
              <Card key={application.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{application.jobTitle}</CardTitle>
                      <CardDescription className="flex items-center">
                        <span className="font-medium">{application.company}</span>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusBadgeColor(application.status)}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-col space-y-2 text-sm">
                    {application.location && (
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{application.location}</span>
                      </div>
                    )}
                    {application.workType && (
                      <div className="flex items-center text-muted-foreground">
                        {workTypeIcons[application.workType as keyof typeof workTypeIcons]}
                        <span>{application.workType.charAt(0).toUpperCase() + application.workType.slice(1)}</span>
                      </div>
                    )}
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Applied on {format(new Date(application.appliedAt), "MMM d, yyyy")}</span>
                    </div>
                    {application.priority && (
                      <div className="flex items-center">
                        <Badge variant="outline" className={`border-${getPriorityBadgeColor(application.priority)}-500 text-${getPriorityBadgeColor(application.priority)}-700`}>
                          {application.priority === 'high' ? <Star className="h-3 w-3 mr-1" /> : <StarOff className="h-3 w-3 mr-1" />}
                          {application.priority.charAt(0).toUpperCase() + application.priority.slice(1)} Priority
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-4">
                  <Button size="sm" variant="outline" onClick={() => viewApplicationDetails(application)}>
                    View Details
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openStatusUpdate(application)}>
                    Update Status
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Application Details Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedApplication && !editMode && (
              <>
                <DialogHeader>
                  <div className="flex justify-between items-center">
                    <DialogTitle className="text-xl">{selectedApplication.jobTitle}</DialogTitle>
                    <Badge className={getStatusBadgeColor(selectedApplication.status)}>
                      {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                    </Badge>
                  </div>
                  <DialogDescription>
                    <span className="font-medium">{selectedApplication.company}</span>
                    {selectedApplication.location && (
                      <span className="ml-2">• {selectedApplication.location}</span>
                    )}
                    {selectedApplication.workType && (
                      <span className="ml-2">• {selectedApplication.workType.charAt(0).toUpperCase() + selectedApplication.workType.slice(1)}</span>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Application Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Applied on {format(new Date(selectedApplication.appliedAt), "MMMM d, yyyy")}</span>
                      </div>
                      
                      {selectedApplication.priority && (
                        <div className="flex items-center">
                          {selectedApplication.priority === 'high' ? 
                            <Star className="h-4 w-4 mr-2 text-muted-foreground" /> : 
                            <StarOff className="h-4 w-4 mr-2 text-muted-foreground" />}
                          <span>{selectedApplication.priority.charAt(0).toUpperCase() + selectedApplication.priority.slice(1)} Priority</span>
                        </div>
                      )}
                      
                      {selectedApplication.deadlineDate && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Deadline: {format(new Date(selectedApplication.deadlineDate), "MMM d, yyyy")}</span>
                        </div>
                      )}
                      
                      {selectedApplication.jobUrl && (
                        <div className="flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a 
                            href={selectedApplication.jobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Job Posting
                          </a>
                        </div>
                      )}
                      
                      {selectedApplication.salary && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Salary:</span>
                          <span>{selectedApplication.salary}</span>
                        </div>
                      )}
                    </div>

                    {(selectedApplication.contactName || selectedApplication.contactEmail || selectedApplication.contactPhone) && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3">Contact Information</h3>
                        <div className="space-y-3">
                          {selectedApplication.contactName && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{selectedApplication.contactName}</span>
                            </div>
                          )}
                          
                          {selectedApplication.contactEmail && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                              <a 
                                href={`mailto:${selectedApplication.contactEmail}`}
                                className="text-primary hover:underline"
                              >
                                {selectedApplication.contactEmail}
                              </a>
                            </div>
                          )}
                          
                          {selectedApplication.contactPhone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              <a 
                                href={`tel:${selectedApplication.contactPhone}`}
                                className="text-primary hover:underline"
                              >
                                {selectedApplication.contactPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(selectedApplication.resumeId || selectedApplication.coverLetterId) && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3">Documents</h3>
                        <div className="space-y-3">
                          {selectedApplication.resumeId && (
                            <div className="flex items-center">
                              <File className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>Resume: </span>
                              <Button 
                                variant="link" 
                                className="p-0 h-auto text-primary hover:underline"
                                onClick={() => {
                                  // Close the details dialog and navigate to the resume builder page with ID
                                  setDetailOpen(false);
                                  window.location.href = `/resume-builder?id=${selectedApplication.resumeId}`;
                                }}
                              >
                                {resumes.find((r: any) => r.id === selectedApplication.resumeId)?.title || "Unknown"}
                              </Button>
                            </div>
                          )}
                          
                          {selectedApplication.coverLetterId && (
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>Cover Letter: </span>
                              <Button 
                                variant="link" 
                                className="p-0 h-auto text-primary hover:underline"
                                onClick={() => {
                                  // Close the details dialog and navigate to the cover letter builder page with ID
                                  setDetailOpen(false);
                                  window.location.href = `/cover-letter-builder?id=${selectedApplication.coverLetterId}`;
                                }}
                              >
                                {coverLetters.find((c: any) => c.id === selectedApplication.coverLetterId)?.title || "Unknown"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedApplication.notes && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3">Notes</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedApplication.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium">Status History</h3>
                      <Button size="sm" variant="outline" onClick={() => openStatusUpdate(selectedApplication)}>
                        Update Status
                      </Button>
                    </div>
                    
                    {selectedApplication.statusHistory && selectedApplication.statusHistory.length > 0 ? (
                      <div className="space-y-3 border rounded-md p-4">
                        {[...selectedApplication.statusHistory]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((entry, index, sortedEntries) => (
                          <div key={entry.id} className="relative pl-6 pb-3">
                            {index < sortedEntries.length - 1 && (
                              <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                            )}
                            <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-primary" />
                            <div className="mb-1 flex items-center">
                              <Badge className={getStatusBadgeColor(entry.status)}>
                                {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(entry.date), "MMM d, yyyy")}
                              </span>
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground">{entry.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-6 border rounded-md">
                        <p className="text-muted-foreground">No status history available</p>
                      </div>
                    )}
                    
                    {/* Interviews Section */}
                    {selectedApplication.status === 'interview' && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Interview Details</h3>
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label>Interview Date</Label>
                              <Input
                                type="datetime-local"
                                value={selectedApplication.interviewDate || ''}
                                disabled
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Interview Type</Label>
                              <Input
                                value={selectedApplication.interviewType || ''}
                                disabled
                              />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label>Interview Notes</Label>
                            <Textarea
                              value={selectedApplication.interviewNotes || ''}
                              disabled
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedApplication.jobDescription && (
                      <div className="mt-6">
                        <Accordion type="single" collapsible>
                          <AccordionItem value="description">
                            <AccordionTrigger>Job Description</AccordionTrigger>
                            <AccordionContent>
                              <div className="max-h-80 overflow-y-auto p-2">
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                  {selectedApplication.jobDescription}
                                </p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter className="mt-6 flex justify-between">
                  <div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Cross2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this job application. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              if (selectedApplication) {
                                deleteJobApplicationMutation.mutate(selectedApplication.id);
                              }
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => startEditingApplication(selectedApplication)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" onClick={() => setDetailOpen(false)}>
                      Close
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )}

            {selectedApplication && editMode && (
              <>
                <DialogHeader>
                  <DialogTitle>Edit Job Application</DialogTitle>
                  <DialogDescription>
                    Update the details of your job application
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleEditSubmit}>
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="description">Job Details</TabsTrigger>
                      <TabsTrigger value="documents">Documents</TabsTrigger>
                      <TabsTrigger value="contact">Contact Details</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic">
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                              id="company"
                              name="company"
                              placeholder="e.g. TechCorp"
                              value={formData.company}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="jobTitle">Job Title</Label>
                            <Input
                              id="jobTitle"
                              name="jobTitle"
                              placeholder="e.g. Frontend Developer"
                              value={formData.jobTitle}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              name="location"
                              placeholder="e.g. New York, NY"
                              value={formData.location}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="workType">Work Type</Label>
                            <Select
                              value={formData.workType}
                              onValueChange={(value) => handleSelectChange("workType", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select work type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="onsite">On-site</SelectItem>
                                <SelectItem value="hybrid">Hybrid</SelectItem>
                                <SelectItem value="remote">Remote</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="jobUrl">Job Posting URL</Label>
                            <Input
                              id="jobUrl"
                              name="jobUrl"
                              placeholder="e.g. https://example.com/jobs/123"
                              value={formData.jobUrl}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="salary">Salary Range</Label>
                            <Input
                              id="salary"
                              name="salary"
                              placeholder="e.g. $80,000 - $100,000"
                              value={formData.salary}
                              onChange={(e) => {
                                // Allow empty input, numbers, commas, dollar signs, and dashes
                                const value = e.target.value;
                                if (value === '' || /^[\d,.$\s\-]+$/.test(value)) {
                                  handleChange(e);
                                }
                              }}
                            />
                            <p className="text-xs text-muted-foreground">Format: $min - $max (e.g. $80,000 - $100,000)</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="description">
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="jobDescription">Job Description</Label>
                          <Textarea
                            id="jobDescription"
                            name="jobDescription"
                            placeholder="Copy and paste the job description here"
                            value={formData.jobDescription}
                            onChange={handleChange}
                            rows={10}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                              value={formData.priority}
                              onValueChange={(value) => handleSelectChange("priority", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="deadlineDate">Application Deadline</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {formData.deadlineDate ? (
                                    format(formData.deadlineDate, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                  mode="single"
                                  selected={formData.deadlineDate instanceof Date ? formData.deadlineDate : formData.deadlineDate ? new Date(formData.deadlineDate) : undefined}
                                  onSelect={(date) => setFormData({
                                    ...formData,
                                    deadlineDate: date
                                  })}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="documents">
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="status">Application Status</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value) => handleSelectChange("status", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="applied">Applied</SelectItem>
                                <SelectItem value="screening">Screening</SelectItem>
                                <SelectItem value="interview">Interview</SelectItem>
                                <SelectItem value="assessment">Assessment</SelectItem>
                                <SelectItem value="offer">Offer</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {formData.status === "interview" && (
                            <div className="grid gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="interviewDate">Interview Date</Label>
                                  <Input
                                    id="interviewDate"
                                    name="interviewDate"
                                    type="datetime-local"
                                    value={typeof formData.interviewDate === 'string' ? formData.interviewDate : formData.interviewDate instanceof Date ? formatDateForInput(formData.interviewDate) : ""}
                                    onChange={(e) => {
                                      const value = e.target.value ? e.target.value : null;
                                      setFormData({ ...formData, interviewDate: value });
                                    }}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="interviewType">Interview Type</Label>
                                  <Select
                                    value={formData.interviewType}
                                    onValueChange={(value) => handleSelectChange("interviewType", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select interview type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="phone">Phone</SelectItem>
                                      <SelectItem value="video">Video</SelectItem>
                                      <SelectItem value="onsite">On-site</SelectItem>
                                      <SelectItem value="technical">Technical</SelectItem>
                                      <SelectItem value="behavioral">Behavioral</SelectItem>
                                      <SelectItem value="final">Final</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="interviewNotes">Interview Notes</Label>
                                <Textarea
                                  id="interviewNotes"
                                  name="interviewNotes"
                                  placeholder="Add any notes about the interview"
                                  value={formData.interviewNotes}
                                  onChange={handleChange}
                                  rows={3}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="statusNotes">Status Notes</Label>
                            <Input
                              id="statusNotes"
                              name="statusNotes"
                              placeholder="e.g. Applied via company website"
                              value={formData.statusNotes}
                              onChange={handleChange}
                            />
                          </div>
                        </div>

                        <div className="border-t pt-4 mt-2">
                          <h3 className="font-medium mb-3">Linked Documents</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="resumeId">Resume</Label>
                              <Select
                                value={formData.resumeId || "none"}
                                onValueChange={(value) => handleSelectChange("resumeId", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a resume" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {resumes.map((resume: any) => (
                                    <SelectItem key={resume.id} value={resume.id.toString()}>
                                      {resume.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="coverLetterId">Cover Letter</Label>
                              <Select
                                value={formData.coverLetterId || "none"}
                                onValueChange={(value) => handleSelectChange("coverLetterId", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a cover letter" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {coverLetters.map((letter: any) => (
                                    <SelectItem key={letter.id} value={letter.id.toString()}>
                                      {letter.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="contact">
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="contactName">Contact Person</Label>
                            <Input
                              id="contactName"
                              name="contactName"
                              placeholder="e.g. Jane Smith"
                              value={formData.contactName}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="contactEmail">Contact Email</Label>
                            <Input
                              id="contactEmail"
                              name="contactEmail"
                              type="email"
                              placeholder="e.g. jane.smith@example.com"
                              value={formData.contactEmail}
                              onChange={handleChange}
                            />
                            <p className="text-xs text-muted-foreground">Format: name@domain.com</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="contactPhone">Contact Phone</Label>
                            <Input
                              id="contactPhone"
                              name="contactPhone"
                              placeholder="e.g. (555) 123-4567"
                              value={formData.contactPhone}
                              onChange={handleChange}
                            />
                            <p className="text-xs text-muted-foreground">Format: (XXX) XXX-XXXX</p>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="notes">Additional Notes</Label>
                            <Textarea
                              id="notes"
                              name="notes"
                              placeholder="Any other notes about this application"
                              value={formData.notes}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <DialogFooter className="mt-6">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => {
                        setEditMode(false);
                        setFormData(initialFormData);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateJobApplicationMutation.isPending}
                    >
                      {updateJobApplicationMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Application Status</DialogTitle>
              <DialogDescription>
                Update the status of your application to track your progress.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleStatusUpdateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="newStatus">Status</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(value) => setNewStatus(value as JobApplicationStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={JobApplicationStatus.Applied}>Applied</SelectItem>
                      <SelectItem value={JobApplicationStatus.Screening}>Screening</SelectItem>
                      <SelectItem value={JobApplicationStatus.Interview}>Interview</SelectItem>
                      <SelectItem value={JobApplicationStatus.Assessment}>Assessment</SelectItem>
                      <SelectItem value={JobApplicationStatus.Offer}>Offer</SelectItem>
                      <SelectItem value={JobApplicationStatus.Rejected}>Rejected</SelectItem>
                      <SelectItem value={JobApplicationStatus.Accepted}>Accepted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="statusNotes">Notes (optional)</Label>
                  <Textarea
                    id="statusNotes"
                    placeholder="Any details about this status change"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DefaultLayout>
  );
}