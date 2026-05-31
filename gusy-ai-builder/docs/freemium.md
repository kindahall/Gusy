# Gusy Free/Pro Split

Gusy AI Builder ships as two WordPress plugins:

- `gusy-ai-builder`: free base plugin.
- `gusy-ai-builder-pro`: paid add-on.

The free plugin owns the editor, REST API, sanitization, local generation and public form capture. The Pro add-on unlocks paid features by registering server-side filters:

- `gusy_ai_builder_plan`
- `gusy_ai_builder_features`
- `gusy_ai_builder_upgrade_url`
- `gusy_ai_builder_free_theme_kit_slugs`

Do not rely on hidden React controls for paid access. Every paid workflow must call `Gusy_AI_Builder_Feature_Manager::require_feature()` or an equivalent server-side check before it reads, writes or calls a paid capability.

## Free

- Visual editor and WordPress save/publish.
- Local page and section generation.
- Section template library.
- Basic audit.
- JSON import/export.
- Lead forms.
- Selected theme kit home-page imports.

## Pro

- LLM Gateway.
- Product assistant and project memory.
- AI brand kit workflow.
- Premium theme kits and multi-page imports.
- Theme kit customization.
- Elementor migration.
- Revision history.
