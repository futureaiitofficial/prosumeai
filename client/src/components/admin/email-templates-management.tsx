import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pencil,
  Trash2,
  Plus,
  Mail,
  Check,
  AlertTriangle,
  Copy,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CodeEditor from "@/components/ui/code-editor";

// Define the template types
const TEMPLATE_TYPES = [
  { value: "welcome", label: "Welcome Email" },
  { value: "email_verification", label: "Email Verification" },
  { value: "password_reset", label: "Password Reset" },
  { value: "password_changed", label: "Password Changed" },
  { value: "login_alert", label: "Login Alert" },
];

// Interface for email template
interface EmailTemplate {
  id: number;
  templateType: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: Record<string, string>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for template form data
interface TemplateFormData {
  templateType: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: Record<string, string>;
  isDefault: boolean;
  isActive: boolean;
}

export default function EmailTemplatesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState("");
  
  // Form state for editing/creating template
  const [formData, setFormData] = useState<TemplateFormData>({
    templateType: "welcome",
    name: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    variables: {},
    isDefault: false,
    isActive: true,
  });

  // Create a new variable for the form
  const [variableKey, setVariableKey] = useState("");
  const [variableDesc, setVariableDesc] = useState("");

  // Fetch all templates
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: async () => {
      const { data } = await axios.get<EmailTemplate[]>("/api/admin/email-templates");
      return data;
    },
  });

  // Filter templates based on active tab
  const filteredTemplates = templates.filter((template) => {
    if (activeTab === "all") return true;
    return template.templateType === activeTab;
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (template: TemplateFormData) => {
      const { data } = await axios.post<EmailTemplate>("/api/admin/email-templates", template);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      setEditOpen(false);
      toast({
        title: "Template created",
        description: "The email template has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating template",
        description: error.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, template }: { id: number; template: TemplateFormData }) => {
      const { data } = await axios.put<EmailTemplate>(`/api/admin/email-templates/${id}`, template);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      setEditOpen(false);
      toast({
        title: "Template updated",
        description: "The email template has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating template",
        description: error.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/admin/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      setDeleteOpen(false);
      toast({
        title: "Template deleted",
        description: "The email template has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting template",
        description: error.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Test template mutation
  const testMutation = useMutation({
    mutationFn: async ({ id, email }: { id: number; email: string }) => {
      await axios.post(`/api/admin/email-templates/${id}/test`, { testEmail: email });
    },
    onSuccess: () => {
      setTestOpen(false);
      toast({
        title: "Test email sent",
        description: "A test email has been sent to the provided address.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending test email",
        description: error.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle creating or editing a template
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentTemplate) {
      updateMutation.mutate({ id: currentTemplate.id, template: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Open edit dialog for a template
  const handleEdit = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setFormData({
      templateType: template.templateType,
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      variables: template.variables,
      isDefault: template.isDefault,
      isActive: template.isActive,
    });
    setEditOpen(true);
  };

  // Open dialog for creating a new template
  const handleCreate = () => {
    setCurrentTemplate(null);
    setFormData({
      templateType: "welcome",
      name: "",
      subject: "",
      htmlContent: "",
      textContent: "",
      variables: {},
      isDefault: false,
      isActive: true,
    });
    setEditOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setDeleteOpen(true);
  };

  // Open test email dialog
  const handleTestClick = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setTestEmail("");
    setTestOpen(true);
  };

  // Add a variable to the template
  const handleAddVariable = () => {
    if (!variableKey || !variableDesc) return;
    
    setFormData({
      ...formData,
      variables: {
        ...formData.variables,
        [variableKey]: variableDesc,
      },
    });
    
    setVariableKey("");
    setVariableDesc("");
  };

  // Remove a variable from the template
  const handleRemoveVariable = (key: string) => {
    const newVariables = { ...formData.variables };
    delete newVariables[key];
    
    setFormData({
      ...formData,
      variables: newVariables,
    });
  };

  // Render template type label
  const getTemplateTypeLabel = (type: string) => {
    const template = TEMPLATE_TYPES.find((t) => t.value === type);
    return template ? template.label : type;
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load email templates. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
        <p className="text-muted-foreground">
          Manage email templates for various system notifications and communications.
        </p>
      </div>

      <div className="flex justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            {TEMPLATE_TYPES.map((type) => (
              <TabsTrigger key={type.value} value={type.value}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button onClick={handleCreate} className="ml-4">
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="py-10 text-center">Loading templates...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24">Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No templates found. Create your first template by clicking the "New Template" button.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTemplateTypeLabel(template.templateType)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {template.subject}
                      </TableCell>
                      <TableCell>
                        {template.isActive ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {template.isDefault && <Check className="h-5 w-5 text-green-500" />}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleTestClick(template)}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Test Template</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(template)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(template)}
                                  disabled={template.isDefault}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {template.isDefault
                                  ? "Default templates cannot be deleted"
                                  : "Delete"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit/Create Template Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentTemplate ? "Edit Email Template" : "Create Email Template"}
            </DialogTitle>
            <DialogDescription>
              {currentTemplate
                ? "Update the details of this email template."
                : "Configure a new email template for system communications."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateType">Template Type</Label>
                <Select
                  value={formData.templateType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, templateType: value })
                  }
                >
                  <SelectTrigger id="templateType">
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Welcome Email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="e.g., Welcome to {{appName}}!"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="htmlContent">HTML Content</Label>
              <div className="border rounded-md">
                <CodeEditor
                  value={formData.htmlContent}
                  language="html"
                  onChange={(value: string) =>
                    setFormData({ ...formData, htmlContent: value || "" })
                  }
                  height="300px"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textContent">Plain Text Content</Label>
              <Textarea
                id="textContent"
                value={formData.textContent}
                onChange={(e) =>
                  setFormData({ ...formData, textContent: e.target.value })
                }
                rows={6}
                placeholder="Plain text version of the email content..."
                required
              />
            </div>

            <div className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Template Variables</h3>
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Variables can be used in the template with double curly braces: {`{{variable}}`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-5">
                  <Input
                    value={variableKey}
                    onChange={(e) => setVariableKey(e.target.value)}
                    placeholder="Variable name"
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    value={variableDesc}
                    onChange={(e) => setVariableDesc(e.target.value)}
                    placeholder="Description"
                  />
                </div>
                <div className="col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleAddVariable}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {Object.entries(formData.variables).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variable</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(formData.variables).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell>
                            <code>{`{{${key}}}`}</code>
                          </TableCell>
                          <TableCell>{value}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveVariable(key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No variables defined for this template.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDefault: checked })
                  }
                />
                <Label htmlFor="isDefault">
                  Set as default template for this type
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {currentTemplate ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Email Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this email template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{currentTemplate?.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Type: {currentTemplate && getTemplateTypeLabel(currentTemplate.templateType)}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => currentTemplate && deleteMutation.mutate(currentTemplate.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email using this template to verify its appearance.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter recipient email address"
                required
              />
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Test Email Details</AlertTitle>
              <AlertDescription>
                Test emails will include sample data for template variables. You'll receive the email exactly as it would appear to users.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => currentTemplate && testMutation.mutate({ id: currentTemplate.id, email: testEmail })}
              disabled={!testEmail || testMutation.isPending}
            >
              {testMutation.isPending ? "Sending..." : "Send Test Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 