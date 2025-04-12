import { useEffect, useState } from 'react';
import { registerTemplates } from '@/templates/registerTemplates';
import { TemplateFactory } from '@/templates/core/TemplateFactory';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from 'lucide-react';

interface TemplateRendererProps {
  type: 'resume' | 'cover-letter';
  templateId: string;
  data: any;
}

export function TemplateRenderer({ type, templateId, data }: TemplateRendererProps) {
  const [templateFactory, setTemplateFactory] = useState<TemplateFactory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Initialize template factory
      const factory = registerTemplates();
      setTemplateFactory(factory);
    } catch (err) {
      console.error("Error registering templates:", err);
      setError("Failed to initialize templates");
    }
  }, []);

  if (error || !templateFactory) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || "Failed to load template engine"}
        </AlertDescription>
      </Alert>
    );
  }

  try {
    // Create the template component
    const Template = templateFactory.createTemplate(templateId);
    
    // Render the template with the provided data
    return <Template data={data} />;
  } catch (err) {
    console.error(`Error rendering template ${templateId}:`, err);
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Template Error</AlertTitle>
        <AlertDescription>
          Failed to render the selected template. Please try another template.
        </AlertDescription>
      </Alert>
    );
  }
} 