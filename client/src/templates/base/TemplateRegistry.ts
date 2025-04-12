import { BaseTemplate } from './ResumeTemplate';

class TemplateRegistry {
  private templates: Map<string, BaseTemplate> = new Map();

  register(id: string, template: BaseTemplate) {
    if (this.templates.has(id)) {
      throw new Error(`Template with id ${id} already exists`);
    }
    this.templates.set(id, template);
  }

  get(id: string): BaseTemplate | null {
    return this.templates.get(id) || null;
  }

  getAll(): BaseTemplate[] {
    return Array.from(this.templates.values());
  }

  clear() {
    this.templates.clear();
  }
}

export const templateRegistry = new TemplateRegistry();