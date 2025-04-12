import { templates } from '../templates/config/templateConfig';
import { generateTemplatePreview } from '../templates/utils/previewGenerator';
import { ProfessionalTemplate } from '../templates/implementations/ProfessionalTemplate';
import { ModernTemplate } from '../templates/implementations/ModernTemplate';
import fs from 'fs/promises';
import path from 'path';

async function generatePreviews() {
  const templateInstances = {
    latex: new ProfessionalTemplate(),
    modern: new ModernTemplate()
  };

  for (const [id, template] of Object.entries(templates)) {
    try {
      console.log(`Generating preview for ${template.name}...`);
      const preview = await generateTemplatePreview(templateInstances[id]);
      
      // Convert base64 to buffer
      const base64Data = preview.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Save to public directory
      const outputPath = path.join(process.cwd(), 'public', template.preview);
      await fs.writeFile(outputPath, buffer);
      
      console.log(`Preview generated for ${template.name} at ${outputPath}`);
    } catch (error) {
      console.error(`Failed to generate preview for ${template.name}:`, error);
    }
  }
}

generatePreviews().catch(console.error); 