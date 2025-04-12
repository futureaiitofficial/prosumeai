import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateProfessionalSummary } from "@/utils/ai-resume-helpers";
import { useFeatureGuard } from "@/hooks/use-feature-access";
import { featureAccessModal } from "@/lib/queryClient";

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  description: string;
  achievements: string[];
  relevanceScore?: number;
}

interface SummaryFormProps {
  data: {
    targetJobTitle?: string;
    jobDescription?: string;
    workExperience: WorkExperience[];
    skills?: string[];
    technicalSkills?: string[];
    softSkills?: string[];
    summary?: string;
  };
  updateData: (data: any) => void;
}

export default function SummaryForm({ data, updateData }: SummaryFormProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const { hasAccess } = useFeatureGuard("ai_resume_generation", { showToast: false });
  
  const handleGenerateSummary = async () => {
    // First check if user has access to this feature
    if (!hasAccess) {
      featureAccessModal.showModal("ai_resume_generation");
      return;
    }
    
    try {
      // Check if we have the required data
      if (!data.targetJobTitle) {
        toast({
          title: "Missing Information",
          description: "Please enter a target job title first.",
          variant: "destructive",
        });
        return;
      }

      if (!data.jobDescription) {
        toast({
          title: "Missing Information",
          description: "Please enter a job description to generate a tailored summary.",
          variant: "destructive",
        });
        return;
      }

      if (!data.workExperience || data.workExperience.length === 0) {
        toast({
          title: "Missing Information",
          description: "Please add work experience to generate a professional summary.",
          variant: "destructive",
        });
        return;
      }

      // Get skills (either from the combined skills field or from separate technical/soft skills)
      const skills = data.skills || [...(data.technicalSkills || []), ...(data.softSkills || [])];
      
      setIsGenerating(true);
      
      // Extract most relevant experience based on job description similarity
      const relevantExperience = data.workExperience
        .map((exp: WorkExperience) => ({
          ...exp,
          relevanceScore: calculateExperienceRelevance(exp, data.jobDescription || '')
        }))
        .sort((a: WorkExperience, b: WorkExperience) => 
          (b.relevanceScore || 0) - (a.relevanceScore || 0)
        )
        .slice(0, 2); // Get top 2 most relevant experiences

      const generatedSummary = await generateProfessionalSummary(
        data.targetJobTitle || '',
        data.jobDescription || '',
        relevantExperience,
        skills
      );
      
      updateData({ summary: generatedSummary });
      
      toast({
        title: "Summary Generated",
        description: "Professional summary has been generated and optimized for ATS keyword matching.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating your summary. Please try again.",
        variant: "destructive",
      });
      console.error("Summary generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Helper function to calculate experience relevance
  const calculateExperienceRelevance = (experience: WorkExperience, jobDescription: string) => {
    const jobDescLower = jobDescription.toLowerCase();
    const expTitleLower = experience.position.toLowerCase();
    const expDescLower = experience.description.toLowerCase();
    const achievementsLower = experience.achievements?.join(' ').toLowerCase() || '';

    // Calculate keyword matches
    const titleMatches = countKeywordMatches(expTitleLower, jobDescLower);
    const descMatches = countKeywordMatches(expDescLower, jobDescLower);
    const achievementMatches = countKeywordMatches(achievementsLower, jobDescLower);

    // Weight the scores (title matches count more)
    return (titleMatches * 2) + descMatches + achievementMatches;
  };

  // Helper function to count keyword matches
  const countKeywordMatches = (text: string, jobDesc: string) => {
    // Extract important keywords from job description (you might want to enhance this)
    const keywords = jobDesc.split(/\W+/).filter(word => 
      word.length > 3 && !commonWords.includes(word.toLowerCase())
    );

    // Count matches
    return keywords.reduce((count, keyword) => 
      count + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0);
  };

  // Common words to exclude from keyword matching
  const commonWords = [
    "the", "and", "that", "have", "for", "not", "with", "you", "this", "but",
    "his", "her", "they", "will", "has", "more", "from", "into", "other", "about"
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Professional Summary</h2>
        <Button 
          onClick={handleGenerateSummary} 
          variant="outline"
          className="gap-2"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </>
          )}
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-2">
        Write 2-4 short, energetic sentences about what makes you a good fit
        for this position. Highlight your most relevant skills and experiences.
      </p>
      <div className="grid gap-2">
        <Textarea
          placeholder="Creative software engineer with 5+ years of experience and a track record of..."
          value={data.summary || ""}
          onChange={(e) => {
            // Limit to 300 characters
            const summary = e.target.value.slice(0, 300);
            updateData({ summary });
          }}
          maxLength={300}
          rows={6}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Recommended: Keep your summary under 300 characters for optimal resume formatting.
        <span className="ml-2 font-medium">{data.summary ? `${data.summary.length}/300 characters` : '0/300 characters'}</span>
      </p>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Pro Tip</h3>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Your summary should be tailored to the job description. Incorporate keywords from the job
          posting to help your resume pass through Applicant Tracking Systems (ATS).
          Use the AI generation button to create a tailored summary based on your experience and the job description.
        </p>
      </div>
    </div>
  );
}