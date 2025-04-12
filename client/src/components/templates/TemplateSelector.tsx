import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, CheckCircle } from 'lucide-react';

type TemplateCategory = {
  id: string;
  name: string;
  templates: TemplateInfo[];
};

type TemplateInfo = {
  id: string;
  name: string;
  description: string;
  preview: string;
  premium: boolean;
};

interface TemplateSelectorProps {
  type: 'resume' | 'cover-letter';
  onSelect: (templateId: string) => void;
  selectedTemplate?: string;
}

// Resume template categories and templates
const resumeCategories: TemplateCategory[] = [
  {
    id: 'basic',
    name: 'Basic Templates',
    templates: [
      {
        id: 'professional',
        name: 'Professional',
        description: 'A clean, traditional resume template suitable for most industries',
        preview: '/images/templates/preview-professional.png',
        premium: false
      }
    ]
  },
  {
    id: 'premium',
    name: 'Premium Templates',
    templates: [
      {
        id: 'elegant-divider',
        name: 'Elegant Divider',
        description: 'Premium template with elegant dividers and modern layout',
        preview: '/images/templates/preview-elegant-divider.png',
        premium: true
      },
      {
        id: 'minimalist-ats',
        name: 'Minimalist ATS',
        description: 'ATS-friendly minimalist design with clean sections',
        preview: '/images/templates/preview-minimalist-ats.png',
        premium: true
      }
    ]
  }
];

// Cover letter template categories and templates
const coverLetterCategories: TemplateCategory[] = [
  {
    id: 'basic',
    name: 'Basic Templates',
    templates: [
      {
        id: 'standard',
        name: 'Standard',
        description: 'Traditional cover letter format suitable for formal applications',
        preview: '/images/templates/preview-standard-cover.png',
        premium: false
      }
    ]
  },
  {
    id: 'premium',
    name: 'Premium Templates',
    templates: [
      {
        id: 'modern',
        name: 'Modern',
        description: 'Modern design with contemporary styling for creative roles',
        preview: '/images/templates/preview-modern-cover.png',
        premium: true
      }
    ]
  }
];

export function TemplateSelector({ type, onSelect, selectedTemplate }: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState('basic');
  const { canUseTemplate, isLoading, error, availableTemplates } = useTemplates(type);
  
  // Get the right categories based on type
  const categories = type === 'resume' ? resumeCategories : coverLetterCategories;
  
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
                      {template.premium && (
                        <Badge 
                          variant="default" 
                          className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-500"
                        >
                          Premium
                        </Badge>
                      )}
                      
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
                          {isSelected ? 'Selected' : isAvailable ? 'Select' : 'Upgrade to Access'}
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
      {!availableTemplates.some(t => t.includes('premium')) && (
        <CardFooter className="bg-amber-50 border-t border-amber-100">
          <div className="text-sm text-amber-800">
            <strong>Need more options?</strong> Upgrade your plan to access premium templates.
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 