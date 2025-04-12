import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface JobDescriptionFormProps {
  data: {
    jobDescription: string;
    targetJobTitle: string;
  };
  updateData: (data: any) => void;
}

export default function JobDescriptionForm({ data, updateData }: JobDescriptionFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Job Description</h2>
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-500">
          Edit the job description to update ATS optimization and AI suggestions.
        </p>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
            <span>
              <strong>Pro tip:</strong> The more detailed the job description, the better we can optimize your resume for ATS.
            </span>
          </p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Target Position</Label>
              <input
                type="text"
                value={data.targetJobTitle || ""}
                onChange={(e) => updateData({ targetJobTitle: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="grid gap-2">
              <Label>Job Description</Label>
              <Textarea
                placeholder="Paste the job description here..."
                value={data.jobDescription || ""}
                onChange={(e) => updateData({ jobDescription: e.target.value })}
                rows={10}
                className="min-h-[200px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 