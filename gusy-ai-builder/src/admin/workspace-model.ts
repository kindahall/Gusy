import type { GusyTemplate } from './types';

export function blockCategories(templates: GusyTemplate[]): string[] {
  return ['All', ...Array.from(new Set(templates.map((template) => template.category)))];
}

export function blockCategoryCount(templates: GusyTemplate[], category: string): number {
  return category === 'All'
    ? templates.length
    : templates.filter((template) => template.category === category).length;
}

export function filterBlockTemplates(templates: GusyTemplate[], category: string, query: string): GusyTemplate[] {
  const cleanQuery = query.trim().toLowerCase();

  return templates.filter((template) => {
    const matchesCategory = category === 'All' || template.category === category;
    if (!matchesCategory) return false;
    if (!cleanQuery) return true;

    const haystack = `${template.title} ${template.category} ${template.type} ${template.intent}`.toLowerCase();
    return haystack.includes(cleanQuery);
  });
}
