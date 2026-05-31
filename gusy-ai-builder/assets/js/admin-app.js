(function (wp, settings) {
  if (!wp || !wp.element || !wp.apiFetch || !settings) {
    return;
  }

  const h = wp.element.createElement;
  const render = wp.element.render;
  const useEffect = wp.element.useEffect;
  const useMemo = wp.element.useMemo;
  const useState = wp.element.useState;
  const apiFetch = wp.apiFetch;
  const STORAGE_KEY = 'gusy.builder.session.v1';
  const DEFAULT_PROMPT = 'Create a landing page for a law firm in Lyon specializing in business law. Premium, clean, modern style. Sections: hero, expertise, proof, testimonials, pricing, FAQ, form.';

  if (settings.nonce && apiFetch.createNonceMiddleware) {
    apiFetch.use(apiFetch.createNonceMiddleware(settings.nonce));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function initialBlueprint() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {}

    return {
      schemaVersion: '1.0',
      page: {
        title: 'Landing page Gusy',
        slug: 'landing-page-gusy',
        language: 'en',
        seo: {
          metaTitle: 'Landing page Gusy',
          metaDescription: 'Premium page generated with Gusy AI Builder.'
        },
        designSystem: settings.brandKit || {},
        sections: (settings.templates || []).slice(0, 6).map(function (template, index) {
          const section = clone(template.section);
          section.id = 'gusy-local-' + (index + 1);
          return section;
        })
      }
    };
  }

  function App() {
    const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
    const [blueprint, setBlueprint] = useState(initialBlueprint);
    const [selectedId, setSelectedId] = useState(function () {
      return blueprint.page.sections[0] ? blueprint.page.sections[0].id : '';
    });
    const [device, setDevice] = useState('desktop');
    const [leftTab, setLeftTab] = useState('layers');
    const [inspectorTab, setInspectorTab] = useState('content');
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [aiOpen, setAiOpen] = useState(true);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState('Ready');
    const [postId, setPostId] = useState(null);
    const [versions, setVersions] = useState([]);
    const [dragIndex, setDragIndex] = useState(null);
    const sections = blueprint.page.sections || [];
    const selected = useMemo(function () {
      return sections.find(function (section) { return section.id === selectedId; }) || sections[0];
    }, [sections, selectedId]);

    useEffect(function () {
      function onKeyDown(event) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          setPaletteOpen(function (open) { return !open; });
        }
      }

      window.addEventListener('keydown', onKeyDown);
      return function () { window.removeEventListener('keydown', onKeyDown); };
    }, []);

    useEffect(function () {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));
      setStatus('Saved locally');
    }, [blueprint]);

    function updateBlueprint(mutator) {
      setVersions(function (current) {
        return [blueprint].concat(current).slice(0, 12);
      });
      setBlueprint(function (current) {
        const next = clone(current);
        mutator(next);
        return next;
      });
    }

    function updateSelected(patch) {
      if (!selected) {
        return;
      }
      updateBlueprint(function (draft) {
        draft.page.sections = draft.page.sections.map(function (section) {
          return section.id === selected.id ? Object.assign({}, section, patch) : section;
        });
      });
    }

    function updateSelectedSettings(key, value) {
      if (!selected) {
        return;
      }
      updateBlueprint(function (draft) {
        draft.page.sections = draft.page.sections.map(function (section) {
          if (section.id !== selected.id) {
            return section;
          }
          return Object.assign({}, section, {
            settings: Object.assign({}, section.settings, { [key]: value })
          });
        });
      });
    }

    function generatePage() {
      setBusy(true);
      setStatus('Generating');
      apiFetch({
        path: '/gusy/v1/page/generate',
        method: 'POST',
        data: { prompt: prompt, brandKit: blueprint.page.designSystem }
      }).then(function (response) {
        setVersions(function (current) { return [blueprint].concat(current).slice(0, 12); });
        setBlueprint(response.blueprint);
        setSelectedId(response.blueprint.page.sections[0] ? response.blueprint.page.sections[0].id : '');
        setStatus('Page generated');
      }).catch(function (error) {
        setStatus(error && error.message ? error.message : 'Generation failed');
      }).finally(function () {
        setBusy(false);
      });
    }

    function savePage(nextStatus) {
      setBusy(true);
      setStatus(nextStatus === 'publish' ? 'Publishing' : 'Saving');
      apiFetch({
        path: '/gusy/v1/page/save',
        method: 'POST',
        data: { blueprint: blueprint, postId: postId, status: nextStatus }
      }).then(function (response) {
        setPostId(response.postId);
        setStatus(response.status === 'publish' ? 'Published' : 'Draft saved');
        if (response.editLink) {
          window.localStorage.setItem('gusy.lastEditLink', response.editLink);
        }
      }).catch(function (error) {
        setStatus(error && error.message ? error.message : 'Save failed');
      }).finally(function () {
        setBusy(false);
      });
    }

    function transformSelected(instruction) {
      if (!selected) {
        return;
      }
      setBusy(true);
      setStatus('Targeted edit');
      apiFetch({
        path: '/gusy/v1/block/transform',
        method: 'POST',
        data: { section: selected, instruction: instruction }
      }).then(function (response) {
        updateBlueprint(function (draft) {
          draft.page.sections = draft.page.sections.map(function (section) {
            return section.id === selected.id ? response.section : section;
          });
        });
        setStatus('Section updated');
      }).catch(function (error) {
        setStatus(error && error.message ? error.message : 'Edit failed');
      }).finally(function () {
        setBusy(false);
      });
    }

    function addTemplate(template) {
      const section = clone(template.section);
      section.id = 'gusy-' + template.id + '-' + Date.now();
      updateBlueprint(function (draft) {
        draft.page.sections.push(section);
      });
      setSelectedId(section.id);
      setStatus('Section added');
    }

    function duplicateSelected() {
      if (!selected) {
        return;
      }
      const copy = clone(selected);
      copy.id = selected.id + '-copy-' + Date.now();
      updateBlueprint(function (draft) {
        const index = draft.page.sections.findIndex(function (section) { return section.id === selected.id; });
        draft.page.sections.splice(index + 1, 0, copy);
      });
      setSelectedId(copy.id);
    }

    function removeSelected() {
      if (!selected || sections.length <= 1) {
        return;
      }
      updateBlueprint(function (draft) {
        draft.page.sections = draft.page.sections.filter(function (section) {
          return section.id !== selected.id;
        });
      });
      const next = sections.find(function (section) { return section.id !== selected.id; });
      setSelectedId(next ? next.id : '');
    }

    function moveSection(from, to) {
      updateBlueprint(function (draft) {
        const next = draft.page.sections.slice();
        const moved = next.splice(from, 1)[0];
        next.splice(to, 0, moved);
        draft.page.sections = next;
      });
    }

    function restoreVersion() {
      setVersions(function (current) {
        const latest = current[0];
        if (latest) {
          setBlueprint(latest);
          setStatus('Version restored');
        }
        return current.slice(1);
      });
    }

    const commands = [
      ['Generate page', generatePage],
      ['Make section more premium', function () { transformSelected('Make this section more premium'); }],
      ['Turn into bento', function () { transformSelected('Turn this section into a bento grid'); }],
      ['Optimize mobile', function () { transformSelected('Optimize this section for mobile'); }],
      ['Restore previous version', restoreVersion],
      ['Duplicate section', duplicateSelected],
      ['Delete section', removeSelected],
      ['Save draft', function () { savePage('draft'); }]
    ];

    return h('div', { className: 'gusy-admin', 'data-device': device },
      h(Topbar, {
        title: blueprint.page.title,
        status: status,
        busy: busy,
        device: device,
        canPublish: settings.canPublish,
        setDevice: setDevice,
        onOpenPalette: function () { setPaletteOpen(true); },
        onSave: function () { savePage('draft'); },
        onPublish: function () { savePage('publish'); }
      }),
      h('main', { className: 'gusy-workspace' },
        h('aside', { className: 'gusy-sidebar' },
          h(TabRow, {
            value: leftTab,
            options: [['layers', 'Layers'], ['sections', 'Sections'], ['templates', 'Templates'], ['brand', 'Brand']],
            onChange: setLeftTab
          }),
          leftTab === 'layers' && h(LayerList, {
            sections: sections,
            selectedId: selected ? selected.id : '',
            dragIndex: dragIndex,
            setDragIndex: setDragIndex,
            onSelect: setSelectedId,
            onMove: moveSection
          }),
          leftTab === 'sections' && h(TemplateList, { templates: settings.templates || [], compact: true, onAdd: addTemplate }),
          leftTab === 'templates' && h(TemplateList, { templates: settings.templates || [], onAdd: addTemplate }),
          leftTab === 'brand' && h(BrandPanel, { blueprint: blueprint, updateBlueprint: updateBlueprint })
        ),
        h('section', { className: 'gusy-stage' },
          h(PromptPanel, { prompt: prompt, setPrompt: setPrompt, onGenerate: generatePage, busy: busy }),
          h(Canvas, { blueprint: blueprint, selectedId: selected ? selected.id : '', device: device, onSelect: setSelectedId })
        ),
        h('aside', { className: 'gusy-inspector' },
          h(TabRow, {
            value: inspectorTab,
            options: [['content', 'Content'], ['style', 'Style'], ['layout', 'Layout'], ['responsive', 'Responsive'], ['seo', 'SEO']],
            onChange: setInspectorTab
          }),
          h(Inspector, {
            tab: inspectorTab,
            section: selected,
            blueprint: blueprint,
            updateSelected: updateSelected,
            updateSelectedSettings: updateSelectedSettings,
            updateBlueprint: updateBlueprint,
            onDuplicate: duplicateSelected,
            onRemove: removeSelected
          })
        )
      ),
      aiOpen && h(AIDrawer, {
        selected: selected,
        onGenerate: generatePage,
        onTransform: transformSelected,
        onClose: function () { setAiOpen(false); }
      }),
      !aiOpen && h('button', { className: 'gusy-ai-reopen', type: 'button', onClick: function () { setAiOpen(true); } }, 'AI'),
      paletteOpen && h(CommandPalette, {
        commands: commands,
        onClose: function () { setPaletteOpen(false); }
      })
    );
  }

  function Topbar(props) {
    return h('header', { className: 'gusy-topbar' },
      h('div', { className: 'gusy-brand' },
        h('span', null, 'G'),
        h('div', null, h('strong', null, 'Gusy'), h('small', null, props.title))
      ),
      h('div', { className: 'gusy-device-switch' },
        ['desktop', 'tablet', 'mobile'].map(function (device) {
          return h('button', {
            key: device,
            type: 'button',
            'aria-pressed': props.device === device,
            onClick: function () { props.setDevice(device); }
          }, device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : 'Mobile');
        })
      ),
      h('div', { className: 'gusy-top-actions' },
        h('span', { className: 'gusy-status' }, props.busy ? 'Processing' : props.status),
        h('button', { type: 'button', onClick: props.onOpenPalette }, '⌘K'),
        h('button', { type: 'button', onClick: props.onSave }, 'Draft'),
        h('button', { type: 'button', className: 'is-primary', onClick: props.onPublish, disabled: !props.canPublish }, 'Publish')
      )
    );
  }

  function TabRow(props) {
    return h('div', { className: 'gusy-tabs' },
      props.options.map(function (option) {
        return h('button', {
          key: option[0],
          type: 'button',
          'aria-pressed': props.value === option[0],
          onClick: function () { props.onChange(option[0]); }
        }, option[1]);
      })
    );
  }

  function PromptPanel(props) {
    return h('section', { className: 'gusy-prompt' },
      h('textarea', {
        value: props.prompt,
        onChange: function (event) { props.setPrompt(event.target.value); }
      }),
      h('button', { type: 'button', onClick: props.onGenerate, disabled: props.busy }, 'Generate')
    );
  }

  function Canvas(props) {
    return h('div', { className: 'gusy-canvas-wrap is-' + props.device },
      h('div', { className: 'gusy-canvas' },
        props.blueprint.page.sections.map(function (section) {
          return h('button', {
            type: 'button',
            key: section.id,
            className: 'gusy-canvas-section gusy-preview-' + section.type + (props.selectedId === section.id ? ' is-selected' : ''),
            onClick: function () { props.onSelect(section.id); }
          },
            h('span', { className: 'gusy-section-tag' }, section.label),
            h('p', null, section.kicker),
            h('h2', null, section.title),
            h('span', null, section.body),
            section.items && section.items.length ? h('div', { className: 'gusy-preview-grid' },
              section.items.slice(0, 4).map(function (item) {
                return h('i', { key: section.id + item.title },
                  h('strong', null, item.label),
                  h('b', null, item.title)
                );
              })
            ) : null
          );
        })
      )
    );
  }

  function LayerList(props) {
    return h('div', { className: 'gusy-layer-list' },
      props.sections.map(function (section, index) {
        return h('button', {
          key: section.id,
          type: 'button',
          draggable: true,
          className: props.selectedId === section.id ? 'is-selected' : '',
          onClick: function () { props.onSelect(section.id); },
          onDragStart: function () { props.setDragIndex(index); },
          onDragOver: function (event) { event.preventDefault(); },
          onDrop: function () {
            if (props.dragIndex !== null && props.dragIndex !== index) {
              props.onMove(props.dragIndex, index);
            }
            props.setDragIndex(null);
          }
        }, h('span', null, index + 1), h('strong', null, section.label), h('small', null, section.type));
      })
    );
  }

  function TemplateList(props) {
    const grouped = {};
    props.templates.forEach(function (template) {
      grouped[template.category] = grouped[template.category] || [];
      grouped[template.category].push(template);
    });

    return h('div', { className: props.compact ? 'gusy-template-list is-compact' : 'gusy-template-list' },
      Object.keys(grouped).map(function (category) {
        return h('section', { key: category },
          h('h3', null, category),
          grouped[category].map(function (template) {
            return h('button', { key: template.id, type: 'button', onClick: function () { props.onAdd(template); } },
              h('strong', null, template.title),
              !props.compact && h('span', null, template.preview)
            );
          })
        );
      })
    );
  }

  function BrandPanel(props) {
    const colors = (props.blueprint.page.designSystem && props.blueprint.page.designSystem.colors) || {};
    return h('div', { className: 'gusy-field-stack' },
      ['primary', 'accent', 'support', 'surface', 'ink'].map(function (key) {
        return h('label', { key: key },
          h('span', null, key),
          h('input', {
            type: 'color',
            value: colors[key] || '#111111',
            onChange: function (event) {
              props.updateBlueprint(function (draft) {
                draft.page.designSystem.colors = Object.assign({}, draft.page.designSystem.colors || {}, { [key]: event.target.value });
              });
            }
          })
        );
      })
    );
  }

  function Inspector(props) {
    const section = props.section;
    if (!section) {
      return h('div', { className: 'gusy-empty' }, 'Select a section.');
    }

    if (props.tab === 'seo') {
      return h('div', { className: 'gusy-field-stack' },
        h('label', null,
          h('span', null, 'SEO title'),
          h('input', {
            value: props.blueprint.page.seo.metaTitle,
            onChange: function (event) {
              props.updateBlueprint(function (draft) { draft.page.seo.metaTitle = event.target.value; });
            }
          })
        ),
        h('label', null,
          h('span', null, 'Description'),
          h('textarea', {
            value: props.blueprint.page.seo.metaDescription,
            onChange: function (event) {
              props.updateBlueprint(function (draft) { draft.page.seo.metaDescription = event.target.value; });
            }
          })
        )
      );
    }

    if (props.tab === 'style' || props.tab === 'layout' || props.tab === 'responsive') {
      return h('div', { className: 'gusy-field-stack' },
        h('label', null, h('span', null, 'Variant'), h('input', {
          value: section.variant,
          onChange: function (event) { props.updateSelected({ variant: event.target.value }); }
        })),
        h('label', null, h('span', null, 'Background'), h('select', {
          value: section.settings.background,
          onChange: function (event) { props.updateSelectedSettings('background', event.target.value); }
        },
          h('option', { value: 'plain' }, 'Plain'),
          h('option', { value: 'soft' }, 'Soft'),
          h('option', { value: 'elevated' }, 'Elevated'),
          h('option', { value: 'hero' }, 'Hero')
        )),
        h('label', null, h('span', null, 'Columns'), h('input', {
          type: 'range',
          min: '1',
          max: '4',
          value: section.settings.columns,
          onChange: function (event) { props.updateSelectedSettings('columns', Number(event.target.value)); }
        })),
        h('label', { className: 'gusy-check' }, h('input', {
          type: 'checkbox',
          checked: section.settings.mobileStack,
          onChange: function (event) { props.updateSelectedSettings('mobileStack', event.target.checked); }
        }), h('span', null, 'Stack on mobile'))
      );
    }

    return h('div', { className: 'gusy-field-stack' },
      h('label', null, h('span', null, 'Label'), h('input', {
        value: section.label,
        onChange: function (event) { props.updateSelected({ label: event.target.value }); }
      })),
      h('label', null, h('span', null, 'Kicker'), h('input', {
        value: section.kicker,
        onChange: function (event) { props.updateSelected({ kicker: event.target.value }); }
      })),
      h('label', null, h('span', null, 'Title'), h('textarea', {
        value: section.title,
        onChange: function (event) { props.updateSelected({ title: event.target.value }); }
      })),
      h('label', null, h('span', null, 'Copy'), h('textarea', {
        value: section.body,
        onChange: function (event) { props.updateSelected({ body: event.target.value }); }
      })),
      h('div', { className: 'gusy-button-row' },
        h('button', { type: 'button', onClick: props.onDuplicate }, 'Duplicate'),
        h('button', { type: 'button', onClick: props.onRemove }, 'Delete')
      )
    );
  }

  function AIDrawer(props) {
    const [instruction, setInstruction] = useState('Make this section more premium and more conversion-focused.');
    const suggestions = ['Make this section more premium', 'Turn this grid into bento', 'Optimize this section for mobile'];

    return h('section', { className: 'gusy-ai-drawer' },
      h('div', null, h('strong', null, 'AI Copilot'), h('span', null, props.selected ? props.selected.label : 'Whole page')),
      h('textarea', { value: instruction, onChange: function (event) { setInstruction(event.target.value); } }),
      h('div', { className: 'gusy-suggestions' },
        suggestions.map(function (suggestion) {
          return h('button', { key: suggestion, type: 'button', onClick: function () { props.onTransform(suggestion); } }, suggestion);
        })
      ),
      h('button', { type: 'button', className: 'is-primary', onClick: function () { props.onTransform(instruction); } }, 'Apply'),
      h('button', { type: 'button', onClick: props.onGenerate }, 'Regenerate page'),
      h('button', { type: 'button', onClick: props.onClose }, 'Close')
    );
  }

  function CommandPalette(props) {
    const [query, setQuery] = useState('');
    const filtered = props.commands.filter(function (command) {
      return command[0].toLowerCase().indexOf(query.toLowerCase()) !== -1;
    });

    return h('div', { className: 'gusy-command-backdrop', onMouseDown: props.onClose },
      h('div', { className: 'gusy-command', onMouseDown: function (event) { event.stopPropagation(); } },
        h('input', {
          autoFocus: true,
          placeholder: 'Command, block, template, or AI action',
          value: query,
          onChange: function (event) { setQuery(event.target.value); }
        }),
        h('div', null,
          filtered.map(function (command) {
            return h('button', {
              key: command[0],
              type: 'button',
              onClick: function () {
                command[1]();
                props.onClose();
              }
            }, command[0]);
          })
        )
      )
    );
  }

  const root = document.getElementById('gusy-app');
  if (root) {
    render(h(App), root);
  }
})(window.wp, window.GusyBuilderSettings);
