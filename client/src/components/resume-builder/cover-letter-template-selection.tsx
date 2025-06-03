import React, { useEffect, useState, Component, type ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Info, Check, Star, Zap, Shield, Crown, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { coverLetterTemplateMetadata } from '@/templates/registerCoverLetterTemplates';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
          <span className="text-sm text-red-500 bg-white px-3 py-2 rounded-lg shadow-sm">
            Error rendering {this.props.templateId}: {this.state.error?.message}
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

interface CoverLetterTemplateSelectionProps {
  selectedTemplate: string;
  onChange: (template: string) => void;
}

export default function CoverLetterTemplateSelection({ selectedTemplate, onChange }: CoverLetterTemplateSelectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const { user } = useAuth();
  
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
        console.log("Cover letter template images loaded:", data.images?.length || 0);
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
        console.log("Active cover letter templates loaded:", {
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

  // Get available cover letter templates
  const coverLetterTemplateIds = Object.keys(coverLetterTemplateMetadata);

  // Find template preview images based on template ID
  const getTemplatePreviewUrl = (templateId: string, dbTemplate?: ActiveTemplate) => {
    // If we have a database template with a thumbnail, use that
    if (dbTemplate?.thumbnail) {
      console.log(`Using database thumbnail for ${templateId}: ${dbTemplate.thumbnail}`);
      return dbTemplate.thumbnail;
    }
    
    // Try to find a matching image by name pattern for cover letters
    const matchingImage = templateImages.images.find((img: TemplateImage) => 
      img.name.toLowerCase().includes(`cover`) && 
      (img.name.toLowerCase().includes(templateId.toLowerCase()) || 
       img.name.toLowerCase().includes(`template-${templateId.toLowerCase()}`))
    );
    
    if (matchingImage) {
      console.log(`Found matching cover letter image by name for ${templateId}: ${matchingImage.url}`);
      return matchingImage.url;
    }
    
    // Fallback to 1-based index for cover-letter-template-1, etc.
    const index = coverLetterTemplateIds.indexOf(templateId) + 1;
    const indexMatchingImage = templateImages.images.find((img: TemplateImage) => 
      img.name.includes(`cover`) && img.name.includes(`template-${index}`)
    );
    
    if (indexMatchingImage) {
      console.log(`Found matching cover letter image by index for ${templateId}: ${indexMatchingImage.url}`);
      return indexMatchingImage.url;
    }
    
    // Try generic cover letter images
    const genericCoverImage = templateImages.images.find((img: TemplateImage) => 
      img.name.toLowerCase().includes('cover-letter')
    );
    
    if (genericCoverImage) {
      return genericCoverImage.url;
    }
    
    // Default fallback
    return '/placeholder-image.png';
  };

  // Enhanced template data
  const enhanceTemplateData = (templateId: string, template: any, matchingDBTemplate?: ActiveTemplate) => {
    return {
      id: templateId,
      name: template?.name || templateId.charAt(0).toUpperCase() + templateId.slice(1).replace(/-/g, ' '),
      description: template?.description || `Professional ${templateId} template for cover letters`,
      previewImage: getTemplatePreviewUrl(templateId, matchingDBTemplate)
    };
  };

  // Get available templates dynamically
  const getAvailableTemplates = () => {
    return coverLetterTemplateIds.map(templateId => {
      const template = coverLetterTemplateMetadata[templateId as keyof typeof coverLetterTemplateMetadata];
      
      // Try to find a matching template in the active templates from DB
      const matchingDBTemplate = activeTemplates?.coverLetterTemplates?.find(
        dbTemplate => dbTemplate.name.toLowerCase() === templateId.toLowerCase() || 
                      dbTemplate.name.toLowerCase() === template?.name?.toLowerCase()
      );
      
      return enhanceTemplateData(templateId, template, matchingDBTemplate);
    });
  };

  // Get the final templates list
  const templates = getAvailableTemplates();

  console.log('Cover letter template IDs:', coverLetterTemplateIds);
  console.log('Available cover letter templates:', templates.length, templates.map(t => ({ id: t.id, name: t.name })));
  console.log('Current index:', currentIndex);
  console.log('Selected template:', selectedTemplate);

  // Simple navigation functions
  const goToPrevious = () => {
    console.log('Going to previous template, current:', currentIndex, 'total templates:', templates.length);
    const newIndex = currentIndex === 0 ? templates.length - 1 : currentIndex - 1;
    console.log('New index will be:', newIndex);
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    console.log('Going to next template, current:', currentIndex, 'total templates:', templates.length);
    const newIndex = currentIndex === templates.length - 1 ? 0 : currentIndex + 1;
    console.log('New index will be:', newIndex);
    setCurrentIndex(newIndex);
  };

  // Set current index based on selected template (only on initial load)
  useEffect(() => {
    if (templates.length === 0) return;
    const selectedIndex = templates.findIndex(template => template.id === selectedTemplate);
    if (selectedIndex !== -1) {
      console.log('Setting initial currentIndex based on selectedTemplate:', selectedIndex);
      setCurrentIndex(selectedIndex);
    }
  }, [selectedTemplate, templates.length]);

  // Simple drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Mouse down detected');
    setIsDragging(true);
    setDragStart(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const offset = e.clientX - dragStart;
    setDragOffset(offset);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    console.log('Mouse up, drag offset:', dragOffset);
    setIsDragging(false);
    
    // Determine if we should navigate based on drag distance
    const threshold = 50;
    if (Math.abs(dragOffset) > threshold) {
      console.log('Threshold exceeded, navigating...');
      if (dragOffset > 0) {
        console.log('Dragged right, going to previous');
        goToPrevious();
      } else {
        console.log('Dragged left, going to next');
        goToNext();
      }
    } else {
      console.log('Threshold not exceeded, no navigation');
    }
    
    setDragOffset(0);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('Touch start detected');
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const offset = e.touches[0].clientX - dragStart;
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    console.log('Touch end, drag offset:', dragOffset);
    setIsDragging(false);
    
    const threshold = 50;
    if (Math.abs(dragOffset) > threshold) {
      console.log('Touch threshold exceeded, navigating...');
      if (dragOffset > 0) {
        console.log('Swiped right, going to previous');
        goToPrevious();
      } else {
        console.log('Swiped left, going to next');
        goToNext();
      }
    } else {
      console.log('Touch threshold not exceeded, no navigation');
    }
    
    setDragOffset(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const currentTemplate = templates[currentIndex];
        if (currentTemplate) {
          onChange(currentTemplate.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, templates]);

  // Ensure current index is within bounds
  if (currentIndex >= templates.length) {
    console.log('Current index out of bounds, resetting to 0');
    setCurrentIndex(0);
    return null;
  }

  const currentTemplate = templates[currentIndex];

  console.log('Final cover letter template selection state:', {
    templatesCount: templates.length,
    currentIndex: currentIndex,
    currentTemplate: currentTemplate?.name,
    templateIds: templates.map(t => t.id)
  });

  if (isLoadingImages || isLoadingTemplates) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Cover Letter Templates</h3>
          <p className="text-sm text-gray-500">Preparing your professional templates...</p>
        </motion.div>
      </div>
    );
  }

  if (templates.length === 0) {
    console.log('No cover letter templates available, showing fallback');
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
          <Info className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Loading Templates...</h3>
        <p className="text-sm text-yellow-700 mb-6">
          Please wait while we load your cover letter templates.
        </p>
        <Button
          onClick={() => onChange('standard')}
          className="bg-yellow-600 hover:bg-yellow-700 text-white border-0"
        >
          Use Standard Template
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-gray-900 mb-6"
        >
          Select Your Cover Letter Template
        </motion.h2>
      </div>

      {/* Template Display */}
      <div className="relative max-w-4xl mx-auto">
        <div className="flex items-center justify-center">
          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('❌ Previous button clicked! Current state before:', { currentIndex, templatesLength: templates.length });
              goToPrevious();
              setTimeout(() => {
                console.log('❌ Previous button clicked! Current state after:', { currentIndex });
              }, 100);
            }}
            disabled={templates.length <= 1}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-10 border-2 ${
              templates.length <= 1 
                ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'border-indigo-300 text-indigo-600 hover:text-white hover:bg-indigo-500 hover:shadow-xl hover:scale-110'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Template Container */}
          <div className="w-full max-w-md mx-auto px-16">
            <div 
              className="relative cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: `translateX(${dragOffset}px)`,
                userSelect: 'none'
              }}
            >
              {/* Template Card */}
              <motion.div
                key={`${currentTemplate.id}-${currentIndex}`}
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-xl overflow-hidden border-4 border-indigo-400"
                onClick={() => {
                  console.log('Template clicked, selecting:', currentTemplate.id);
                  onChange(currentTemplate.id);
                }}
              >
                {/* Template Image - Increased aspect ratio */}
                <div className="relative aspect-[1/1.3] bg-gray-50">
                  {currentTemplate.previewImage ? (
                    <img 
                      src={currentTemplate.previewImage} 
                      alt={`${currentTemplate.name} template preview`}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        console.error('Image failed to load:', currentTemplate.previewImage);
                        e.currentTarget.src = '/placeholder-image.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100">
                      <div className="text-center py-6">
                        <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-lg border border-slate-200">
                          <Sparkles className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Template Preview</p>
                        <p className="text-slate-400 mt-1 text-xs">Coming Soon</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Template Name and Description */}
                <div className="text-center bg-white p-4">
                  <h3 className="font-semibold text-gray-900 text-base mb-1">
                    {currentTemplate.name}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {currentTemplate.description}
                  </p>
                  <p className="text-sm text-indigo-600">Template {currentIndex + 1} of {templates.length}</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('➡️ Next button clicked! Current state before:', { currentIndex, templatesLength: templates.length });
              goToNext();
              setTimeout(() => {
                console.log('➡️ Next button clicked! Current state after:', { currentIndex });
              }, 100);
            }}
            disabled={templates.length <= 1}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-10 border-2 ${
              templates.length <= 1 
                ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'border-indigo-300 text-indigo-600 hover:text-white hover:bg-indigo-500 hover:shadow-xl hover:scale-110'
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Use This Template Button */}
        <div className="text-center mt-6">
          <Button
            onClick={() => {
              console.log('Use Template button clicked for:', currentTemplate.id);
              onChange(currentTemplate.id);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-base px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            size="lg"
          >
            Use This Template: {currentTemplate.name}
          </Button>
        </div>

        {/* Template Indicators */}
        <div className="flex justify-center mt-4 space-x-2">
          {templates.map((template, index) => (
            <button
              key={`indicator-${template.id}-${index}`}
              onClick={() => {
                console.log('Indicator clicked, switching to index:', index, 'template:', template.name);
                setCurrentIndex(index);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-indigo-500 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Template Counter */}
        <div className="text-center mt-3">
          <p className="text-gray-500 text-sm">
            Template {currentIndex + 1} of {templates.length} - {currentTemplate.name}
          </p>
        </div>
      </div>
    </div>
  );
} 