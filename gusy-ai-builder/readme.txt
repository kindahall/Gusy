=== Gusy AI Builder ===
Contributors: gusy
Tags: page builder, ai, gutenberg, landing page, blocks
Requires at least: 6.4
Tested up to: 6.6
Requires PHP: 8.1
Stable tag: 0.2.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Gusy AI Builder creates premium WordPress landing pages through an AI-first visual editor with clean block output.

== Features ==

* Admin editor with selectable canvas, layers, templates, inspector and AI assistant.
* Local landing page generation from a natural-language brief.
* Draft saving or publishing based on the current user's WordPress capabilities.
* Gutenberg content serialization with readable classes and design tokens.
* Built-in library of 30 sections organized by business objective.
* Command palette with quick actions.
* Desktop, tablet and mobile preview.
* Shared frontend CSS and JavaScript loaded only when a generated page needs interactions.
* Lead capture through a validated REST endpoint with honeypot protection.
* Free/Pro feature registry with server-side gates for paid workflows.

== Free and Pro ==

The free plugin includes the visual editor, local generation, section templates, basic audit, JSON import/export, lead forms and selected theme kit home imports.

The paid `gusy-ai-builder-pro` add-on unlocks LLM Gateway, Product Agent, project memory, premium multi-page theme kits, theme kit customization, Elementor migration and revision history.

== Installation ==

1. Copy the `gusy-ai-builder` folder into `wp-content/plugins/`.
2. Activate Gusy AI Builder in WordPress admin.
3. Open the Gusy menu.
4. Describe the page, generate it, adjust sections, then save or publish.

== Vite Build ==

The editor is Vite-powered.

1. From the plugin folder, run `npm install`.
2. Run `npm run build`.
3. WordPress automatically loads `assets/dist/admin-app.js` and `assets/dist/admin-app.css`.

On machines where the system Node binary is unavailable, run `bun install` then `bun run build:bun`.

If the Vite bundle does not exist yet, the plugin loads `assets/js/admin-app.js` so the editor remains usable.

== Security ==

Editing routes require `edit_posts`. Publishing requires `publish_posts`. Incoming data is validated and sanitized in PHP before it is saved. Public forms use basic validation, a honeypot and payload size limits.

== Changelog ==

= 0.2.0 =
* Added the Free/Pro architecture and a separate Gusy AI Builder Pro add-on.

= 0.1.0 =
* First installable version of Gusy AI Builder.
