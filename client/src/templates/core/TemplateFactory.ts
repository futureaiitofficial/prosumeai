import { type ResumeTemplate, type TemplateType } from './types';

export class TemplateFactory {
  private static instance: TemplateFactory;
  private templates: Map<string, ResumeTemplate> = new Map();
  private templateConstructors: Map<string, new (...args: any[]) => ResumeTemplate> = new Map();

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): TemplateFactory {
    if (!TemplateFactory.instance) {
      TemplateFactory.instance = new TemplateFactory();
    }
    return TemplateFactory.instance;
  }

  public registerTemplateType(type: string, constructor: new (...args: any[]) => ResumeTemplate): void {
    this.templateConstructors.set(type, constructor);
  }

  public createTemplate(type: string): ResumeTemplate {
    const Constructor = this.templateConstructors.get(type);
    if (!Constructor) {
      throw new Error(`Template type '${type}' not registered`);
    }
    const template = new Constructor();
    this.templates.set(type, template);
    return template;
  }

  public getTemplate(type: string): ResumeTemplate | null {
    // If the template instance doesn't exist, create it
    if (!this.templates.has(type)) {
      try {
        if (this.hasTemplateType(type)) {
          return this.createTemplate(type);
        }
        return null;
      } catch (error) {
        console.error(`Error creating template type '${type}':`, error);
        return null;
      }
    }
    return this.templates.get(type) || null;
  }

  public getAllTemplates(): ResumeTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplatesByType(type: string): ResumeTemplate[] {
    return this.getAllTemplates().filter(template => template.metadata.id === type);
  }

  public removeTemplate(id: string): void {
    this.templates.delete(id);
  }

  public clearTemplates(): void {
    this.templates.clear();
  }

  public hasTemplateType(type: string): boolean {
    return this.templateConstructors.has(type);
  }

  public getRegisteredTypes(): string[] {
    return Array.from(this.templateConstructors.keys());
  }
} 