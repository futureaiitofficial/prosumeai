import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Copy,
  Download,
  Upload,
  Loader2,
  Images
} from "lucide-react";
import { TemplateFactory } from "@/templates/core/TemplateFactory";
import { templateRegistry } from "@/templates/base/TemplateRegistry";
import { registerTemplates } from "@/templates/registerTemplates";
import { coverLetterTemplateMetadata } from "@/templates/registerCoverLetterTemplates";

// Define resume template IDs from registerTemplates
const RESUME_TEMPLATE_IDS = [
  'professional',
  'elegant-divider',
  'minimalist-ats'
];

// Template type
interface Template {
  id?: number;
  name: string;
  category: "resume" | "cover-letter";
  type: string;
  thumbnail?: string;
  isPremium: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  downloadCount?: number;
  previewImageUrl?: string;
  templateId: string;
}

// Template image interface
interface TemplateImage {
  name: string;
  url: string;
  size: number;
}

export function TemplatesOverview() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("resume");
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateType, setTemplateType] = useState("latex");
  const [isPremium, setIsPremium] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [resumeTemplates, setResumeTemplates] = useState<Template[]>([]);
  const [coverLetterTemplates, setCoverLetterTemplates] = useState<Template[]>([]);
  
  // Fetch template images
  const { data: templateImages = { images: [] as TemplateImage[] }, refetch: refetchImages } = useQuery({
    queryKey: ["/api/templates/images"],
    queryFn: async () => {
      try {
        const res = await fetch('/api/templates/images?admin=true');
        if (!res.ok) {
          throw new Error('Failed to fetch template images');
        }
        const data = await res.json();
        console.log("Template images loaded:", data.images?.length || 0);
        return data;
      } catch (error) {
        console.error('Error fetching template images:', error);
        return { images: [] };
      }
    }
  });
  
  // Fetch all templates from the server
  const { data: serverTemplates, isLoading: isLoadingTemplates, refetch: refetchTemplates } = useQuery({
    queryKey: ["/api/admin/templates"],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/templates');
        if (!res.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await res.json();
        console.log("Templates loaded from server:", data.length);
        return data;
      } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
      }
    }
  });
  
  // When server templates are loaded, update the local state
  useEffect(() => {
    if (serverTemplates && serverTemplates.length > 0) {
      // Filter resume templates
      const resumeTemplatesFromServer = serverTemplates
        .filter((template: any) => template.type === "resume")
        .map((template: any) => ({
          ...template,
          category: "resume" as const,
          type: template.type || "react",
          templateId: template.name.toLowerCase().replace(/\s+/g, '-'),
        }));
      
      // Filter cover letter templates
      const coverLetterTemplatesFromServer = serverTemplates
        .filter((template: any) => template.type === "cover-letter")
        .map((template: any) => ({
          ...template,
          category: "cover-letter" as const,
          type: template.type || "react",
          templateId: template.name.toLowerCase().replace(/\s+/g, '-'),
        }));
      
      // Update local state
      setResumeTemplates(resumeTemplatesFromServer);
      setCoverLetterTemplates(coverLetterTemplatesFromServer);
      
      console.log("Updated local templates from server:", {
        resume: resumeTemplatesFromServer.length,
        coverLetter: coverLetterTemplatesFromServer.length
      });
    }
  }, [serverTemplates]);
  
  // After fetching images, update template thumbnails if matching images exist
  useEffect(() => {
    if (!templateImages.images?.length) return;
    
    // Update resume template thumbnails
    setResumeTemplates(prev => prev.map((template: Template) => {
      // Look for images with template ID in the name
      const matchingImage = templateImages.images.find((img: TemplateImage) => 
        img.name.includes(template.templateId) || 
        img.name.includes(`template-${template.id}`)
      );
      
      if (matchingImage) {
        console.log(`Found matching image for ${template.name}:`, matchingImage.url);
        return {...template, thumbnail: matchingImage.url};
      }
      return template;
    }));
    
    // Update cover letter template thumbnails
    setCoverLetterTemplates(prev => prev.map((template: Template) => {
      // Look for images with template ID in the name
      const matchingImage = templateImages.images.find((img: TemplateImage) => 
        img.name.includes(template.templateId) || 
        img.name.includes(`template-${template.id}`)
      );
      
      if (matchingImage) {
        console.log(`Found matching image for ${template.name}:`, matchingImage.url);
        return {...template, thumbnail: matchingImage.url};
      }
      return template;
    }));
  }, [templateImages.images]);
  
  // Get templates based on active tab
  const templates = activeTab === "resume" ? resumeTemplates : coverLetterTemplates;
  
  // Delete template mutation - replace with real API call in production
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({
        title: "Template Deleted",
        description: "The template has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Toggle template active status 
  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ templateId, isActive, category }: { templateId: number; isActive: boolean; category: "resume" | "cover-letter" }) => {
      // Call the real API endpoint
      const response = await fetch(`/api/admin/templates/${templateId}/toggle-visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isActive,
          type: category
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update template visibility');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate all template-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates/images"] });
      
      toast({
        title: "Template Updated",
        description: `Template has been ${data.isActive ? "activated" : "deactivated"} successfully.`,
      });
      
      // Also update local state for immediate UI refresh
      if (data.type === "resume") {
        setResumeTemplates(prev => 
          prev.map(t => t.id === data.id ? { ...t, isActive: data.isActive } : t)
        );
      } else {
        setCoverLetterTemplates(prev => 
          prev.map(t => t.id === data.id ? { ...t, isActive: data.isActive } : t)
        );
      }
      
      // Refetch templates after a short delay
      setTimeout(() => {
        if (refetchTemplates) refetchTemplates();
        if (refetchImages) refetchImages();
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Upload template image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ templateId, file }: { templateId: number; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      
      console.log(`Uploading image for template ID: ${templateId}`);
      
      // Check if the endpoint exists in our API
      const res = await fetch(`/api/admin/templates/${templateId}/image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error(`Failed to upload image: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("Image upload response:", data);
      
      return data;
    },
    onSuccess: (data) => {
      refetchImages();
      toast({
        title: "Image Uploaded",
        description: "Template preview image has been uploaded successfully."
      });
      
      // Update the selected template with the new image URL
      if (selectedTemplate) {
        console.log("Image upload response:", data);
        // Ensure we're using the full path for the image URL
        const imageUrl = data.imageUrl.startsWith('/') 
          ? data.imageUrl 
          : `/images/templates/${data.imageUrl}`;
          
        const updatedTemplate = { 
          ...selectedTemplate, 
          thumbnail: imageUrl
        };
        setSelectedTemplate(updatedTemplate);
        
        // Also update the template in the appropriate list and save to database
        if (selectedTemplate.category === "resume") {
          setResumeTemplates(prev => 
            prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t)
          );
          
          // Also update in database
          updateTemplateThumbnail(selectedTemplate.id!, imageUrl, "resume");
        } else {
          setCoverLetterTemplates(prev => 
            prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t)
          );
          
          // Also update in database
          updateTemplateThumbnail(selectedTemplate.id!, imageUrl, "cover-letter");
        }
      }
      
      console.log("Image upload successful:", data);
      setIsUploading(false);
      
      // Refresh all template-related data after a short delay to ensure database updates have propagated
      setTimeout(() => {
        console.log("Refreshing all template data...");
        queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
        queryClient.invalidateQueries({ queryKey: ["/api/templates/active"] });
        queryClient.invalidateQueries({ queryKey: ["/api/templates/images"] });
        refetchTemplates();
        refetchImages();
      }, 1000);
    },
    onError: (error: Error) => {
      console.error("Image upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  });
  
  // Helper function to update template thumbnail in database
  const updateTemplateThumbnail = async (templateId: number, thumbnailUrl: string, category: "resume" | "cover-letter") => {
    try {
      console.log(`Updating template ID ${templateId} with thumbnail: ${thumbnailUrl}`);
      
      // Ensure the thumbnail URL is properly formatted
      const formattedUrl = thumbnailUrl.startsWith('/') ? thumbnailUrl : `/images/templates/${thumbnailUrl}`;
      
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          thumbnail: formattedUrl,
          type: category
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update template thumbnail');
      }
      
      const data = await response.json();
      console.log("Template thumbnail updated in database:", data);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates/images"] });
      
      // Make sure the template is active
      if (!data.isActive) {
        console.log("Template is not active. Activating it now...");
        await toggleActiveStatusMutation.mutate({
          templateId: templateId,
          isActive: true,
          category: category
        });
      }
      
    } catch (error) {
      console.error("Error updating template thumbnail:", error);
      toast({
        title: "Error",
        description: "Failed to update template thumbnail in database",
        variant: "destructive"
      });
    }
  };
  
  // Delete template image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (filename: string) => {
      const res = await fetch(`/api/admin/templates/images/${filename}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete image');
      }
      
      return res.json();
    },
    onSuccess: () => {
      refetchImages();
      toast({
        title: "Image Deleted",
        description: "Template preview image has been deleted successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete image",
        variant: "destructive"
      });
    }
  });
  
  // Handle template deletion
  const handleDeleteTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteTemplate = () => {
    if (selectedTemplate && selectedTemplate.id !== undefined) {
      deleteTemplateMutation.mutate(selectedTemplate.id);
    } else {
      console.error("Cannot delete template - missing template ID");
    }
  };
  
  // Handle template active status toggle
  const handleToggleActiveStatus = (template: Template) => {
    if (template.id !== undefined) {
      console.log(`Toggling template visibility: ID=${template.id}, Name=${template.name}, Category=${template.category}, CurrentStatus=${template.isActive}`);
      
      toggleActiveStatusMutation.mutate({
        templateId: template.id,
        isActive: !template.isActive,
        category: template.category
      });
    } else {
      console.error("Cannot toggle template status - missing template ID");
      toast({
        title: "Error",
        description: "Cannot toggle template status - missing template ID",
        variant: "destructive",
      });
    }
  };
  
  // Handle template edit
  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setTemplateType(template.type);
    setIsPremium(template.isPremium);
    setIsAddTemplateOpen(true);
  };
  
  // Handle add template form submit
  const handleAddTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: selectedTemplate ? "Template Updated" : "Template Added",
      description: selectedTemplate 
        ? "The template has been updated successfully." 
        : "The new template has been added successfully.",
    });
    
    setIsAddTemplateOpen(false);
    setSelectedTemplate(null);
    setTemplateName("");
    setTemplateType("latex");
    setIsPremium(false);
  };
  
  // Check if the form is valid
  const isFormValid = templateName.trim() !== "";
  
  // Handle image upload for a template
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTemplate || selectedTemplate.id === undefined) {
      console.error("Cannot upload image - no template selected or missing template ID");
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    uploadImageMutation.mutate({ 
      templateId: selectedTemplate.id, 
      file 
    });
  };
  
  // Fix the issue with selectedTemplate.thumbnail possibly being undefined
  const handleDeleteTemplateImage = () => {
    if (!selectedTemplate || !selectedTemplate.thumbnail) {
      console.error("Cannot delete image - no template or thumbnail selected");
      return;
    }
    
    const filename = selectedTemplate.thumbnail.split('/').pop();
    if (filename) {
      deleteImageMutation.mutate(filename);
      setSelectedTemplate({
        ...selectedTemplate,
        thumbnail: ''
      });
    }
  };
  
  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  // Mutation to ensure templates exist in the database
  const ensureTemplatesMutation = useMutation({
    mutationFn: async () => {
      // Prepare default templates based on registry
      const defaultTemplates = [
        // Resume templates
        ...RESUME_TEMPLATE_IDS.map(templateId => {
          const template = templateRegistry.get(templateId);
          return {
            name: template?.name || templateId.charAt(0).toUpperCase() + templateId.slice(1).replace(/-/g, ' '),
            description: template?.description || "",
            category: "resume",
            content: ""
          };
        }),
        // Cover letter templates
        ...Object.keys(coverLetterTemplateMetadata).map(templateId => {
          const metadata = coverLetterTemplateMetadata[templateId as keyof typeof coverLetterTemplateMetadata];
          return {
            name: metadata?.name || templateId.charAt(0).toUpperCase() + templateId.slice(1).replace(/-/g, ' '),
            description: metadata?.description || "",
            category: "cover-letter",
            content: ""
          };
        })
      ];
      
      // Call the API to ensure these templates exist
      const response = await fetch('/api/admin/templates/ensure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          templates: defaultTemplates
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to ensure templates');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Templates ensured:", data);
      
      // Refresh the templates list
      refetchTemplates();
      
      toast({
        title: "Templates Initialized",
        description: `${data.results.length} templates have been initialized in the database.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to initialize templates: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // If no templates from server, ensure they exist
  useEffect(() => {
    if (!isLoadingTemplates && serverTemplates && serverTemplates.length === 0) {
      console.log("No templates found in the database. Ensuring defaults...");
      ensureTemplatesMutation.mutate();
    }
  }, [isLoadingTemplates, serverTemplates]);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="text-2xl">Template Management</CardTitle>
              <CardDescription>
                Manage resume and cover letter templates
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => {
                refetchTemplates();
                refetchImages();
                toast({
                  title: "Refreshed",
                  description: "Template data has been refreshed"
                });
              }}>
                Refresh Data
              </Button>
              <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{selectedTemplate ? "Edit Template" : "Add New Template"}</DialogTitle>
                    <DialogDescription>
                      {selectedTemplate ? "Update the template details below." : "Fill out the details for the new template."}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddTemplateSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Template Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g. Professional Resume"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="type">Template Type</Label>
                        <Select
                          value={templateType}
                          onValueChange={setTemplateType}
                        >
                          <SelectTrigger id="type">
                            <SelectValue placeholder="Select template type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Types</SelectLabel>
                              <SelectItem value="latex">LaTeX</SelectItem>
                              <SelectItem value="html">HTML</SelectItem>
                              <SelectItem value="markdown">Markdown</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="premium"
                          checked={isPremium}
                          onCheckedChange={(checked) => setIsPremium(checked as boolean)}
                        />
                        <Label htmlFor="premium">Premium Template</Label>
                      </div>
                      
                      {/* Add image upload section */}
                      <div className="grid gap-2">
                        <Label htmlFor="preview-image">Template Preview Image</Label>
                        <div className="flex flex-col gap-4">
                          {selectedTemplate?.thumbnail && (
                            <div className="relative overflow-hidden rounded-md border">
                              <img
                                src={selectedTemplate.thumbnail}
                                alt={`${selectedTemplate.name} preview`}
                                className="w-full h-auto object-contain"
                                onError={(e) => {
                                  console.error('Image failed to load:', selectedTemplate.thumbnail);
                                  // Set a fallback image
                                  e.currentTarget.src = '/placeholder-image.png';
                                  // Show the error in the UI
                                  toast({
                                    title: "Image Error",
                                    description: `Failed to load image: ${selectedTemplate.thumbnail}`,
                                    variant: "destructive"
                                  });
                                }}
                              />
                              <div className="text-xs p-1 bg-black/50 text-white absolute bottom-0 left-0 right-0">
                                {selectedTemplate.thumbnail}
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 h-8 w-8 p-0"
                                onClick={handleDeleteTemplateImage}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={triggerFileUpload}
                              disabled={isUploading}
                              className="flex-1"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  {selectedTemplate?.thumbnail ? "Change Image" : "Upload Image"}
                                </>
                              )}
                            </Button>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              id="preview-image"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                            
                            {/* Show available template images */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <Images className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Available Images</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {templateImages.images.length === 0 ? (
                                  <DropdownMenuItem disabled>No images available</DropdownMenuItem>
                                ) : (
                                  templateImages.images.map((image: TemplateImage) => (
                                    <DropdownMenuItem
                                      key={image.name}
                                      onClick={() => {
                                        if (selectedTemplate) {
                                          const updatedTemplate = {
                                            ...selectedTemplate,
                                            thumbnail: image.url
                                          };
                                          setSelectedTemplate(updatedTemplate);
                                          
                                          // Also update in the correct template list
                                          if (selectedTemplate.category === "resume") {
                                            setResumeTemplates(prev => 
                                              prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t)
                                            );
                                          } else {
                                            setCoverLetterTemplates(prev => 
                                              prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t)
                                            );
                                          }
                                          
                                          console.log(`Selected image ${image.name} for template ${selectedTemplate.name}`);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden">
                                          <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <span className="truncate">{image.name}</span>
                                      </div>
                                    </DropdownMenuItem>
                                  ))
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddTemplateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={!isFormValid}>
                        {selectedTemplate ? "Save Changes" : "Add Template"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Troubleshooting info */}
          <div className="bg-yellow-50 p-4 rounded-md mb-4 border border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Template Image Troubleshooting</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>• If images aren't showing, check that your templates are active.</p>
              <p>• Images need to be associated with active templates to be displayed.</p>
              <p>• Images loaded: {templateImages.images?.length || 0}</p>
              <p>• Templates from server: {serverTemplates?.length || 0}</p>
              <p>• Templates in state: Resume={resumeTemplates.length}, Cover Letter={coverLetterTemplates.length}</p>
              <div className="mt-2 flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    // Dump state to console for debugging
                    console.log("Template Images:", templateImages);
                    console.log("Server Templates:", serverTemplates);
                    console.log("Resume Templates:", resumeTemplates);
                    console.log("Cover Letter Templates:", coverLetterTemplates);
                    
                    toast({
                      title: "Debug Info",
                      description: "Check browser console for template debugging info"
                    });
                  }}
                >
                  Debug Info
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    // Force refresh all template-related data
                    toast({
                      title: "Refreshing Data",
                      description: "Refreshing all template images and templates"
                    });
                    
                    // Force refetch with invalidation
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/templates/active"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/templates/images"] });
                    
                    // Add a slight delay before refetching
                    setTimeout(() => {
                      refetchTemplates();
                      refetchImages();
                      
                      toast({
                        title: "Refresh Complete",
                        description: "All template data has been refreshed"
                      });
                    }, 500);
                  }}
                >
                  Refresh Images
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Attempt to fix template-image associations
                    resumeTemplates.forEach(template => {
                      if (template.id !== undefined) {
                        // Make sure template is active
                        if (!template.isActive) {
                          toggleActiveStatusMutation.mutate({
                            templateId: template.id,
                            isActive: true,
                            category: "resume"
                          });
                        }
                        
                        // Find matching image for this template
                        const matchingImage = templateImages.images.find((img: TemplateImage) => 
                          img.name.toLowerCase().includes(template.templateId.toLowerCase()) ||
                          img.name.toLowerCase().includes(template.name.toLowerCase().replace(/\s+/g, '-'))
                        );
                        
                        // If found, update thumbnail
                        if (matchingImage && (!template.thumbnail || template.thumbnail !== matchingImage.url)) {
                          updateTemplateThumbnail(template.id, matchingImage.url, "resume");
                          console.log(`Associating template ${template.name} with image ${matchingImage.url}`);
                        }
                      }
                    });
                    
                    // Same for cover letter templates
                    coverLetterTemplates.forEach(template => {
                      if (template.id !== undefined) {
                        // Make sure template is active
                        if (!template.isActive) {
                          toggleActiveStatusMutation.mutate({
                            templateId: template.id,
                            isActive: true,
                            category: "cover-letter"
                          });
                        }
                        
                        // Find matching image for this template
                        const matchingImage = templateImages.images.find((img: TemplateImage) => 
                          img.name.toLowerCase().includes(template.templateId.toLowerCase()) ||
                          img.name.toLowerCase().includes(template.name.toLowerCase().replace(/\s+/g, '-'))
                        );
                        
                        // If found, update thumbnail
                        if (matchingImage && (!template.thumbnail || template.thumbnail !== matchingImage.url)) {
                          updateTemplateThumbnail(template.id, matchingImage.url, "cover-letter");
                          console.log(`Associating template ${template.name} with image ${matchingImage.url}`);
                        }
                      }
                    });
                    
                    toast({
                      title: "Template Repair",
                      description: "Attempted to repair template-image associations"
                    });
                  }}
                >
                  Repair Associations
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100"
                  onClick={async () => {
                    try {
                      toast({
                        title: "Server Repair",
                        description: "Requesting server-side template image repair..."
                      });
                      
                      const response = await fetch('/api/debug/template-images');
                      if (!response.ok) {
                        throw new Error(`Server error: ${response.status}`);
                      }
                      
                      const data = await response.json();
                      console.log("Server repair response:", data);
                      
                      // Refresh data after repair
                      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/templates/active"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/templates/images"] });
                      
                      setTimeout(() => {
                        refetchTemplates();
                        refetchImages();
                      }, 500);
                      
                      toast({
                        title: "Repair Complete", 
                        description: `${data.updated?.length || 0} templates updated. Refresh the page to see changes.`
                      });
                    } catch (error) {
                      console.error("Server repair failed:", error);
                      toast({
                        title: "Repair Failed",
                        description: error instanceof Error ? error.message : "Unknown error",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  Server Repair
                </Button>
              </div>
            </div>
          </div>
        
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resume">Resume Templates</TabsTrigger>
              <TabsTrigger value="cover-letter">Cover Letter Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="resume" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumeTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <div>No templates found.</div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      resumeTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-12 w-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                                {template.thumbnail ? (
                                  <img
                                    src={template.thumbnail}
                                    alt={template.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <FileText className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {template.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="uppercase text-xs font-medium">
                              {template.type}
                            </div>
                          </TableCell>
                          <TableCell>
                            {template.isPremium ? (
                              <span className="text-amber-500 font-medium">Premium</span>
                            ) : (
                              <span className="text-green-600">Free</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              template.isActive 
                                ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400" 
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                            }`}>
                              {template.isActive ? "Active" : "Inactive"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{template.downloadCount}</div>
                          </TableCell>
                          <TableCell>{template.updatedAt}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>Preview</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActiveStatus(template)}>
                                  {template.isActive ? (
                                    <>
                                      <Trash2 className="mr-2 h-4 w-4 text-yellow-500" />
                                      <span className="text-yellow-500">Deactivate</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="mr-2 h-4 w-4 text-green-500" />
                                      <span className="text-green-500">Activate</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" />
                                  <span>Duplicate</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteTemplate(template)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="cover-letter" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coverLetterTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <div>No templates found.</div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      coverLetterTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-12 w-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                                {template.thumbnail ? (
                                  <img
                                    src={template.thumbnail}
                                    alt={template.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <FileText className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {template.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="uppercase text-xs font-medium">
                              {template.type}
                            </div>
                          </TableCell>
                          <TableCell>
                            {template.isPremium ? (
                              <span className="text-amber-500 font-medium">Premium</span>
                            ) : (
                              <span className="text-green-600">Free</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              template.isActive 
                                ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400" 
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                            }`}>
                              {template.isActive ? "Active" : "Inactive"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{template.downloadCount}</div>
                          </TableCell>
                          <TableCell>{template.updatedAt}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>Preview</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActiveStatus(template)}>
                                  {template.isActive ? (
                                    <>
                                      <Trash2 className="mr-2 h-4 w-4 text-yellow-500" />
                                      <span className="text-yellow-500">Deactivate</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="mr-2 h-4 w-4 text-green-500" />
                                      <span className="text-green-500">Activate</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" />
                                  <span>Duplicate</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteTemplate(template)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTemplate}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}