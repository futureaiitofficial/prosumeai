import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Plus, FileText, Book, AlertCircle, FileCode, Upload, X, Images, Trash } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Template types
type Template = {
  id: number;
  name: string;
  description: string;
  type: "resume" | "coverLetter";
  previewImageUrl?: string;
  content: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

// Template image interface
interface TemplateImage {
  name: string;
  url: string;
  size: number;
}

// Form schema
const templateSchema = z.object({
  name: z.string().min(3, "Template name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["resume", "coverLetter"]),
  content: z.string().min(10, "Template content must be at least 10 characters"),
  previewImageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

// Add a dedicated component for template image management
function TemplateImageManager() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch template images
  const { data: images = [], isLoading, refetch: refetchImages } = useQuery({
    queryKey: ["/api/admin/templates/images"],
    queryFn: async () => {
      const res = await fetch('/api/admin/templates/images');
      if (!res.ok) {
        throw new Error('Failed to fetch template images');
      }
      const data = await res.json();
      return data.images as TemplateImage[];
    }
  });
  
  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      // Using a placeholder template ID of 0 for global images
      const res = await fetch(`/api/admin/templates/0/image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Failed to upload image');
      }
      
      return res.json();
    },
    onSuccess: () => {
      refetchImages();
      toast({
        title: "Image Uploaded",
        description: "Template preview image uploaded successfully."
      });
      setIsUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  });
  
  // Delete image mutation
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
        description: "Template preview image deleted successfully."
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
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    uploadImageMutation.mutate(file);
  };
  
  // Trigger file input
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Template Preview Images</CardTitle>
            <CardDescription>
              Manage images used for template previews
            </CardDescription>
          </div>
          <Button 
            onClick={triggerFileUpload} 
            className="gap-2"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Image
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8">
            <Images className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Template Images</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload images to use as template previews.
            </p>
            <Button onClick={triggerFileUpload} className="mt-4 gap-2">
              <Upload className="h-4 w-4" />
              Upload First Image
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div 
                key={image.name} 
                className="relative group overflow-hidden rounded-md border aspect-square"
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => deleteImageMutation.mutate(image.name)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResumeTemplates() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"resume" | "coverLetter">("resume");
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Fetch templates
  const { data: templates = [], isLoading, error } = useQuery<Template[]>({
    queryKey: ["/api/admin/templates"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "resume",
      content: "",
      previewImageUrl: "",
      isActive: true,
      isFeatured: false,
    },
  });
  
  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof templateSchema>) => {
      return await apiRequest("POST", "/api/admin/templates", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({
        title: "Template Created",
        description: "The template has been created successfully.",
        variant: "default",
      });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });
  
  // Toggle template status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest("POST", `/api/admin/templates/${id}/toggle-visibility`, { 
        isActive,
        type: activeTab === "resume" ? "resume" : "cover-letter"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({
        title: "Template Updated",
        description: "Template status has been updated.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });
  
  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: number; isFeatured: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/templates/${id}`, { isFeatured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({
        title: "Template Updated",
        description: "Featured status has been updated.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });
  
  // Filter templates based on the active tab
  const filteredTemplates = (templates as unknown as Template[]).filter((template) => template.type === activeTab);
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof templateSchema>) => {
    createTemplateMutation.mutate(values);
  };
  
  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates Management</CardTitle>
          <CardDescription>
            Manage resume and cover letter templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load templates"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Templates Management</CardTitle>
              <CardDescription>
                Manage resume and cover letter templates
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "resume" | "coverLetter")} className="space-y-4">
            <TabsList>
              <TabsTrigger value="resume" className="flex gap-2">
                <FileText className="h-4 w-4" />
                Resume Templates
              </TabsTrigger>
              <TabsTrigger value="coverLetter" className="flex gap-2">
                <Book className="h-4 w-4" />
                Cover Letter Templates
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="resume">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Resume Templates</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add your first resume template to get started.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Add Resume Template
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template: Template) => (
                    <TemplateCard 
                      key={template.id} 
                      template={template} 
                      onToggleStatus={toggleStatusMutation.mutate}
                      onToggleFeatured={toggleFeaturedMutation.mutate}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="coverLetter">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <Book className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Cover Letter Templates</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add your first cover letter template to get started.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Add Cover Letter Template
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template: Template) => (
                    <TemplateCard 
                      key={template.id} 
                      template={template} 
                      onToggleStatus={toggleStatusMutation.mutate}
                      onToggleFeatured={toggleFeaturedMutation.mutate}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Add the template image manager */}
      <TemplateImageManager />
      
      {/* Template Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Template</DialogTitle>
            <DialogDescription>
              Create a new template for resumes or cover letters.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Professional Resume Template" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A professional template with modern styling..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="resume">Resume Template</SelectItem>
                        <SelectItem value="coverLetter">Cover Letter Template</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="HTML or LaTeX template content..." 
                        className="font-mono text-sm h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter HTML or LaTeX template content with placeholders for user data.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="previewImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preview Image URL</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="URL to preview image" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          // Open image selection dialog
                        }}
                      >
                        <Images className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription>
                      Enter a URL or choose from uploaded images
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Make this template available to users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Featured</FormLabel>
                        <FormDescription>
                          Show this template prominently
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="mt-6">
                <Button variant="outline" type="button" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="gap-2"
                  disabled={createTemplateMutation.isPending}
                >
                  {createTemplateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Template
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Template card component
function TemplateCard({ 
  template, 
  onToggleStatus, 
  onToggleFeatured 
}: { 
  template: Template, 
  onToggleStatus: (data: { id: number, isActive: boolean }) => void,
  onToggleFeatured: (data: { id: number, isFeatured: boolean }) => void 
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  return (
    <Card className="overflow-hidden border-2 transition-all hover:shadow-md flex flex-col h-full">
      <div className="relative h-40 bg-muted">
        {template.previewImageUrl ? (
          <img 
            src={template.previewImageUrl} 
            alt={template.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-accent/20">
            <FileCode className="h-16 w-16 text-muted-foreground opacity-50" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {template.isFeatured && (
            <Badge className="bg-amber-500 hover:bg-amber-600">Featured</Badge>
          )}
          {template.isActive ? (
            <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactive</Badge>
          )}
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="text-sm text-muted-foreground">
          <p>Type: {template.type === "resume" ? "Resume Template" : "Cover Letter Template"}</p>
          <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Active</p>
          <Switch 
            checked={template.isActive} 
            onCheckedChange={() => onToggleStatus({ 
              id: template.id, 
              isActive: !template.isActive 
            })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Featured</p>
          <Switch 
            checked={template.isFeatured} 
            onCheckedChange={() => onToggleFeatured({ 
              id: template.id, 
              isFeatured: !template.isFeatured 
            })}
          />
        </div>
      </CardFooter>
    </Card>
  );
}