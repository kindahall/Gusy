# Gusy

Gusy is a WordPress site-building workspace containing:

- `gusy-ai-builder`: the free AI-first WordPress page builder plugin.
- `gusy-ai-builder-pro`: the paid add-on that unlocks Pro features.
- `gusy-base-theme`: the companion block theme and theme-kit assets.

## Install

1. Zip or copy `gusy-ai-builder` into `wp-content/plugins/`.
2. Zip or copy `gusy-ai-builder-pro` into `wp-content/plugins/` when Pro features are needed.
3. Copy `gusy-base-theme` into `wp-content/themes/`.
4. Activate the free plugin, optionally activate the Pro add-on, then activate the theme.

Prebuilt install archives can be generated locally:

```bash
zip -r gusy-ai-builder.zip gusy-ai-builder -x 'gusy-ai-builder/node_modules/*' 'gusy-ai-builder/.test-build/*'
zip -r gusy-ai-builder-pro.zip gusy-ai-builder-pro
zip -r gusy-base-theme.zip gusy-base-theme
```

## Development

```bash
cd gusy-ai-builder
bun install
bun run typecheck
bun run test
bun run build
```

The plugin uses Vite for the admin app and keeps the built WordPress assets in `gusy-ai-builder/assets/dist`.

## Free And Pro

The free plugin includes the visual editor, local generation, section templates, JSON import/export, basic audit, selected theme-kit imports and lead capture.

The Pro add-on unlocks LLM Gateway, Product Agent, project memory, premium multi-page theme kits, customization, Elementor migration and revision history through server-side feature gates.

## License

GPL-2.0-or-later. See `LICENSE`.

## Support

If this project is useful to you, you can support its development with a free and entirely optional tip through the repository's **Sponsor** button. Thank you for your support.
