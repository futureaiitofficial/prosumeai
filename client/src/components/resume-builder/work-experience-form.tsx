import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Trash, 
  Briefcase, 
  ArrowUp, 
  ArrowDown, 
  PlusCircle,
  Sparkles,
  RefreshCw,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { enhanceExperienceBullets } from "@/utils/ai-resume-helpers";
import { useFeatureGuard } from "@/hooks/use-feature-access";
import { featureAccessModal } from "@/lib/queryClient";

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
  achievements: string[];
}

interface WorkExperienceFormProps {
  data: any;
  updateData: (data: any) => void;
}

export default function WorkExperienceForm({ data, updateData }: WorkExperienceFormProps) {
  const { toast } = useToast();
  const [newAchievement, setNewAchievement] = useState<{ [key: string]: string }>({});
  const [enhancements, setEnhancements] = useState<{ [key: string]: boolean }>({});
  const { hasAccess } = useFeatureGuard("ai_resume_generation", { showToast: false });

  // Ensure workExperience array exists
  const workExperience = data?.workExperience || [];

  const addExperience = () => {
    const newExperience = {
      id: Date.now().toString(),
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: null,
      current: false,
      description: "",
      achievements: []
    };
    
    updateData({ 
      workExperience: [...workExperience, newExperience] 
    });
  };

  const removeExperience = (id: string) => {
    updateData({
      workExperience: workExperience.filter((exp: WorkExperience) => exp.id !== id)
    });
  };

  const editExperience = (experience: WorkExperience) => {
    const updatedExperiences = workExperience.map((exp: WorkExperience) => 
      exp.id === experience.id ? experience : exp
    );
    
    updateData({ 
      workExperience: updatedExperiences 
    });
  };

  const addAchievement = (experienceId: string) => {
    if (!newAchievement[experienceId] || !newAchievement[experienceId].trim()) return;
    
    const updatedExperiences = workExperience.map((exp: WorkExperience) => {
      if (exp.id === experienceId) {
        return {
          ...exp,
          achievements: [...(exp.achievements || []), newAchievement[experienceId].trim()]
        };
      }
      return exp;
    });
    
    updateData({ workExperience: updatedExperiences });
    setNewAchievement({
      ...newAchievement,
      [experienceId]: ""
    });
  };

  const removeAchievement = (experienceId: string, index: number) => {
    const updatedExperiences = workExperience.map((exp: WorkExperience) => {
      if (exp.id === experienceId) {
        const newAchievements = [...(exp.achievements || [])];
        newAchievements.splice(index, 1);
        return {
          ...exp,
          achievements: newAchievements
        };
      }
      return exp;
    });
    
    updateData({ workExperience: updatedExperiences });
  };

  const moveExperience = (id: string, direction: 'up' | 'down') => {
    const index = workExperience.findIndex((exp: WorkExperience) => exp.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === workExperience.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedExperiences = [...workExperience];
    const temp = updatedExperiences[index];
    updatedExperiences[index] = updatedExperiences[newIndex];
    updatedExperiences[newIndex] = temp;
    
    updateData({ workExperience: updatedExperiences });
  };
  
  const enhanceAchievements = async (experienceId: string) => {
    // First check if user has access to this feature
    if (!hasAccess) {
      featureAccessModal.showModal("ai_resume_generation");
      return;
    }
    
    try {
      // Find the experience to enhance
      const experience = workExperience.find((exp: WorkExperience) => exp.id === experienceId);
      
      if (!experience) {
        toast({
          title: "Error",
          description: "Could not find the selected work experience.",
          variant: "destructive",
        });
        return;
      }
      
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
          description: "Please enter a job description to optimize your achievements.",
          variant: "destructive",
        });
        return;
      }
      
      if (!experience.achievements || experience.achievements.length === 0) {
        toast({
          title: "Missing Achievements",
          description: "Please add at least one achievement to enhance.",
          variant: "destructive",
        });
        return;
      }
      
      // Set enhancement state to loading
      setEnhancements({
        ...enhancements,
        [experienceId]: true,
      });
      
      // Extract keywords from both job description and experience title
      const jobKeywords = extractKeywords(data.jobDescription);
      const titleKeywords = extractKeywords(experience.position);
      
      // Call the API to enhance the achievements with balanced keyword optimization
      const enhancedAchievements = await enhanceExperienceBullets(
        data.targetJobTitle,
        data.jobDescription,
        experience.achievements,
        {
          experienceTitle: experience.position,
          company: experience.company,
          description: experience.description
        }
      );
      
      if (!enhancedAchievements || enhancedAchievements.length === 0) {
        throw new Error('No enhanced achievements returned');
      }
      
      // Update the experience with enhanced achievements
      const updatedExperiences = workExperience.map((exp: WorkExperience) => {
        if (exp.id === experienceId) {
          return {
            ...exp,
            achievements: enhancedAchievements,
          };
        }
        return exp;
      });
      
      updateData({ workExperience: updatedExperiences });
      
      toast({
        title: "Achievements Enhanced",
        description: "Your achievements have been optimized with balanced keyword placement.",
      });
    } catch (error) {
      console.error("Experience enhancement error:", error);
      toast({
        title: "Enhancement Failed",
        description: error instanceof Error ? error.message : "There was an error enhancing your achievements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEnhancements({
        ...enhancements,
        [experienceId]: false,
      });
    }
  };

  // Helper function to extract keywords from text
  const extractKeywords = (text: string): string[] => {
    if (!text) return [];
    
    // Convert to lowercase and split into words
    const words = text.toLowerCase().split(/\W+/);
    
    // Filter out common words and short words
    return words.filter(word => 
      word.length > 3 && 
      !commonWords.includes(word) &&
      !word.match(/^\d+$/) // Exclude numbers
    );
  };

  // Common words to exclude
  const commonWords = [
    "the", "and", "that", "have", "for", "not", "with", "you", "this", "but",
    "his", "her", "they", "will", "has", "more", "from", "into", "other", "about",
    "was", "were", "been", "being", "have", "had", "does", "did", "doing"
  ];

  const duplicateExperience = (id: string) => {
    const experienceToDuplicate = workExperience.find((exp: WorkExperience) => exp.id === id);
    if (!experienceToDuplicate) return;
    
    const duplicatedExperience = {
      ...experienceToDuplicate,
      id: Date.now().toString(), // Generate a new ID for the duplicate
    };
    
    // Find the index of the original experience
    const index = workExperience.findIndex((exp: WorkExperience) => exp.id === id);
    
    // Insert the duplicate after the original
    const updatedExperiences = [...workExperience];
    updatedExperiences.splice(index + 1, 0, duplicatedExperience);
    
    updateData({ 
      workExperience: updatedExperiences 
    });
    
    toast({
      title: "Experience Duplicated",
      description: "Work experience has been duplicated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Employment History</h2>
        <Button 
          onClick={addExperience} 
          variant="outline" 
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-500">
          Show your relevant experience (last 10+ years). Use bullet points to note your achievements,
          if possible - use numbers/facts (Achieved X by doing Y).
        </p>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
            <span>
              <strong>New AI feature:</strong> Add your achievements and click "Optimize for ATS" to tailor them to match your target job description.
            </span>
          </p>
        </div>
      </div>
      
      {/* Existing work experiences */}
      {workExperience.length > 0 ? (
        <div className="space-y-4">
          {workExperience.map((exp: WorkExperience, index: number) => (
            <Card key={exp.id} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="absolute right-2 top-2 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveExperience(exp.id, 'up')}
                    disabled={index === 0}
                    className="h-8 w-8 text-gray-500"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveExperience(exp.id, 'down')}
                    disabled={index === workExperience.length - 1}
                    className="h-8 w-8 text-gray-500"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicateExperience(exp.id)}
                    className="h-8 w-8 text-gray-500 hover:text-blue-500"
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExperience(exp.id)}
                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-start mb-4 mt-6">
                  <Briefcase className="h-5 w-5 text-primary-600 mr-2 mt-1" />
                  <h3 className="font-medium text-lg">{exp.position || "Position"} {exp.company ? `at ${exp.company}` : ""}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Job Title</Label>
                    <Input
                      placeholder="Software Engineer"
                      value={exp.position}
                      onChange={(e) => {
                        editExperience({
                          ...exp,
                          position: e.target.value
                        });
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Company</Label>
                    <Input
                      placeholder="Acme Inc."
                      value={exp.company}
                      onChange={(e) => {
                        editExperience({
                          ...exp,
                          company: e.target.value
                        });
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid gap-2 mt-4">
                  <Label>Location</Label>
                  <Input
                    placeholder="New York, NY or Remote"
                    value={exp.location}
                    onChange={(e) => {
                      editExperience({
                        ...exp,
                        location: e.target.value
                      });
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={exp.startDate}
                      onChange={(e) => {
                        editExperience({
                          ...exp,
                          startDate: e.target.value
                        });
                      }}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Current Job</Label>
                      <Switch 
                        checked={exp.current} 
                        onCheckedChange={(checked) => {
                          editExperience({
                            ...exp,
                            current: checked,
                            endDate: checked ? null : exp.endDate
                          });
                        }}
                      />
                    </div>
                    
                    {!exp.current && (
                      <Input
                        type="date"
                        value={exp.endDate || ""}
                        onChange={(e) => {
                          editExperience({
                            ...exp,
                            endDate: e.target.value
                          });
                        }}
                      />
                    )}
                  </div>
                </div>
                
                <div className="grid gap-2 mt-4">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your responsibilities and daily tasks..."
                    value={exp.description}
                    rows={3}
                    onChange={(e) => {
                      editExperience({
                        ...exp,
                        description: e.target.value
                      });
                    }}
                  />
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Key Achievements</Label>
                    {exp.achievements && exp.achievements.length > 0 && (
                      <Button
                        onClick={() => enhanceAchievements(exp.id)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={enhancements[exp.id]}
                      >
                        {enhancements[exp.id] ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Optimizing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" />
                            Optimize for ATS
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {exp.achievements.map((achievement, i) => (
                        <li key={i} className="flex group">
                          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded p-2 mr-2">
                            {achievement}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAchievement(exp.id, i)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Increased revenue by 20% through..."
                      value={newAchievement[exp.id] || ""}
                      onChange={(e) => setNewAchievement({
                        ...newAchievement,
                        [exp.id]: e.target.value
                      })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAchievement(exp.id);
                        }
                      }}
                    />
                    <Button 
                      onClick={() => addAchievement(exp.id)} 
                      variant="outline"
                      disabled={!newAchievement[exp.id] || !newAchievement[exp.id].trim()}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center p-8">
          <div className="flex flex-col items-center">
            <Briefcase className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium mb-2">No work experience added yet</h3>
            <p className="text-gray-500 mb-4">
              Add your work experience to make your resume stand out.
            </p>
            <Button onClick={addExperience}>
              <Plus className="h-4 w-4 mr-2" />
              Add Work Experience
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}