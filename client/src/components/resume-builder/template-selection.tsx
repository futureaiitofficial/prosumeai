import React, { useEffect, useState, Component, type ErrorInfo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Info, Lock } from 'lucide-react';
import { TemplateFactory } from '@/templates/core/TemplateFactory';
import { type TemplateType } from '@/templates/core/types';
import { registerTemplates } from '@/templates/registerTemplates';
import { type ResumeData } from '@/types/resume';
import { Badge } from '@/components/ui/badge';
import { useFeatureGuard } from '@/hooks/use-feature-access';
import { useAuth } from '@/hooks/use-auth';
import { isResumeTemplatePremium, handleTemplateSelection } from '@/lib/template-utils';
import { useQuery } from '@tanstack/react-query';

// Register templates immediately
registerTemplates();

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  templateId: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Template image interface
interface TemplateImage {
  name: string;
  url: string;
  size: number;
}

// Active template interface
interface ActiveTemplate {
  id: number;
  name: string;
  description: string;
  content: string;
  thumbnail: string;
  isDefault: boolean;
  isActive: boolean;
}

// API response interface
interface ActiveTemplatesResponse {
  resumeTemplates: ActiveTemplate[];
  coverLetterTemplates: ActiveTemplate[];
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error rendering template ${this.props.templateId}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <span className="text-sm text-red-500">
            Error rendering {this.props.templateId}: {this.state.error?.message}
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

interface TemplateSelectionProps {
  selectedTemplate: string;
  onChange: (template: string) => void;
}

export default function TemplateSelection({ selectedTemplate, onChange }: TemplateSelectionProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [factoryLoaded, setFactoryLoaded] = useState(false);
  const { user } = useAuth();
  
  // Check if user has access to premium templates - always true now
  const { hasAccess: hasPremiumAccess } = useFeatureGuard("resume_templates_premium", { showToast: false });

  // Fetch all template images from the server
  const { data: templateImages = { images: [] as TemplateImage[] }, isLoading: isLoadingImages } = useQuery({
    queryKey: ["/api/templates/images"],
    queryFn: async () => {
      try {
        const res = await fetch('/api/templates/images');
        if (!res.ok) {
          throw new Error('Failed to fetch template images');
        }
        const data = await res.json();
        console.log("Template preview images loaded:", data.images?.length || 0);
        return data;
      } catch (error) {
        console.error('Error fetching template images:', error);
        return { images: [] };
      }
    }
  });
  
  // Fetch active templates from the server
  const { data: activeTemplates, isLoading: isLoadingTemplates } = useQuery<ActiveTemplatesResponse>({
    queryKey: ["/api/templates/active"],
    queryFn: async () => {
      try {
        const res = await fetch('/api/templates/active');
        if (!res.ok) {
          throw new Error('Failed to fetch active templates');
        }
        const data = await res.json();
        console.log("Active templates loaded:", {
          resume: data.resumeTemplates?.length || 0,
          coverLetter: data.coverLetterTemplates?.length || 0
        });
        return data;
      } catch (error) {
        console.error('Error fetching active templates:', error);
        return { resumeTemplates: [], coverLetterTemplates: [] };
      }
    }
  });

  // Initialize on component mount
  useEffect(() => {
    setIsInitialized(true);
    setFactoryLoaded(true);
  }, []);

  // Get available templates from factory
  const factory = TemplateFactory.getInstance();
  const registeredTypes = factory.getRegisteredTypes();

  // Find template preview images based on template ID
  const getTemplatePreviewUrl = (templateId: string, dbTemplate?: ActiveTemplate) => {
    // If we have a database template with a thumbnail, use that
    if (dbTemplate?.thumbnail) {
      console.log(`Using database thumbnail for ${templateId}: ${dbTemplate.thumbnail}`);
      return dbTemplate.thumbnail;
    }
    
    // Try to find a matching image by name pattern
    const matchingImage = templateImages.images.find((img: TemplateImage) => 
      img.name.toLowerCase().includes(templateId.toLowerCase()) || 
      img.name.toLowerCase().includes(`template-${templateId.toLowerCase()}`)
    );
    
    if (matchingImage) {
      console.log(`Found matching image by name for ${templateId}: ${matchingImage.url}`);
      return matchingImage.url;
    }
    
    // Fallback to 1-based index for template-1, template-2 pattern
    const index = registeredTypes.indexOf(templateId) + 1;
    const indexMatchingImage = templateImages.images.find((img: TemplateImage) => 
      img.name.includes(`template-${index}`)
    );
    
    if (indexMatchingImage) {
      console.log(`Found matching image by index for ${templateId}: ${indexMatchingImage.url}`);
      return indexMatchingImage.url;
    }
    
    // Log all available images when no match is found
    console.log(`No matching image found for ${templateId}. Available images:`, 
      templateImages.images.map((img: TemplateImage) => img.name));
    
    // Default fallback
    return '/placeholder-image.png';
  };

  // Combine DB templates with registered templates
  const availableTemplates = registeredTypes.length > 0
    ? registeredTypes.map(type => {
        const template = factory.getTemplate(type);
        
        // Try to find a matching template in the active templates from DB
        const matchingDBTemplate = activeTemplates?.resumeTemplates?.find(
          dbTemplate => dbTemplate.name.toLowerCase() === type.toLowerCase() || 
                        dbTemplate.name.toLowerCase() === template?.metadata?.name?.toLowerCase()
        );
        
        return {
          id: type,
          name: template?.metadata?.name || type,
          description: template?.metadata?.description || '',
          isAtsOptimized: template?.metadata?.isAtsOptimized || false,
          isPremium: false, // All templates are free now
          previewImage: getTemplatePreviewUrl(type, matchingDBTemplate)
        };
      })
    : [
        {
          id: 'modern',
          name: 'Modern',
          description: 'A clean and modern template with a sidebar layout.',
          isAtsOptimized: true,
          isPremium: false,
          previewImage: '/placeholder-image.png'
        }
      ];

  // Filter templates to only show active ones if we have data from the server
  const filteredTemplates = activeTemplates?.resumeTemplates?.length 
    ? availableTemplates.filter(template => 
        activeTemplates.resumeTemplates.some(dbTemplate => 
          dbTemplate.name.toLowerCase() === template.name.toLowerCase() ||
          dbTemplate.name.toLowerCase() === template.id.toLowerCase()
        )
      )
    : availableTemplates;

  // Handler for template selection with access check - simplified as all templates are accessible
  const handleTemplateSelect = (templateId: string) => {
    // Direct selection without checks
    onChange(templateId);
  };

  if (!isInitialized || isLoadingImages || isLoadingTemplates) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4">
            <svg className="animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (filteredTemplates.length === 0) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
        <h3 className="text-sm font-medium text-yellow-800">No active templates found</h3>
        <p className="mt-1 text-sm text-yellow-700">
          Please use the Modern template for now, or contact an administrator to activate templates.
        </p>
        <Button
          className="mt-4"
          onClick={() => onChange('modern')}
          variant={selectedTemplate === 'modern' ? 'default' : 'outline'}
        >
          Use Modern Template
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => {
          // All templates are free now
          const isPremium = false;
          const isLocked = false;

          return (
            <div
              key={template.id}
              className={`border rounded-lg overflow-hidden cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg ${
                selectedTemplate === template.id
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              {/* Template Preview Image */}
              <div className="relative w-full bg-gray-50 border-b">
                {/* We'll use a 4:5 aspect ratio for the preview images */}
                <div className="relative w-full pt-[125%]">
                  {/* Image display with fallback */}
                  <div className="absolute inset-0 p-2">
                    {template.previewImage ? (
                      <img 
                        src={template.previewImage} 
                        alt={`${template.name} template preview`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('Image failed to load:', template.previewImage);
                          e.currentTarget.src = '/placeholder-image.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-sm text-gray-500">Preview unavailable</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-semibold text-sm text-gray-800 mb-1">{template.name}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
                  </div>
                  <div className="flex gap-1">
                    {template.isAtsOptimized && (
                      <div className="flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        <span className="text-[10px] font-medium">ATS</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Help Text */}
      {user?.isAdmin && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-700">
          <p className="font-medium mb-1">Admin Note: Template Preview Images</p>
          <p>To update template preview images, go to the Admin Dashboard &gt; Templates section.</p>
          <p className="mt-1">Each preview image should be a PNG file showing the template with sample data.</p>
          <p className="mt-1">Images uploaded: {templateImages.images?.length || 0}</p>
        </div>
      )}
    </div>
  );
}