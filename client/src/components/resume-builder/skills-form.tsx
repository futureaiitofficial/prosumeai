import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Sparkles, RefreshCw, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { extractRelevantSkills, generateSkillsForPosition, extractSkillsWithCategories, generateSkillsWithCategories } from "@/utils/ai-resume-helpers";
import {
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Switch
} from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface SkillsFormProps {
  data: {
    skills: string[];
    technicalSkills: string[];
    softSkills: string[];
    skillCategories: { [categoryName: string]: string[] };
    targetJobTitle?: string;
    jobDescription?: string;
    useSkillCategories?: boolean;
  };
  updateData: (data: any) => void;
}

export default function SkillsForm({ data, updateData }: SkillsFormProps) {
  const { toast } = useToast();
  const [newSkill, setNewSkill] = useState("");
  const [categoryInputs, setCategoryInputs] = useState<{ [categoryName: string]: string }>({});
  const [combinedSkills, setCombinedSkills] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [useCategories, setUseCategories] = useState(data.useSkillCategories ?? false);
  
  // Category management state
  const [skillCategories, setSkillCategories] = useState<{ [categoryName: string]: string[] }>({});
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  // Initialize skills from props and migrate legacy data
  useEffect(() => {
    setUseCategories(data.useSkillCategories ?? false);
    
    // Initialize skill categories - migrate from legacy structure if needed
    let categories: { [categoryName: string]: string[] } = {};
    
    // If user has the new skillCategories structure, use it
    if (data.skillCategories && Object.keys(data.skillCategories).length > 0) {
      categories = { ...data.skillCategories };
    } else {
      // Migrate from legacy structure
      if (data.technicalSkills && data.technicalSkills.length > 0) {
        categories["Technical Skills"] = [...data.technicalSkills];
      }
      if (data.softSkills && data.softSkills.length > 0) {
        categories["Soft Skills"] = [...data.softSkills];
      }
      
      // If no categorized skills but has general skills, create a default category
      if (Object.keys(categories).length === 0 && data.skills && data.skills.length > 0) {
        categories["General Skills"] = [...data.skills];
      }
    }
    
    setSkillCategories(categories);
    
    // Set active tab based on categories setting
    if (data.useSkillCategories) {
      setActiveTab("categorized");
    } else {
      setActiveTab("all");
    }
    
    // Initialize combined skills for text area
    if (Array.isArray(data.skills)) {
      setCombinedSkills(data.skills.join(", "));
    }
  }, [data]);

  // Get all skills from all categories for the "all skills" view
  const getAllSkills = (): string[] => {
    if (!useCategories) {
      return data.skills || [];
    }
    
    const allSkills: string[] = [];
    Object.values(skillCategories).forEach(categorySkills => {
      allSkills.push(...categorySkills);
    });
    
    // Remove duplicates
    return Array.from(new Set(allSkills));
  };

  // Handle category preference change
  const handleCategoryToggleChange = (checked: boolean) => {
    setUseCategories(checked);
    
    if (!checked) {
      // Switching to simple mode - combine all skills
      const allSkills = getAllSkills();
      updateData({
        skills: allSkills,
        useSkillCategories: false
      });
      setCombinedSkills(allSkills.join(", "));
      setActiveTab("all");
    } else {
      // Switching to categorized mode
      updateData({ 
        useSkillCategories: true,
        skillCategories: skillCategories
      });
      setActiveTab("categorized");
    }
  };

  // Add a new skill category
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const updatedCategories = {
      ...skillCategories,
      [newCategoryName.trim()]: []
    };
    
    setSkillCategories(updatedCategories);
    updateData({ skillCategories: updatedCategories });
    setNewCategoryName("");
    setShowAddCategoryDialog(false);
    
    toast({
      title: "Category Added",
      description: `"${newCategoryName.trim()}" category has been created.`,
    });
  };

  // Rename a category
  const handleRenameCategory = (oldName: string) => {
    if (!editCategoryName.trim() || editCategoryName.trim() === oldName) {
      setEditingCategory(null);
      setEditCategoryName("");
      return;
    }
    
    const updatedCategories = { ...skillCategories };
    updatedCategories[editCategoryName.trim()] = updatedCategories[oldName];
    delete updatedCategories[oldName];
    
    setSkillCategories(updatedCategories);
    updateData({ skillCategories: updatedCategories });
    setEditingCategory(null);
    setEditCategoryName("");
    
    toast({
      title: "Category Renamed",
      description: `Category renamed to "${editCategoryName.trim()}".`,
    });
  };

  // Delete a category
  const handleDeleteCategory = (categoryName: string) => {
    const updatedCategories = { ...skillCategories };
    delete updatedCategories[categoryName];
    
    setSkillCategories(updatedCategories);
    updateData({ skillCategories: updatedCategories });
    
    toast({
      title: "Category Deleted",
      description: `"${categoryName}" category has been removed.`,
    });
  };

  // Add skill to a specific category
  const handleAddSkillToCategory = (categoryName: string, skill: string) => {
    if (!skill.trim()) return;
    
    const updatedCategories = {
      ...skillCategories,
      [categoryName]: [...(skillCategories[categoryName] || []), skill.trim()]
    };
    
    setSkillCategories(updatedCategories);
    updateData({ skillCategories: updatedCategories });
    
    // Clear the input for this specific category
    setCategoryInputs(prev => ({
      ...prev,
      [categoryName]: ""
    }));
  };

  // Remove skill from a specific category
  const handleRemoveSkillFromCategory = (categoryName: string, skillToRemove: string) => {
    const updatedCategories = {
      ...skillCategories,
      [categoryName]: (skillCategories[categoryName] || []).filter(skill => skill !== skillToRemove)
    };
    
    setSkillCategories(updatedCategories);
    updateData({ skillCategories: updatedCategories });
  };

  // Handle simple skills (non-categorized)
  const handleCombinedSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCombinedSkills(e.target.value);
    const skillsArray = e.target.value
      .split(",")
      .map(skill => skill.trim())
      .filter(Boolean);
    updateData({ skills: skillsArray });
  };

  const handleAddSimpleSkill = () => {
    if (!newSkill.trim()) return;
    
    const updatedSkills = [...(data.skills || []), newSkill.trim()];
    updateData({ skills: updatedSkills });
    setCombinedSkills(updatedSkills.join(", "));
    setNewSkill("");
  };

  const handleRemoveSimpleSkill = (skillToRemove: string) => {
    const updatedSkills = (data.skills || []).filter(skill => skill !== skillToRemove);
    updateData({ skills: updatedSkills });
    setCombinedSkills(updatedSkills.join(", "));
  };

  // Helper function to merge skills
  const mergeSkills = (existingSkills: string[] = [], newSkills: string[] = []): string[] => {
    const skillsSet = new Set(existingSkills);
    newSkills.forEach(skill => skillsSet.add(skill));
    return Array.from(skillsSet);
  };

  // AI Generation with flexible categories
  const handleGenerateSkills = async () => {
    try {
      if (!data.targetJobTitle) {
        toast({
          title: "Missing Information",
          description: "Please enter a target job title first.",
          variant: "destructive",
        });
        return;
      }
      
      setIsGenerating(true);
      
      if (useCategories && Object.keys(skillCategories).length > 0) {
        // Generate skills for existing custom categories
        const categoryNames = Object.keys(skillCategories);
        const generatedSkills = await generateSkillsWithCategories(data.targetJobTitle, categoryNames);
        
        // Merge with existing skills
        const updatedCategories = { ...skillCategories };
        Object.keys(generatedSkills).forEach(category => {
          if (updatedCategories[category]) {
            updatedCategories[category] = mergeSkills(updatedCategories[category], generatedSkills[category]);
          } else {
            updatedCategories[category] = generatedSkills[category];
          }
        });
        
        setSkillCategories(updatedCategories);
        updateData({ skillCategories: updatedCategories });
        
        toast({
          title: "Skills Generated",
          description: `Added skills across ${Object.keys(generatedSkills).length} categories.`,
        });
      } else {
        // Generate skills for default categories or simple mode
        const generatedSkills = await generateSkillsForPosition(data.targetJobTitle);
        
        if (useCategories) {
          // Create default categories
          const newCategories = generatedSkills.categorizedSkills;
          setSkillCategories(newCategories);
          updateData({ 
            skillCategories: newCategories,
            useSkillCategories: true 
          });
        } else {
          // Add to simple skills list
          const allNewSkills = [
            ...generatedSkills.technicalSkills,
            ...generatedSkills.softSkills
          ];
          const mergedSkills = mergeSkills(data.skills, allNewSkills);
          updateData({ skills: mergedSkills });
          setCombinedSkills(mergedSkills.join(", "));
        }
        
        toast({
          title: "Skills Generated",
          description: `Added ${generatedSkills.technicalSkills.length + generatedSkills.softSkills.length} skills.`,
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating skills. Please try again.",
        variant: "destructive",
      });
      console.error("Skills generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtractSkills = async () => {
    try {
      if (!data.targetJobTitle || !data.jobDescription) {
        toast({
          title: "Missing Information",
          description: "Please enter both a target job title and job description.",
          variant: "destructive",
        });
        return;
      }
      
      setIsExtracting(true);
      
      if (useCategories && Object.keys(skillCategories).length > 0) {
        // Extract skills for existing custom categories
        const categoryNames = Object.keys(skillCategories);
        const extractedSkills = await extractSkillsWithCategories(
          data.targetJobTitle, 
          data.jobDescription, 
          categoryNames
        );
        
        // Merge with existing skills
        const updatedCategories = { ...skillCategories };
        Object.keys(extractedSkills).forEach(category => {
          if (updatedCategories[category]) {
            updatedCategories[category] = mergeSkills(updatedCategories[category], extractedSkills[category]);
          } else {
            updatedCategories[category] = extractedSkills[category];
          }
        });
        
        setSkillCategories(updatedCategories);
        updateData({ skillCategories: updatedCategories });
        
        toast({
          title: "Skills Extracted",
          description: `Extracted skills across ${Object.keys(extractedSkills).length} categories.`,
        });
      } else {
        // Extract skills for default categories or simple mode
        const extractedSkills = await extractRelevantSkills(data.targetJobTitle, data.jobDescription);
        
        if (useCategories) {
          // Create default categories
          const newCategories = extractedSkills.categorizedSkills;
          setSkillCategories(newCategories);
          updateData({ 
            skillCategories: newCategories,
            useSkillCategories: true 
          });
        } else {
          // Add to simple skills list
          const allNewSkills = [
            ...extractedSkills.technicalSkills,
            ...extractedSkills.softSkills
          ];
          const mergedSkills = mergeSkills(data.skills, allNewSkills);
          updateData({ skills: mergedSkills });
          setCombinedSkills(mergedSkills.join(", "));
        }
        
        toast({
          title: "Skills Extracted",
          description: `Extracted ${extractedSkills.technicalSkills.length + extractedSkills.softSkills.length} skills.`,
        });
      }
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: "There was an error extracting skills. Please try again.",
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
            onClick={handleGenerateSkills} 
            variant="outline" 
            size="sm"
            disabled={isGenerating || !data.targetJobTitle}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate for Position
              </>
            )}
          </Button>
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
            <Label htmlFor="use-categories">Use custom categories</Label>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
        <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
          <span>
            <strong>New Feature:</strong> Create custom skill categories like "Programming Languages", "Tools", "Software", etc. Toggle "Use custom categories" to organize your skills exactly how you want!
          </span>
        </p>
      </div>

      {useCategories ? (
        // Custom categorized skills view
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Custom Skill Categories</h3>
            <Button 
              onClick={() => setShowAddCategoryDialog(true)}
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>

          {Object.keys(skillCategories).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No skill categories yet. Click "Add Category" to create your first custom category!</p>
              <p className="text-sm mt-2">Examples: "Programming Languages", "Tools", "Software", "Frameworks"</p>
            </div>
          ) : (
            Object.entries(skillCategories).map(([categoryName, skills]) => (
              <div key={categoryName} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  {editingCategory === categoryName ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameCategory(categoryName);
                          } else if (e.key === "Escape") {
                            setEditingCategory(null);
                            setEditCategoryName("");
                          }
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button 
                        onClick={() => handleRenameCategory(categoryName)}
                        size="sm"
                        variant="outline"
                      >
                        Save
                      </Button>
                      <Button 
                        onClick={() => {
                          setEditingCategory(null);
                          setEditCategoryName("");
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-medium text-lg">{categoryName}</h4>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingCategory(categoryName);
                            setEditCategoryName(categoryName);
                          }}
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Rename
                        </Button>
                        <Button
                          onClick={() => handleDeleteCategory(categoryName)}
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder={`Add a skill to ${categoryName}`}
                    value={categoryInputs[categoryName] || ""}
                    onChange={(e) => setCategoryInputs(prev => ({
                      ...prev,
                      [categoryName]: e.target.value
                    }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkillToCategory(categoryName, categoryInputs[categoryName] || "");
                      }
                    }}
                  />
                  <Button 
                    onClick={() => {
                      handleAddSkillToCategory(categoryName, categoryInputs[categoryName] || "");
                    }}
                    disabled={!(categoryInputs[categoryName] || "").trim()}
                  >
                    Add
                  </Button>
                </div>
                
                {skills && skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <div
                        key={index}
                        className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 px-3 py-1 rounded-full flex items-center"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkillFromCategory(categoryName, skill)}
                          className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No skills in this category yet.</p>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        // Simple skills view (all skills in one list)
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill (e.g., JavaScript, Project Management)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSimpleSkill();
                }
              }}
            />
            <Button onClick={handleAddSimpleSkill} disabled={!newSkill.trim()}>
              Add
            </Button>
          </div>

          {data.skills && data.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 px-3 py-1 rounded-full flex items-center"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSimpleSkill(skill)}
                    className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

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

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="e.g., Programming Languages, Tools, Software"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Popular category ideas:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span>• Programming Languages</span>
                <span>• Frameworks</span>
                <span>• Tools & Software</span>
                <span>• Databases</span>
                <span>• Cloud Platforms</span>
                <span>• Soft Skills</span>
                <span>• Methodologies</span>
                <span>• Certifications</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skills guidance */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-6">
        <h3 className="font-medium mb-3">Skills Organization Tips</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {useCategories 
            ? "Organize your skills into meaningful categories that match your industry and role:"
            : "Include a diverse mix of skills relevant to your target position:"
          }
        </p>
        
        {useCategories ? (
          <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
            <li><span className="font-medium">Programming Languages:</span> JavaScript, Python, Java, etc.</li>
            <li><span className="font-medium">Tools & Platforms:</span> Docker, AWS, Git, etc.</li>
            <li><span className="font-medium">Frameworks:</span> React, Django, Spring, etc.</li>
            <li><span className="font-medium">Soft Skills:</span> Leadership, Communication, Problem-solving</li>
          </ul>
        ) : (
          <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
            <li><span className="font-medium">Technical Skills:</span> Programming languages, tools, software</li>
            <li><span className="font-medium">Soft Skills:</span> Communication, leadership, problem-solving</li>
            <li><span className="font-medium">Industry Skills:</span> Skills specific to your field</li>
          </ul>
        )}
        
        <p className="text-sm mt-3 text-blue-600 dark:text-blue-400">
          <span className="font-medium">Pro tip:</span> Use "Extract from Job" to automatically identify relevant skills from job descriptions, or "Generate for Position" to get role-specific suggestions.
        </p>
      </div>
    </div>
  );
}