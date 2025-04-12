import { type ResumeData } from '@/types/resume';
import { type ExportFormat, type ResumeTemplate } from '../core/types';

export class ExportService {
  private static instance: ExportService;
  private exportHandlers: Map<ExportFormat, (template: ResumeTemplate, data: ResumeData) => Promise<Blob | string>>;

  private constructor() {
    this.exportHandlers = new Map();
    this.initializeHandlers();
  }

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  private initializeHandlers(): void {
    this.exportHandlers.set('pdf', async (template, data) => {
      return template.exportToPDF(data);
    });

    this.exportHandlers.set('latex', async (template, data) => {
      return template.exportToLaTeX(data);
    });

    this.exportHandlers.set('html', async (template, data) => {
      return template.exportToHTML(data);
    });

    this.exportHandlers.set('docx', async (template, data) => {
      return template.exportToDOCX(data);
    });
  }

  async exportResume(
    template: ResumeTemplate,
    data: ResumeData,
    format: ExportFormat
  ): Promise<Blob | string> {
    const handler = this.exportHandlers.get(format);
    if (!handler) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    try {
      // Validate data before export
      const validation = template.validate(data);
      if (!validation.isValid) {
        throw new Error(`Invalid resume data: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Perform export
      return await handler(template, data);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Failed to export resume: ${error.message}`);
    }
  }

  // Helper method to check if a format is supported
  isFormatSupported(format: string): format is ExportFormat {
    return this.exportHandlers.has(format as ExportFormat);
  }

  // Get list of supported formats
  getSupportedFormats(): ExportFormat[] {
    return Array.from(this.exportHandlers.keys());
  }

  // Register a custom export handler
  registerExportHandler(
    format: ExportFormat,
    handler: (template: ResumeTemplate, data: ResumeData) => Promise<Blob | string>
  ): void {
    if (this.exportHandlers.has(format)) {
      throw new Error(`Export handler for format ${format} is already registered`);
    }
    this.exportHandlers.set(format, handler);
  }

  // Remove a custom export handler
  removeExportHandler(format: ExportFormat): boolean {
    return this.exportHandlers.delete(format);
  }
} 