import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  GraduationCap, 
  Award, 
  Code, 
  FileText, 
  GripVertical,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Section types and their corresponding icons
const sectionIcons = {
  summary: <FileText className="h-5 w-5" />,
  workExperience: <Briefcase className="h-5 w-5" />,
  education: <GraduationCap className="h-5 w-5" />,
  skills: <FileText className="h-5 w-5" />,
  projects: <Code className="h-5 w-5" />,
  certifications: <Award className="h-5 w-5" />
};

// Section names for display
const sectionNames = {
  summary: "Professional Summary",
  workExperience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications"
};

// Default section order
const defaultSectionOrder = [
  "summary", 
  "workExperience", 
  "education", 
  "skills", 
  "projects", 
  "certifications"
];

interface SectionReorderProps {
  sectionOrder: string[];
  updateSectionOrder: (newOrder: string[]) => void;
}

export default function SectionReorder({ sectionOrder, updateSectionOrder }: SectionReorderProps) {
  const { toast } = useToast();
  
  // Initialize with sectionOrder or default if it's undefined or empty
  const [sections, setSections] = useState<string[]>(() => {
    // Check if sectionOrder is an array and has elements
    if (Array.isArray(sectionOrder) && sectionOrder.length > 0) {
      return sectionOrder;
    }
    // Otherwise use default
    return defaultSectionOrder;
  });

  // Handle drag end event
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Clone the current sections array
    const newSections = [...sections];
    
    // Remove the dragged item from its original position
    const [movedItem] = newSections.splice(source.index, 1);
    
    // Insert the item at the new position
    newSections.splice(destination.index, 0, movedItem);
    
    // Update the local state
    setSections(newSections);
    
    // Update the parent component
    updateSectionOrder(newSections);
    
    toast({
      title: "Section order updated",
      description: "Your resume sections have been reordered.",
    });
  };

  // Reset to default order
  const resetToDefault = () => {
    setSections([...defaultSectionOrder]);
    updateSectionOrder([...defaultSectionOrder]);
    
    toast({
      title: "Default order restored",
      description: "Your resume sections have been reset to the default order.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Arrange Resume Sections</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetToDefault}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Drag and drop sections to customize the order of your resume. The sections will appear in this order in your resume.
      </p>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {sections.map((sectionId, index) => (
                <Draggable
                  key={sectionId}
                  draggableId={sectionId}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="mb-2"
                    >
                      <Card className="border hover:shadow transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-primary-500">
                                {sectionIcons[sectionId as keyof typeof sectionIcons]}
                              </div>
                              <span className="font-medium">
                                {sectionNames[sectionId as keyof typeof sectionNames]}
                              </span>
                            </div>
                            <div 
                              {...provided.dragHandleProps}
                              className="cursor-move text-gray-400 hover:text-gray-600"
                            >
                              <GripVertical className="h-5 w-5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-4">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          <strong>Pro Tip:</strong> Consider putting your strongest and most relevant sections higher in your resume. For technical roles, your skills and projects might be more important than education.
        </p>
      </div>
    </div>
  );
} 