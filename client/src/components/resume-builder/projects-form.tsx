import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Code } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate: string | null;
  current: boolean;
  url: string | null;
}

interface ProjectsFormProps {
  data: any;
  updateData: (data: any) => void;
}

export default function ProjectsForm({ data, updateData }: ProjectsFormProps) {
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

  // Ensure projects array exists
  const projects = data?.projects || [];

  const addProject = () => {
    const project = {
      ...newProject,
      id: Date.now().toString()
    };
    
    updateData({ 
      projects: [...projects, project] 
    });
    
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
    updateData({
      projects: projects.filter((project: Project) => project.id !== id)
    });
  };

  const editProject = (project: Project) => {
    const updatedProjects = projects.map((p: Project) => 
      p.id === project.id ? project : p
    );
    
    updateData({ 
      projects: updatedProjects 
    });
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
      {projects.length > 0 && (
        <div className="space-y-4 mb-6">
          {projects.map((project: Project) => (
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
                    <Label>Technologies Used (comma separated)</Label>
                    <Input
                      value={project.technologies.join(", ")}
                      onChange={(e) => {
                        const techArray = e.target.value.split(",").map(tech => tech.trim()).filter(Boolean);
                        editProject({
                          ...project,
                          technologies: techArray
                        });
                      }}
                    />
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
                      placeholder="https://github.com/yourusername/project"
                      value={project.url || ""}
                      onChange={(e) => {
                        editProject({
                          ...project,
                          url: e.target.value
                        });
                      }}
                    />
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
              <Label>Technologies Used (comma separated)</Label>
              <Input
                placeholder="React, Node.js, Express, MongoDB"
                value={newProject.technologies.join(", ")}
                onChange={(e) => {
                  const techArray = e.target.value.split(",").map(tech => tech.trim()).filter(Boolean);
                  setNewProject({ ...newProject, technologies: techArray });
                }}
              />
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
                placeholder="https://github.com/yourusername/project"
                value={newProject.url || ""}
                onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
              />
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