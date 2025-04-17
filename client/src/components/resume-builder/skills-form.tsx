import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { extractRelevantSkills } from "@/utils/ai-resume-helpers";
import {
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Switch
} from "@/components/ui/switch";

interface SkillsFormProps {
  data: {
    skills: string[];
    technicalSkills: string[];
    softSkills: string[];
    targetJobTitle?: string;
    jobDescription?: string;
    useSkillCategories?: boolean;
  };
  updateData: (data: any) => void;
}

export default function SkillsForm({ data, updateData }: SkillsFormProps) {
  const { toast } = useToast();
  const [newGeneralSkill, setNewGeneralSkill] = useState("");
  const [newTechnicalSkill, setNewTechnicalSkill] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");
  const [combinedSkills, setCombinedSkills] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [useCategories, setUseCategories] = useState(data.useSkillCategories ?? false);

  // Initialize skills from props
  useEffect(() => {
    // Set the categories toggle based on the saved preference
    setUseCategories(data.useSkillCategories ?? false);
    
    // Set the active tab based on the categories setting
    if (data.useSkillCategories) {
      setActiveTab("categorized");
    } else {
      setActiveTab("all");
    }
    
    // Initialize combined skills for text area
    if (Array.isArray(data.skills)) {
      setCombinedSkills(data.skills.join(", "));
    }
  }, [data]); // Re-run when data changes, e.g., when loading a saved resume

  // Handle category preference change
  const handleCategoryToggleChange = (checked: boolean) => {
    setUseCategories(checked);
    
    // If turning off categories, merge all skills into single list but preserve categorization
    if (!checked) {
      // Store all skills in a single array but preserve the originals in their respective arrays
      const allSkills = [
        ...(data.skills || []),
        ...(data.technicalSkills || []),
        ...(data.softSkills || [])
      ].filter((skill, index, self) => self.indexOf(skill) === index); // Remove duplicates
      
      // Update skills with combined list but preserve the categorized skills for later
      updateData({
        skills: allSkills,
        useSkillCategories: false 
        // Important: We're not clearing technicalSkills and softSkills arrays
        // This way we preserve the categorization information
      });
      
      setCombinedSkills(allSkills.join(", "));
      
      // Reset to all skills tab when categories are disabled
      setActiveTab("all");
    } 
    // If turning on categories, restore the categorized view
    else {
      // Just enable the categories flag - we'll keep existing categorized skills
      updateData({ useSkillCategories: true });
      
      // If no categorized skills exist but we have general skills, we'll keep them as general
      if ((data.technicalSkills?.length === 0 || !data.technicalSkills) && 
          (data.softSkills?.length === 0 || !data.softSkills) && 
          data.skills?.length > 0) {
        // If we have general skills but no categorized skills, we could potentially
        // ask the user if they want to auto-categorize their skills here
      } 
      
      // Always switch to categorized view when categories are enabled
      setActiveTab("categorized");
    }
  };

  const handleCombinedSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCombinedSkills(e.target.value);
    const skillsArray = e.target.value
      .split(",")
      .map(skill => skill.trim())
      .filter(Boolean);
    updateData({ skills: skillsArray });
  };

  const handleAddSkill = (skillType: 'general' | 'technical' | 'soft') => {
    // Get the correct skill value and setter based on type
    let skillValue: string;
    let setSkillValue: React.Dispatch<React.SetStateAction<string>>;
    
    if (skillType === 'general') {
      skillValue = newGeneralSkill;
      setSkillValue = setNewGeneralSkill;
    } else if (skillType === 'technical') {
      skillValue = newTechnicalSkill;
      setSkillValue = setNewTechnicalSkill;
    } else { // soft
      skillValue = newSoftSkill;
      setSkillValue = setNewSoftSkill;
    }
    
    if (skillValue.trim()) {
      if (skillType === 'general') {
        const updatedSkills = [...(data.skills || []), skillValue.trim()];
        updateData({ skills: updatedSkills });
        setCombinedSkills(updatedSkills.join(", "));
      } else if (skillType === 'technical') {
        const updatedTechnicalSkills = [...(data.technicalSkills || []), skillValue.trim()];
        updateData({ technicalSkills: updatedTechnicalSkills });
      } else if (skillType === 'soft') {
        const updatedSoftSkills = [...(data.softSkills || []), skillValue.trim()];
        updateData({ softSkills: updatedSoftSkills });
      }
      setSkillValue("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string, skillType = "all") => {
    if (skillType === "all") {
      const updatedSkills = (data.skills || []).filter(
        skill => skill !== skillToRemove
      );
      updateData({ skills: updatedSkills });
      setCombinedSkills(updatedSkills.join(", "));
    } else if (skillType === "technical") {
      const updatedTechnicalSkills = (data.technicalSkills || []).filter(
        skill => skill !== skillToRemove
      );
      updateData({ technicalSkills: updatedTechnicalSkills });
    } else if (skillType === "soft") {
      const updatedSoftSkills = (data.softSkills || []).filter(
        skill => skill !== skillToRemove
      );
      updateData({ softSkills: updatedSoftSkills });
    }
  };
  
  const handleExtractSkills = async () => {
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
          description: "Please enter a job description to extract relevant skills.",
          variant: "destructive",
        });
        return;
      }
      
      setIsExtracting(true);
      
      const extractedSkills = await extractRelevantSkills(
        data.targetJobTitle,
        data.jobDescription
      );
      
      // If using categories, update the categorized skills
      if (useCategories) {
        updateData({ 
          technicalSkills: extractedSkills.technicalSkills,
          softSkills: extractedSkills.softSkills,
          useSkillCategories: true
        });
        
        // Switch to categorized view
        setActiveTab("categorized");
      } else {
        // If not using categories, combine all skills into one list
        const allSkills = [
          ...(extractedSkills.technicalSkills || []),
          ...(extractedSkills.softSkills || [])
        ];
        updateData({ 
          skills: allSkills,
          technicalSkills: [],
          softSkills: [],
          useSkillCategories: false
        });
        setCombinedSkills(allSkills.join(", "));
      }
      
      toast({
        title: "Skills Extracted",
        description: `Extracted ${extractedSkills.technicalSkills.length} technical skills and ${extractedSkills.softSkills.length} soft skills from the job description.`,
      });
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: "There was an error extracting skills from the job description. Please try again.",
        variant: "destructive",
      });
      console.error("Skills extraction error:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Skills</h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleExtractSkills} 
            variant="outline" 
            size="sm"
            disabled={isExtracting || !data.jobDescription}
            className="gap-2"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Extract from Job
              </>
            )}
          </Button>
          <div className="flex items-center space-x-2">
            <Switch
              id="use-categories"
              checked={useCategories}
              onCheckedChange={handleCategoryToggleChange}
            />
            <Label htmlFor="use-categories">Use skill categories</Label>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-sm text-gray-500">
            Categorize skills into technical and soft skills
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            id="use-categories" 
            checked={useCategories} 
            onCheckedChange={handleCategoryToggleChange} 
          />
          <Label htmlFor="use-categories">
            {useCategories ? "Categories enabled" : "All skills"}
          </Label>
        </div>
      </div>

      {useCategories ? (
        // Categorized skills view
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="categorized">Categorized Skills</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categorized" className="space-y-6">
            {/* Technical Skills */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Technical Skills</h3>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Add a technical skill (e.g., JavaScript, Python)"
                    value={newTechnicalSkill}
                    onChange={(e) => setNewTechnicalSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill('technical');
                      }
                    }}
                  />
                </div>
                <Button onClick={() => handleAddSkill('technical')} disabled={!newTechnicalSkill.trim()}>
                  Add
                </Button>
              </div>
              
              {data.technicalSkills && data.technicalSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.technicalSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill, "technical")}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Soft Skills */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Soft Skills</h3>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Add a soft skill (e.g., Communication, Leadership)"
                    value={newSoftSkill}
                    onChange={(e) => setNewSoftSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill('soft');
                      }
                    }}
                  />
                </div>
                <Button onClick={() => handleAddSkill('soft')} disabled={!newSoftSkill.trim()}>
                  Add
                </Button>
              </div>
              
              {data.softSkills && data.softSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.softSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill, "soft")}
                        className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* General Skills */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">General Skills</h3>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Add a general skill (e.g., Project Management)"
                    value={newGeneralSkill}
                    onChange={(e) => setNewGeneralSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill('general');
                      }
                    }}
                  />
                </div>
                <Button onClick={() => handleAddSkill('general')} disabled={!newGeneralSkill.trim()}>
                  Add
                </Button>
              </div>
              
              {data.skills && data.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Non-categorized view (all skills in one list)
        <div className="space-y-4">
          {/* Quick add skill input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Add a skill (e.g., JavaScript, Project Management)"
                value={newGeneralSkill}
                onChange={(e) => setNewGeneralSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill('general');
                  }
                }}
              />
            </div>
            <Button onClick={() => handleAddSkill('general')} disabled={!newGeneralSkill.trim()}>
              Add
            </Button>
          </div>

          {/* Skills tags display */}
          {data.skills && data.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {data.skills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 px-3 py-1 rounded-full flex items-center"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bulk edit textarea */}
          <div className="mt-6">
            <Label htmlFor="skills-textarea">Or edit all skills at once (comma separated)</Label>
            <Textarea
              id="skills-textarea"
              placeholder="JavaScript, React, Node.js, Communication, Team Leadership"
              value={combinedSkills}
              onChange={handleCombinedSkillsChange}
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Skills categories */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-6">
        <h3 className="font-medium mb-3">Skills Tip</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Include a diverse mix of these skill types to create a well-rounded resume:
        </p>
        <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
          <li><span className="font-medium">Technical Skills:</span> Programming languages, tools, software</li>
          <li><span className="font-medium">Soft Skills:</span> Communication, leadership, problem-solving</li>
          <li><span className="font-medium">Industry Skills:</span> Skills specific to your field</li>
        </ul>
        <p className="text-sm mt-3 text-blue-600 dark:text-blue-400">
          <span className="font-medium">Pro tip:</span> Click "Extract from Job" to automatically identify relevant skills from the job description.
        </p>
      </div>
    </div>
  );
}