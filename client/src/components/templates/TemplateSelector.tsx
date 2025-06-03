import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useTemplates } from '@/hooks/use-templates';
import { Loader2, CheckCircle, Lock } from 'lucide-react';
import { TemplateFactory } from '@/templates/core/TemplateFactory';
import { registerTemplates } from '@/templates/registerTemplates';
import { coverLetterTemplateMetadata } from '@/templates/registerCoverLetterTemplates';

type TemplateInfo = {
  id: string;
  name: string;
  description: string;
  preview: string;
};

type TemplateCategory = {
  id: string;
  name: string;
  templates: TemplateInfo[];
};

interface TemplateSelectorProps {
  type: 'resume' | 'cover-letter';
  onSelect: (templateId: string) => void;
  selectedTemplate?: string;
}

/**
 * Get resume templates dynamically from TemplateFactory
 */
const getResumeTemplates = (): TemplateInfo[] => {
  try {
    // Ensure templates are registered
    registerTemplates();
    
    // Get template factory instance
    const factory = TemplateFactory.getInstance();
    const registeredTypes = factory.getRegisteredTypes();
    
    return registeredTypes.map(templateId => {
      try {
        const template = factory.getTemplate(templateId);
        const metadata = template?.metadata;
        
        return {
          id: templateId,
          name: metadata?.name || templateId.charAt(0).toUpperCase() + templateId.slice(1).replace(/-/g, ' '),
          description: metadata?.description || `Professional ${templateId.replace(/-/g, ' ')} template`,
          preview: `/images/templates/preview-${templateId}.png`
        };
      } catch (error) {
        console.error(`Error getting template ${templateId}:`, error);
        return {
          id: templateId,
          name: templateId.charAt(0).toUpperCase() + templateId.slice(1).replace(/-/g, ' '),
          description: `Professional ${templateId.replace(/-/g, ' ')} template`,
          preview: `/images/templates/preview-${templateId}.png`
        };
      }
    });
  } catch (error) {
    console.error('Error getting resume templates:', error);
    return [];
  }
};

/**
 * Get cover letter templates dynamically from metadata
 */
const getCoverLetterTemplates = (): TemplateInfo[] => {
  return Object.entries(coverLetterTemplateMetadata).map(([templateId, metadata]) => ({
    id: templateId,
    name: metadata.name,
    description: metadata.description,
    preview: `/images/templates/preview-${templateId}-cover.png`
  }));
};

/**
 * Get template categories dynamically based on type
 */
const getTemplateCategories = (type: 'resume' | 'cover-letter'): TemplateCategory[] => {
  const templates = type === 'resume' ? getResumeTemplates() : getCoverLetterTemplates();
  
  return [
    {
      id: 'templates',
      name: 'Templates',
      templates
    }
  ];
};

export function TemplateSelector({ type, onSelect, selectedTemplate }: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState('templates');
  const { canUseTemplate, isLoading, error, availableTemplates } = useTemplates(type);
  
  // Get the right categories based on type
  const categories = getTemplateCategories(type);
  
  // Select the first available template if none is selected
  useEffect(() => {
    if (!selectedTemplate && !isLoading && availableTemplates.length > 0) {
      // Find first available template
      for (const category of categories) {
        const availableTemplate = category.templates.find(t => canUseTemplate(t.id));
        if (availableTemplate) {
          onSelect(availableTemplate.id);
          break;
        }
      }
    }
  }, [selectedTemplate, isLoading, availableTemplates, categories, canUseTemplate, onSelect]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-60 flex-col">
        <div className="text-red-500 mb-2">Failed to load templates</div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {type === 'resume' ? 'Resume Templates' : 'Cover Letter Templates'}
        </CardTitle>
        <CardDescription>
          Choose a template for your {type === 'resume' ? 'resume' : 'cover letter'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-4">
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map(category => (
            <TabsContent key={category.id} value={category.id} className="p-0 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.templates.map(template => {
                  const isAvailable = canUseTemplate(template.id);
                  const isSelected = selectedTemplate === template.id;
                  
                  return (
                    <div 
                      key={template.id}
                      className={`
                        relative rounded-md border overflow-hidden transition-all 
                        ${isSelected 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-gray-200 hover:border-gray-300'}
                        ${!isAvailable ? 'opacity-70' : ''}
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-2 left-2 bg-primary rounded-full p-1">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div className="h-40 bg-gray-100 w-full relative">
                        {template.preview ? (
                          <img 
                            src={template.preview} 
                            alt={template.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            Preview not available
                          </div>
                        )}
                        
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                            <div className="bg-white p-2 rounded-full">
                              <Lock className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3">
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                      
                      <div className="p-3 pt-0">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          className="w-full"
                          disabled={!isAvailable}
                          onClick={() => isAvailable && onSelect(template.id)}
                        >
                          {isSelected ? 'Selected' : isAvailable ? 'Select' : 'Not Available'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
} 