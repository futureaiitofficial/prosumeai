import React, { useEffect, useState } from 'react';
import { templates } from '../templates/config/templateConfig';
import { generateTemplatePreview } from '../templates/utils/previewGenerator';
import { ProfessionalTemplate } from '../templates/implementations/ProfessionalTemplate';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import DefaultLayout from '@/components/layouts/default-layout';
import { cn } from '@/lib/utils';
import { BaseTemplate } from '../templates/core/BaseTemplate';
import { ElegantDividerTemplate } from '@/templates/implementations/ElegantDividerTemplate';
import { MinimalistAtsTemplate } from '@/templates/implementations/MinimalistAtsTemplate';
export default function PreviewGenerator() {
  const [generatedPreviews, setGeneratedPreviews] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<Record<string, string>>({});
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const templateInstances: Record<string, BaseTemplate> = {
    professional: new ProfessionalTemplate(),
    'elegant-divider': new ElegantDividerTemplate(),
    'minimalist-ats': new MinimalistAtsTemplate()
  };

  const generateAllPreviews = async () => {
    setIsGenerating(true);
    setError(null);
    setGenerationStatus({});
    setDebugLog([]);
    const previews: Record<string, string> = {};

    addDebugLog('Starting preview generation for all templates');

    try {
      for (const [id, template] of Object.entries(templates)) {
        if (templateInstances[id]) {
          try {
            addDebugLog(`Starting generation for template: ${template.name}`);
            setGenerationStatus(prev => ({
              ...prev,
              [id]: 'Generating...'
            }));

            const preview = await generateTemplatePreview(templateInstances[id]);
            
            if (!preview) {
              throw new Error('Generated preview is empty');
            }

            addDebugLog(`Preview generated for ${template.name}, data URL length: ${preview.length}`);
            previews[id] = preview;
            
            setGenerationStatus(prev => ({
              ...prev,
              [id]: 'Generated successfully'
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to generate preview for ${template.name}:`, error);
            addDebugLog(`Error generating preview for ${template.name}: ${errorMessage}`);
            setGenerationStatus(prev => ({
              ...prev,
              [id]: `Failed to generate: ${errorMessage}`
            }));
          }
        }
      }
      setGeneratedPreviews(previews);
      addDebugLog('Completed preview generation for all templates');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to generate previews:', error);
      addDebugLog(`Fatal error during preview generation: ${errorMessage}`);
      setError(`Failed to generate previews: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPreview = (templateId: string) => {
    const preview = generatedPreviews[templateId];
    if (!preview) {
      addDebugLog(`Attempted to download preview for ${templateId} but no preview was found`);
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = preview;
      link.download = `${templateId}-preview.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addDebugLog(`Successfully initiated download for ${templateId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addDebugLog(`Error downloading preview for ${templateId}: ${errorMessage}`);
      console.error('Error downloading preview:', error);
    }
  };

  return (
    <DefaultLayout 
      pageTitle="Template Preview Generator" 
      pageDescription="Generate and download preview images for resume templates"
    >
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button 
            onClick={generateAllPreviews}
            disabled={isGenerating}
            className="w-48"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate All Previews'
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(templates).map(([id, template]) => (
            <div key={id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-xl font-semibold">{template.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="mt-2">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded",
                    {
                      'bg-blue-100 text-blue-700': generationStatus[id] === 'Generating...',
                      'bg-green-100 text-green-700': generationStatus[id]?.includes('Generated successfully'),
                      'bg-red-100 text-red-700': generationStatus[id]?.includes('Failed')
                    }
                  )}>
                    {generationStatus[id] || 'Not generated'}
                  </span>
                </div>
              </div>
              <div className="aspect-[210/297] relative bg-gray-100 border-b">
                {generatedPreviews[id] ? (
                  <>
                    <img
                      src={generatedPreviews[id]}
                      alt={`${template.name} preview`}
                      className="w-full h-full object-contain"
                      onError={() => {
                        addDebugLog(`Error loading preview image for ${template.name}`);
                        setError(`Failed to load preview image for ${template.name}`);
                      }}
                    />
                    <div className="absolute bottom-4 right-4">
                      <Button
                        onClick={() => downloadPreview(id)}
                        size="sm"
                      >
                        Download Preview
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-500">
                      {isGenerating ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </div>
                      ) : (
                        'No preview generated'
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Debug Log Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Log</h3>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-48 overflow-y-auto">
            {debugLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
} 