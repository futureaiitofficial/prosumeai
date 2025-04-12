import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase, RefreshCw, Upload, Save, FilePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { JobDescription } from "@shared/schema";

interface JobDescriptionInputProps {
  data: any;
  updateData: (data: any) => void;
  jobDescriptions: JobDescription[];
}

export default function JobDescriptionInput({ data, updateData, jobDescriptions }: JobDescriptionInputProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateData({
      ...data,
      jobDescription: e.target.value
    });
  };
  
  const saveJobDescriptionMutation = useMutation({
    mutationFn: async (newJobDescription: { title: string; company: string; description: string }) => {
      const res = await apiRequest("POST", "/api/job-descriptions", newJobDescription);
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Job Description Saved",
        description: "Your job description has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-descriptions"] });
      setIsCreating(false);
      setTitle("");
      setCompany("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save job description: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleSaveJobDescription = () => {
    if (!title.trim() || !company.trim() || !data.jobDescription?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields to save the job description.",
        variant: "destructive",
      });
      return;
    }
    
    saveJobDescriptionMutation.mutate({
      title,
      company,
      description: data.jobDescription
    });
  };
  
  const handleSelectJobDescription = (id: string) => {
    const selected = jobDescriptions.find(jd => jd.id === Number(id));
    if (selected) {
      updateData({
        ...data,
        jobDescription: selected.description,
        selectedJobDescription: selected.id
      });
      
      // Also set title and company for UI consistency
      setTitle(selected.title);
      setCompany(selected.company);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Job Description</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Enter the job description to tailor your resume for the best match.
        </p>
      </div>

      <div className="space-y-4">
        {!isCreating && jobDescriptions.length > 0 && (
          <div className="grid gap-2">
            <Label htmlFor="savedJobDescription">Select a saved job description</Label>
            <Select 
              onValueChange={handleSelectJobDescription}
              value={data.selectedJobDescription?.toString() || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a saved job description" />
              </SelectTrigger>
              <SelectContent>
                {jobDescriptions.map((jd) => (
                  <SelectItem key={jd.id} value={jd.id.toString()}>
                    {jd.title} at {jd.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {!isCreating && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCreating(true)}
            >
              <FilePlus className="mr-2 h-4 w-4" />
              Create New
            </Button>
          </div>
        )}
        
        {isCreating && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">New Job Description</CardTitle>
              <CardDescription>
                Enter details about the job you're applying for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g. Software Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="e.g. Acme Inc."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="jobDescription">
                  Job Description (paste the full job posting)
                </Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the job description here..."
                  value={data.jobDescription || ""}
                  onChange={handleTextareaChange}
                  rows={10}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                  disabled={saveJobDescriptionMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveJobDescription}
                  disabled={saveJobDescriptionMutation.isPending}
                >
                  {saveJobDescriptionMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Job Description
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {!isCreating && (
          <div className="grid gap-2">
            <Label htmlFor="jobDescription">
              Job Description
            </Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the job description here..."
              value={data.jobDescription || ""}
              onChange={handleTextareaChange}
              rows={10}
            />
          </div>
        )}
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
        <h3 className="text-sm font-medium mb-2">Why This Matters</h3>
        <ul className="text-xs space-y-1 text-gray-500 dark:text-gray-400 list-disc pl-4">
          <li>Tailoring your resume to match specific job descriptions significantly increases your chances of getting an interview</li>
          <li>Many companies use Applicant Tracking Systems (ATS) that scan for relevant keywords</li>
          <li>Including key terms from the job description helps your resume pass through these systems</li>
          <li>Save job descriptions to quickly tailor your resume for similar positions in the future</li>
        </ul>
      </div>
    </div>
  );
}