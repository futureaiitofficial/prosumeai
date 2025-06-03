import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Code, X } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate: string | null;
  current: boolean;
  url: string | null;
  currentTech?: string;
}

interface ProjectsFormProps {
  data: any;
  updateData: (data: any) => void;
}

export default function ProjectsForm({ data, updateData }: ProjectsFormProps) {
  // Convert technologies to array if it's a string or undefined
  const ensureTechnologiesArray = (technologies: any): string[] => {
    if (!technologies) return [];
    if (Array.isArray(technologies)) return technologies;
    if (typeof technologies === 'string') return [technologies];
    return [];
  };

  // Initialize projects state locally to ensure proper structure
  const [projectsState, setProjectsState] = useState<Project[]>([]);
  
  // Initialize new project form
  const [newProject, setNewProject] = useState<Project>({
    id: "",
    name: "",
    description: "",
    technologies: [],
    startDate: "",
    endDate: null,
    current: false,
    url: null
  });
  
  // Sync with parent data when it changes
  useEffect(() => {
    if (data?.projects) {
      const normalizedProjects = data.projects.map((project: any) => ({
        ...project,
        id: project.id || Date.now().toString(),
        technologies: ensureTechnologiesArray(project.technologies)
      }));
      setProjectsState(normalizedProjects);
    }
  }, [data]);

  // Update parent component with normalized projects
  const updateParent = (updatedProjects: Project[]) => {
    setProjectsState(updatedProjects);
    // Log the data we're sending to the parent
    console.log("Updating parent with projects:", JSON.stringify(updatedProjects));
    updateData({ projects: updatedProjects });
  };

  const addProject = () => {
    const project = {
      ...newProject,
      id: Date.now().toString(),
      technologies: ensureTechnologiesArray(newProject.technologies)
    };
    
    const updatedProjects = [...projectsState, project];
    updateParent(updatedProjects);
    
    // Reset form
    setNewProject({
      id: "",
      name: "",
      description: "",
      technologies: [],
      startDate: "",
      endDate: null,
      current: false,
      url: null
    });
  };

  const removeProject = (id: string) => {
    const updatedProjects = projectsState.filter(project => project.id !== id);
    updateParent(updatedProjects);
  };

  const editProject = (updatedProject: Project) => {
    // Ensure technologies is always an array
    const projectToUpdate = {
      ...updatedProject,
      technologies: ensureTechnologiesArray(updatedProject.technologies)
    };
    
    // Log the update for debugging
    console.log("Updating project technologies:", projectToUpdate.technologies);
    
    const updatedProjects = projectsState.map(project => 
      project.id === projectToUpdate.id ? projectToUpdate : project
    );
    
    updateParent(updatedProjects);
  };

  // Function to specifically handle technology changes
  const handleTechnologiesChange = (project: Project, techString: string) => {
    // This is the key fix - making sure we create and validate the array correctly
    let techArray: string[] = [];
    
    if (techString.includes(',')) {
      // Split by comma if commas exist
      techArray = techString.split(',')
        .map(tech => tech.trim())
        .filter(Boolean);
    } else {
      // Otherwise treat as a single entry (no commas)
      const trimmed = techString.trim();
      if (trimmed) {
        techArray = [trimmed];
      }
    }
    
    console.log("Original tech string:", techString);
    console.log("Created tech array:", techArray);
    
    // Create a new project object with the updated technologies array
    const updatedProject = {
      ...project,
      technologies: techArray
    };
    
    // Log for debugging
    console.log("Updated project technologies:", JSON.stringify(updatedProject.technologies));
    
    // Update the project data
    editProject(updatedProject);
  };

  // Helper functions for URL formatting and validation
  const validateURL = (url: string) => {
    if (!url) return true; // Allow empty URLs
    
    try {
      // Automatically prepend https:// for validation if missing
      const processedUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(processedUrl);
      
      // Basic checks for valid URL structure
      if (!urlObj.hostname || urlObj.hostname.length < 1) {
        return false;
      }
      
      // Check for at least one dot in hostname (basic domain validation)
      if (!urlObj.hostname.includes('.')) {
        return false;
      }
      
      // Check hostname length
      if (urlObj.hostname.length > 253) {
        return false;
      }
      
      return true;
    } catch (_) {
      return false;
    }
  };

  const formatDisplayUrl = (url: string) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '');
  };

  const formatURL = (url: string) => {
    // Return empty string if URL is empty
    if (!url) return '';
    
    // Add https:// if missing
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    
    try {
      const urlObj = new URL(url);
      
      // Remove www. prefix for cleaner display
      let host = urlObj.hostname;
      if (host.startsWith('www.')) {
        host = host.substring(4);
      }
      
      // Truncate paths that are too long
      const path = urlObj.pathname;
      let displayPath = path;
      if (path.length > 15 && path !== '/') {
        displayPath = path.substring(0, 12) + '...';
      }
      
      // Format the final URL
      return `${host}${displayPath === '/' ? '' : displayPath}`;
    } catch (_) {
      return url;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Projects</h2>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Showcase your relevant projects to demonstrate your skills and highlight your portfolio.
      </p>
      
      {/* Existing projects */}
      {projectsState.length > 0 && (
        <div className="space-y-4 mb-6">
          {projectsState.map((project: Project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <Code className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="font-medium">{project.name}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProject(project.id)}
                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Project Name</Label>
                    <Input
                      value={project.name}
                      onChange={(e) => {
                        editProject({
                          ...project,
                          name: e.target.value
                        });
                      }}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      value={project.description}
                      rows={3}
                      onChange={(e) => {
                        editProject({
                          ...project,
                          description: e.target.value
                        });
                      }}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Technologies Used</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter a technology (e.g., React)"
                        value={project.currentTech || ""}
                        onChange={(e) => {
                          // Store the current tech input in a temporary property
                          editProject({
                            ...project,
                            currentTech: e.target.value
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && project.currentTech?.trim()) {
                            e.preventDefault();
                            const tech = project.currentTech.trim();
                            const techArray = [...ensureTechnologiesArray(project.technologies), tech];
                            editProject({
                              ...project,
                              technologies: techArray,
                              currentTech: ""
                            });
                          }
                        }}
                      />
                      <Button 
                        type="button"
                        onClick={() => {
                          if (project.currentTech?.trim()) {
                            const tech = project.currentTech.trim();
                            const techArray = [...ensureTechnologiesArray(project.technologies), tech];
                            editProject({
                              ...project,
                              technologies: techArray,
                              currentTech: ""
                            });
                          }
                        }}
                        disabled={!project.currentTech?.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {/* Display current technologies as tags */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ensureTechnologiesArray(project.technologies).map((tech, idx) => (
                        <div key={idx} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full flex items-center">
                          <span>{tech}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newTechArray = ensureTechnologiesArray(project.technologies).filter((_, i) => i !== idx);
                              editProject({
                                ...project,
                                technologies: newTechArray
                              });
                            }}
                            className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={project.startDate}
                        onChange={(e) => {
                          editProject({
                            ...project,
                            startDate: e.target.value
                          });
                        }}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Current Project</Label>
                        <Switch 
                          checked={project.current} 
                          onCheckedChange={(checked) => {
                            editProject({
                              ...project,
                              current: checked,
                              endDate: checked ? null : project.endDate
                            });
                          }}
                        />
                      </div>
                      
                      {!project.current && (
                        <Input
                          type="date"
                          value={project.endDate || ""}
                          onChange={(e) => {
                            editProject({
                              ...project,
                              endDate: e.target.value
                            });
                          }}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Project URL</Label>
                    <Input
                      placeholder="github.com/yourusername/project"
                      value={formatDisplayUrl(project.url || "")}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only add prefix when saving to data, not in the input display
                        const urlToSave = value && !value.startsWith('http') ? `https://${value}` : value;
                        editProject({
                          ...project,
                          url: urlToSave
                        });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: github.com/username/project or yoursite.com/demo
                    </p>
                    {project.url && validateURL(project.url) && (
                      <p className="text-xs text-green-600">
                        ✓ Will appear as: {formatURL(project.url)}
                      </p>
                    )}
                    {project.url && !validateURL(project.url) && (
                      <p className="text-xs text-red-500">
                        Please enter a valid URL (e.g., github.com/username/project)
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add new project form */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Add New Project</h3>
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Project Name</Label>
              <Input
                placeholder="E-commerce Website"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                placeholder="A full-stack e-commerce website with user authentication, product catalog, and payment processing."
                value={newProject.description}
                rows={3}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Technologies Used</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a technology (e.g., React)"
                  value={newProject.currentTech || ""}
                  onChange={(e) => {
                    // Store the current tech input in a temporary property
                    setNewProject({
                      ...newProject,
                      currentTech: e.target.value
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newProject.currentTech?.trim()) {
                      e.preventDefault();
                      const tech = newProject.currentTech.trim();
                      const techArray = [...ensureTechnologiesArray(newProject.technologies), tech];
                      setNewProject({
                        ...newProject,
                        technologies: techArray,
                        currentTech: ""
                      });
                    }
                  }}
                />
                <Button 
                  type="button"
                  onClick={() => {
                    if (newProject.currentTech?.trim()) {
                      const tech = newProject.currentTech.trim();
                      const techArray = [...ensureTechnologiesArray(newProject.technologies), tech];
                      setNewProject({
                        ...newProject,
                        technologies: techArray,
                        currentTech: ""
                      });
                    }
                  }}
                  disabled={!newProject.currentTech?.trim()}
                >
                  Add
                </Button>
              </div>
              
              {/* Display current technologies as tags */}
              <div className="flex flex-wrap gap-2 mt-2">
                {ensureTechnologiesArray(newProject.technologies).map((tech, idx) => (
                  <div key={idx} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full flex items-center">
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newTechArray = ensureTechnologiesArray(newProject.technologies).filter((_, i) => i !== idx);
                        setNewProject({
                          ...newProject,
                          technologies: newTechArray
                        });
                      }}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Current Project</Label>
                  <Switch 
                    checked={newProject.current} 
                    onCheckedChange={(checked) => {
                      setNewProject({
                        ...newProject, 
                        current: checked,
                        endDate: checked ? null : newProject.endDate
                      });
                    }}
                  />
                </div>
                
                {!newProject.current && (
                  <Input
                    type="date"
                    value={newProject.endDate || ""}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  />
                )}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Project URL</Label>
              <Input
                placeholder="github.com/yourusername/project"
                value={formatDisplayUrl(newProject.url || "")}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only add prefix when saving to data, not in the input display
                  const urlToSave = value && !value.startsWith('http') ? `https://${value}` : value;
                  setNewProject({ ...newProject, url: urlToSave });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Example: github.com/username/project or yoursite.com/demo
              </p>
              {newProject.url && validateURL(newProject.url) && (
                <p className="text-xs text-green-600">
                  ✓ Will appear as: {formatURL(newProject.url)}
                </p>
              )}
              {newProject.url && !validateURL(newProject.url) && (
                <p className="text-xs text-red-500">
                  Please enter a valid URL (e.g., github.com/username/project)
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              onClick={addProject}
              disabled={!newProject.name || !newProject.description || !newProject.startDate || newProject.technologies.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}