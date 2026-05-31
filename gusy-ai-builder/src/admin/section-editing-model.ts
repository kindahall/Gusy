import { cloneSection } from './schema';
import type { GusyBlueprint, GusyItem, GusySection } from './types';

export function patchBlueprintSection(
  blueprint: GusyBlueprint,
  sectionId: string,
  patch: Partial<GusySection>
): GusyBlueprint {
  return {
    ...blueprint,
    page: {
      ...blueprint.page,
      sections: blueprint.page.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      )
    }
  };
}

export function patchBlueprintSectionSettings(
  blueprint: GusyBlueprint,
  sectionId: string,
  patch: Partial<GusySection['settings']>
): GusyBlueprint {
  return {
    ...blueprint,
    page: {
      ...blueprint.page,
      sections: blueprint.page.sections.map((section) =>
        section.id === sectionId ? { ...section, settings: { ...section.settings, ...patch } } : section
      )
    }
  };
}

export function patchBlueprintSectionItem(
  blueprint: GusyBlueprint,
  sectionId: string,
  index: number,
  patch: Partial<GusyItem>
): GusyBlueprint {
  return {
    ...blueprint,
    page: {
      ...blueprint.page,
      sections: blueprint.page.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
        };
      })
    }
  };
}

export function addBlueprintSectionItem(blueprint: GusyBlueprint, sectionId: string): GusyBlueprint {
  const newItemFor = (section: GusySection): GusyItem => {
    if (section.type === 'header') {
      return { label: 'Link', title: 'New link', body: '#section' };
    }

    if (section.type === 'faq') {
      return { label: 'Question', title: 'New question', body: 'Add a helpful answer.' };
    }

    if (section.type === 'hero') {
      return { label: 'Proof', title: 'New proof point', body: '' };
    }

    if (section.type === 'pricing') {
      return { label: 'From EUR99', title: 'New offer', body: 'Describe what is included.' };
    }

    if (section.type === 'testimonials') {
      return { label: 'Client context', title: '"Add a credible customer quote."', body: 'Customer name' };
    }

    if (section.type === 'stats' || section.type === 'metrics') {
      return { label: '0', title: 'New metric', body: 'Explain why this number matters.' };
    }

    if (section.type === 'logos') {
      return { label: 'Logo', title: 'New partner', body: '' };
    }

    if (section.type === 'comparison') {
      return { label: 'Gusy', title: 'New comparison point', body: 'Explain the difference clearly.' };
    }

    if (section.type === 'footer') {
      return { label: 'Links', title: 'New column', body: 'Add useful footer links or contact details.' };
    }

    const number = String(section.items.length + 1).padStart(2, '0');
    return { label: number, title: 'New item', body: 'Add a concrete benefit.' };
  };

  return {
    ...blueprint,
    page: {
      ...blueprint.page,
      sections: blueprint.page.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...section.items,
                newItemFor(section)
              ]
            }
          : section
      )
    }
  };
}

export function removeBlueprintSectionItem(blueprint: GusyBlueprint, sectionId: string, index: number): GusyBlueprint {
  return {
    ...blueprint,
    page: {
      ...blueprint.page,
      sections: blueprint.page.sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.filter((_, itemIndex) => itemIndex !== index) }
          : section
      )
    }
  };
}

export function duplicateBlueprintSectionItem(blueprint: GusyBlueprint, sectionId: string, index: number): GusyBlueprint {
  return {
    ...blueprint,
    page: {
      ...blueprint.page,
      sections: blueprint.page.sections.map((section) => {
        if (section.id !== sectionId || index < 0 || index >= section.items.length) return section;
        const source = section.items[index];
        const copy = { ...source, image: source.image ? { ...source.image } : undefined };
        const items = [...section.items];
        items.splice(index + 1, 0, copy);
        return { ...section, items };
      })
    }
  };
}

export function moveBlueprintSectionItem(
  blueprint: GusyBlueprint,
  sectionId: string,
  index: number,
  direction: -1 | 1
): GusyBlueprint {
  return {
    ...blueprint,
    page: {
      ...blueprint.page,
      sections: blueprint.page.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || index >= section.items.length || nextIndex >= section.items.length) {
          return section;
        }
        const items = [...section.items];
        const [item] = items.splice(index, 1);
        items.splice(nextIndex, 0, item);
        return { ...section, items };
      })
    }
  };
}

export function duplicateBlueprintSection(
  blueprint: GusyBlueprint,
  sectionId: string,
  nextId: string
): { blueprint: GusyBlueprint; duplicatedId: string | null } {
  const source = blueprint.page.sections.find((section) => section.id === sectionId);
  if (!source) return { blueprint, duplicatedId: null };

  const copy = cloneSection(source);
  copy.id = nextId;
  const sourceIndex = blueprint.page.sections.findIndex((section) => section.id === sectionId);
  const sections = [...blueprint.page.sections];
  sections.splice(sourceIndex + 1, 0, copy);

  return {
    blueprint: {
      ...blueprint,
      page: {
        ...blueprint.page,
        sections
      }
    },
    duplicatedId: copy.id
  };
}

export function removeBlueprintSection(
  blueprint: GusyBlueprint,
  sectionId: string
): { blueprint: GusyBlueprint; nextSelectedId: string } {
  const sections = blueprint.page.sections.filter((section) => section.id !== sectionId);

  return {
    blueprint: {
      ...blueprint,
      page: {
        ...blueprint.page,
        sections
      }
    },
    nextSelectedId: sections[0]?.id ?? ''
  };
}
