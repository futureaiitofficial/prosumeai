import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Wand2, FileText, Briefcase, Building } from "lucide-react";
import DefaultLayout from "@/components/layouts/default-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateCoverLetter } from "@/utils/ai-cover-letter-helpers";
import type { CoverLetter } from "@shared/schema";
import { coverLetterTemplateMetadata } from '@/templates/registerCoverLetterTemplates';

// Template image interface
interface TemplateImage {
  name: string;
  url: string;
  size: number;
}

export default function CoverLetters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    template: 'standard'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiForm, setAiForm] = useState({
    jobTitle: '',
    jobDescription: '',
    companyName: '',
    recipientName: '',
    letterStyle: 'professional',
    resumeId: null as number | null
  });

  // Fetch template images
  const { data: templateImages = { images: [] as TemplateImage[] } } = useQuery({
    queryKey: ["/api/templates/images"],
    queryFn: async () => {
      try {
        const res = await fetch('/api/templates/images');
        if (!res.ok) {
          throw new Error('Failed to fetch template images');
        }
        const data = await res.json();
        console.log("Cover letter template images loaded:", data.images?.length || 0);
        return data;
      } catch (error) {
        console.error('Error fetching template images:', error);
        return { images: [] };
      }
    }
  });

  // Finding a template image by ID
  const getTemplateImageUrl = (templateId: string) => {
    // Try to find a matching image by template ID in the filename
    const matchingImage = templateImages.images.find((img: TemplateImage) => 
      img.name.includes(templateId) || 
      img.name.includes(`template-${templateId}`)
    );
    
    if (matchingImage) {
      return matchingImage.url;
    }
    
    // Try to match a template-X pattern where X is a numeric index
    const templateIndex = Object.keys(coverLetterTemplateMetadata).indexOf(templateId) + 1;
    const indexMatchingImage = templateImages.images.find((img: TemplateImage) => 
      img.name.includes(`template-${templateIndex}`)
    );
    
    if (indexMatchingImage) {
      return indexMatchingImage.url;
    }
    
    // Default fallback
    return '/placeholder-image.png';
  };

  const { data: coverLetters = [], isLoading } = useQuery<CoverLetter[]>({
    queryKey: ["/api/cover-letters"],
    enabled: !!user,
  });

  const createCoverLetterMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest(
        "POST", 
        "/api/cover-letters", 
        { ...data, userId: user?.id }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] });
      toast({
        title: "Cover Letter Created",
        description: "Your cover letter has been created successfully.",
      });
      setOpen(false);
      setFormData({
        title: '',
        content: '',
        template: 'standard'
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create cover letter",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCoverLetterMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      template: value
    });
  };
  
  // Add mutation to fetch resumes
  const { data: resumes = [] } = useQuery<any[]>({
    queryKey: ["/api/resumes"],
    enabled: !!user,
  });
  
  // Function to handle AI-generated cover letter
  const handleGenerateCoverLetter = async () => {
    if (!aiForm.jobTitle || !aiForm.jobDescription || !aiForm.companyName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Call API to generate cover letter
      const content = await generateCoverLetter(
        aiForm.jobTitle,
        aiForm.jobDescription,
        aiForm.companyName,
        aiForm.resumeId,
        undefined, // resumeData not needed when using resumeId
        aiForm.recipientName || undefined,
        aiForm.letterStyle
      );
      
      // Update form data with generated content
      setFormData({
        ...formData,
        content: content
      });
      
      // If title is empty, generate a title
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: `${aiForm.jobTitle} - ${aiForm.companyName} Cover Letter`
        }));
      }
      
      toast({
        title: "Cover Letter Generated",
        description: "Your cover letter has been generated successfully. You can now edit it and save.",
      });
      
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast({
        title: "Failed to generate cover letter",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Render visual template selection instead of dropdown
  const renderTemplateSelection = () => (
    <div className="grid gap-2">
      <Label htmlFor="template">Template</Label>
      <div className="grid grid-cols-2 gap-3 mt-1">
        {Object.entries(coverLetterTemplateMetadata).map(([id, template]) => {
          const imageUrl = getTemplateImageUrl(id);
          return (
            <div 
              key={id}
              className={`border rounded-md p-3 cursor-pointer hover:border-primary transition-colors ${
                formData.template === id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleSelectChange(id)}
            >
              <div className="aspect-video rounded-md overflow-hidden mb-2">
                <img 
                  src={imageUrl} 
                  alt={template.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`Failed to load image: ${imageUrl}`);
                    e.currentTarget.src = '/placeholder-image.png';
                  }}
                />
              </div>
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <DefaultLayout pageTitle="Cover Letters" pageDescription="Create and customize cover letters for different job applications">
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Cover Letter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Cover Letter</DialogTitle>
              <DialogDescription>
                Add a new cover letter to your collection. You can customize it for specific job applications.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="manual" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Write Manually
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  AI Generated
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual">
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Cover Letter Title</Label>
                      <Input 
                        id="title" 
                        name="title" 
                        placeholder="e.g. Frontend Developer Cover Letter" 
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    {/* Replace dropdown with visual template selection */}
                    {renderTemplateSelection()}
                    
                    <div className="grid gap-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea 
                        id="content" 
                        name="content" 
                        placeholder="Enter your cover letter content" 
                        value={formData.content}
                        onChange={handleChange}
                        rows={10}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createCoverLetterMutation.isPending}
                    >
                      {createCoverLetterMutation.isPending ? "Creating..." : "Create Cover Letter"}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="ai">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ai-title">Cover Letter Title</Label>
                    <Input 
                      id="ai-title" 
                      placeholder="e.g. Frontend Developer Cover Letter"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ai-job-title">Job Title</Label>
                      <Input 
                        id="ai-job-title" 
                        placeholder="e.g. Senior Frontend Developer"
                        value={aiForm.jobTitle}
                        onChange={(e) => setAiForm({...aiForm, jobTitle: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="ai-company-name">Company Name</Label>
                      <Input 
                        id="ai-company-name" 
                        placeholder="e.g. Acme Inc."
                        value={aiForm.companyName}
                        onChange={(e) => setAiForm({...aiForm, companyName: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ai-recipient">Recipient Name (Optional)</Label>
                      <Input 
                        id="ai-recipient" 
                        placeholder="e.g. John Smith"
                        value={aiForm.recipientName}
                        onChange={(e) => setAiForm({...aiForm, recipientName: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="ai-style">Letter Style</Label>
                      <Select
                        value={aiForm.letterStyle}
                        onValueChange={(value) => setAiForm({...aiForm, letterStyle: value})}
                      >
                        <SelectTrigger id="ai-style">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                          <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="ai-job-description">Job Description</Label>
                    <Textarea 
                      id="ai-job-description" 
                      placeholder="Paste the full job description here..."
                      value={aiForm.jobDescription}
                      onChange={(e) => setAiForm({...aiForm, jobDescription: e.target.value})}
                      rows={6}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Resume (Optional)</Label>
                    <p className="text-sm text-muted-foreground">
                      Select a resume to help tailor your cover letter
                    </p>
                    <div className="grid gap-2 mt-2">
                      <Select
                        value={aiForm.resumeId?.toString() || "none"}
                        onValueChange={(value) => setAiForm({...aiForm, resumeId: value !== "none" ? parseInt(value) : null})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a resume (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {resumes.map(resume => (
                            <SelectItem key={resume.id} value={resume.id.toString()}>
                              {resume.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Replace dropdown with visual template selection */}
                  {renderTemplateSelection()}
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    disabled={isGenerating || !aiForm.jobTitle || !aiForm.jobDescription || !aiForm.companyName}
                    onClick={handleGenerateCoverLetter}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generate Cover Letter
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
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
              <div className="rounded-full bg-secondary-50 p-4 dark:bg-secondary-900">
                <Plus className="h-6 w-6 text-secondary-600 dark:text-secondary-300" />
              </div>
              <h3 className="text-lg font-medium">No Cover Letters Yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create your first cover letter to enhance your job applications.
              </p>
              <Button onClick={() => setOpen(true)}>Create Cover Letter</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coverLetters.map((coverLetter) => (
            <Card key={coverLetter.id}>
              <CardHeader>
                <CardTitle>{coverLetter.title}</CardTitle>
                <CardDescription>
                  {coverLetter.jobTitle ? `${coverLetter.jobTitle} at ${coverLetter.company || 'Company'}` : 'Cover Letter'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                  {coverLetter.content}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = `/cover-letter-builder?id=${coverLetter.id}&step=template`}
                >
                  Edit
                </Button>
                <Button 
                  size="sm"
                  onClick={() => window.open(`/api/cover-letters/${coverLetter.id}/pdf`, '_blank')}
                >
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DefaultLayout>
  );
}
