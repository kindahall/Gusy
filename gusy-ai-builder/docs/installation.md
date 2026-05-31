# Installation

## Prepare The Plugin

Place the `gusy-ai-builder` folder in `wp-content/plugins/`, then activate the plugin from WordPress admin.

## Build The Vite Editor

From the plugin folder:

```bash
npm install
npm run build
```

If the local Node binary is unavailable, use Bun:

```bash
bun install
bun run build:bun
```

The build creates `assets/dist/admin-app.js` and `assets/dist/admin-app.css`. The plugin loads them automatically when they exist.

## Open Gusy

In WordPress, open `Gusy` from the admin menu. The editor lets you generate a page, select a section, edit content, adjust style and save as draft or publish.
