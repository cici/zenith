import Ajv from "ajv";
import dashboardTemplateSchema from "../types/dashboardTemplate.schema.json" assert { type: "json" };
import templates from "../data/dashboard-templates.json" assert { type: "json" };

// Explicit type for DashboardTemplate matching the schema
export interface DashboardTemplate {
  id: string;
  name: string;
  dashboardType: string;
  description?: string;
  layout: {
    breakpoints: Record<string, number>;
    items: Array<{
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      minW?: number;
      maxW?: number;
      minH?: number;
      maxH?: number;
      static?: boolean;
    }>;
  };
  widgets: Array<{
    id: string;
    type: string;
    config?: Record<string, any>;
  }>;
  customization?: {
    allowWidgetAdd?: boolean;
    allowWidgetRemove?: boolean;
    allowWidgetMove?: boolean;
    allowWidgetResize?: boolean;
    allowLayoutChange?: boolean;
    allowedWidgetTypes?: string[];
  };
  // version?: string; // For future versioning
  // baseTemplateId?: string; // For future inheritance
}

class TemplateService {
  private static instance: TemplateService;
  private ajv: Ajv;
  private validateFn: (data: unknown) => boolean;
  private templates: DashboardTemplate[];

  private constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.validateFn = this.ajv.compile(dashboardTemplateSchema);
    this.templates = templates as DashboardTemplate[];
    // Validate all templates on load
    for (const t of this.templates) {
      if (!this.validateFn(t)) {
        throw new Error(
          `Invalid dashboard template: ${(t as DashboardTemplate).id}\n${JSON.stringify(this.ajv.errors, null, 2)}`
        );
      }
    }
  }

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  public getAllTemplates(): DashboardTemplate[] {
    return this.templates;
  }

  public getTemplateById(id: string): DashboardTemplate {
    const found = this.templates.find((t) => t.id === id);
    if (!found) throw new Error(`Template with id '${id}' not found.`);
    return found;
  }

  public getTemplatesByType(type: string): DashboardTemplate[] {
    return this.templates.filter((t) => t.dashboardType === type);
  }

  public validateTemplate(template: unknown): boolean {
    return this.validateFn(template);
  }

  public getValidationErrors(): any {
    return this.ajv.errors;
  }
}

const templateService = TemplateService.getInstance();
export default templateService; 