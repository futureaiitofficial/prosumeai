import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, GraduationCap, ArrowUp, ArrowDown } from "lucide-react";

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
}

interface EducationFormProps {
  data: any;
  updateData: (data: any) => void;
}

export default function EducationForm({ data, updateData }: EducationFormProps) {
  // Ensure education array exists
  const education = data?.education || [];
  
  // Determine if the education was likely imported (from resume parsing)
  const isLikelyImported = data?.fullName && data?.email;

  const addEducation = () => {
    const newEducation = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: null,
      current: false,
      description: ""
    };
    
    updateData({ 
      education: [...education, newEducation] 
    });
  };

  const removeEducation = (id: string) => {
    updateData({
      education: education.filter((edu: Education) => edu.id !== id)
    });
  };

  const editEducation = (educationItem: Education) => {
    const updatedEducation = education.map((edu: Education) => 
      edu.id === educationItem.id ? educationItem : edu
    );
    
    updateData({ 
      education: updatedEducation 
    });
  };

  const moveEducation = (id: string, direction: 'up' | 'down') => {
    const index = education.findIndex((edu: Education) => edu.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === education.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedEducation = [...education];
    const temp = updatedEducation[index];
    updatedEducation[index] = updatedEducation[newIndex];
    updatedEducation[newIndex] = temp;
    
    updateData({ education: updatedEducation });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Education</h2>
        <Button 
          onClick={addEducation} 
          variant="outline" 
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Add your educational background, starting with the most recent. Include degrees, 
        certifications, and relevant coursework.
      </p>
      
      {/* Education parsing warning for imported resumes */}
      {isLikelyImported && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm mb-4">
          <p className="flex items-start">
            <svg className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>Education data often needs manual review:</strong> Our resume parser may have missed some of your education details. Please carefully review this section and add any missing institutions or degrees.
            </span>
          </p>
        </div>
      )}
      
      {/* Existing education */}
      {education.length > 0 ? (
        <div className="space-y-4">
          {education.map((edu: Education, index: number) => (
            <Card key={edu.id} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="absolute right-2 top-2 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveEducation(edu.id, 'up')}
                    disabled={index === 0}
                    className="h-8 w-8 text-gray-500"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveEducation(edu.id, 'down')}
                    disabled={index === education.length - 1}
                    className="h-8 w-8 text-gray-500"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEducation(edu.id)}
                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-start mb-4 mt-6">
                  <GraduationCap className="h-5 w-5 text-primary-600 mr-2 mt-1" />
                  <h3 className="font-medium text-lg">
                    {edu.degree || "Degree"} 
                    {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""} 
                    {edu.institution ? ` at ${edu.institution}` : ""}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Institution</Label>
                    <Input
                      placeholder="University of California"
                      value={edu.institution}
                      onChange={(e) => {
                        editEducation({
                          ...edu,
                          institution: e.target.value
                        });
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Degree</Label>
                    <Input
                      placeholder="Bachelor of Science"
                      value={edu.degree}
                      onChange={(e) => {
                        editEducation({
                          ...edu,
                          degree: e.target.value
                        });
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid gap-2 mt-4">
                  <Label>Field of Study</Label>
                  <Input
                    placeholder="Computer Science"
                    value={edu.fieldOfStudy}
                    onChange={(e) => {
                      editEducation({
                        ...edu,
                        fieldOfStudy: e.target.value
                      });
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={edu.startDate}
                      onChange={(e) => {
                        editEducation({
                          ...edu,
                          startDate: e.target.value
                        });
                      }}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Currently Studying</Label>
                      <Switch 
                        checked={edu.current} 
                        onCheckedChange={(checked) => {
                          editEducation({
                            ...edu,
                            current: checked,
                            endDate: checked ? null : edu.endDate
                          });
                        }}
                      />
                    </div>
                    
                    {!edu.current && (
                      <Input
                        type="date"
                        value={edu.endDate || ""}
                        onChange={(e) => {
                          editEducation({
                            ...edu,
                            endDate: e.target.value
                          });
                        }}
                      />
                    )}
                  </div>
                </div>
                
                <div className="grid gap-2 mt-4">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="Notable achievements, relevant coursework, extracurricular activities..."
                    value={edu.description}
                    rows={3}
                    onChange={(e) => {
                      editEducation({
                        ...edu,
                        description: e.target.value
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center p-8">
          <div className="flex flex-col items-center">
            <GraduationCap className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium mb-2">No education added yet</h3>
            <p className="text-gray-500 mb-4">
              Add your educational background to strengthen your resume.
            </p>
            <Button onClick={addEducation}>
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}