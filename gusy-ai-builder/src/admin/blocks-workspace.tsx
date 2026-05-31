import { useState } from 'react';
import { BLOCK_DRAG_MIME } from './builder-options';
import { TemplateThumb } from './components';
import { blockCategories, blockCategoryCount, filterBlockTemplates } from './workspace-model';
import type { GusyTemplate } from './types';

export function BlocksWorkspace(props: {
  templates: GusyTemplate[];
  focusedTemplateId: string;
  canGenerateAI: boolean;
  onFocus: (id: string) => void;
  onAdd: (template: GusyTemplate) => void;
  onGenerateSection: (type: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const categories = blockCategories(props.templates);
  const categoryIcons: Record<string, string> = {
    All: '*',
    Navigation: 'N',
    Hero: 'H',
    Content: 'C',
    Product: 'P',
    Conversion: 'V',
    Trust: 'T',
    Commerce: '$',
    Local: 'L',
    Support: '?',
    Media: 'M'
  };
  const filtered = filterBlockTemplates(props.templates, category, query);

  return (
    <section className="gusy-blocks-workspace">
      <div className="gusy-blocks-panel">
        <header className="gusy-blocks-header">
          <strong>Sections</strong>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search blocks..." />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button type="button" onClick={() => props.onGenerateSection('features')} disabled={!props.canGenerateAI}>AI Block</button>
        </header>
        <div className="gusy-blocks-content">
          <aside>
            {categories.map((item) => (
              <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>
                <i>{categoryIcons[item] ?? item.charAt(0)}</i>
                <span>{item}</span>
                <b>{blockCategoryCount(props.templates, item)}</b>
              </button>
            ))}
          </aside>
          <div className="gusy-block-grid">
            {filtered.map((template) => (
              <button
                key={template.id}
                type="button"
                aria-pressed={props.focusedTemplateId === template.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(BLOCK_DRAG_MIME, template.type);
                  event.dataTransfer.setData('text/plain', template.type);
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                onMouseEnter={() => props.onFocus(template.id)}
                onFocus={() => props.onFocus(template.id)}
                onClick={() => props.onAdd(template)}
              >
                <TemplateThumb type={template.section.type} />
                <span>{template.title}</span>
                <small>{template.category}</small>
                <i>+</i>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
