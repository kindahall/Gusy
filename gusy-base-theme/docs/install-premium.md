# Gusy Base Theme Installation

## Requirements

- WordPress 6.4 or newer
- PHP 8.0 or newer
- Gusy AI Builder plugin active
- WooCommerce optional, supported by the theme shell

## Install

1. Upload and activate `gusy-base-theme.zip`.
2. Upload and activate the Gusy AI Builder plugin.
3. Open **WordPress admin > Gusy > Themes**.
4. Choose the language: English is the primary version, French is available for translated demos.
5. Inspect the large kit preview: hero image, six-photo gallery, palette, included pages and installed status.
6. Choose a business kit and click **Import full site**.
7. Use **Home only** only when you want to test a kit without creating the secondary pages.
8. Adjust global style, density, button style and image tone directly in the Gusy Themes screen.
9. Keep **Set homepage** enabled if the imported homepage should become the public front page.

## Included Theme Kits

- Boutique Luxe
- Atelier Artisan
- Independent Consultant
- Beauty Salon
- Restaurant Table
- Poetic Florist
- Wellness Coach
- Interior Architect
- Local Market
- Creative Studio

Each kit includes a homepage, offers page, work page, about page, contact page and six bitmap photographs.

## Global Style Controls

The Gusy Themes screen exposes code-free controls for:

- Style mood: editorial, luxe, clean, warm or bold
- Density: compact, comfortable or editorial
- Buttons: solid, soft or outline
- Images: natural, bright, warm or contrast

These settings are stored in WordPress and applied as body classes by the theme.

## WordPress Templates

The theme includes dedicated templates for:

- Blog index
- Single posts
- Pages
- Archives
- Search
- 404
- WooCommerce shop, product, product category and product tag screens

Generated Gusy pages use the fullscreen Gusy template so WordPress navigation, automatic titles and Gutenberg layout wrappers do not break the design.

System templates include real bitmap image compositions so blog, search, 404 and WooCommerce pages do not fall back to a bare WordPress layout.

## QA Evidence

The repository includes browser audit reports under `audit/`.

- `responsive-report.json`: 100 Gusy demo pages across desktop, tablet and mobile.
- `system-template-report.json`: home, shop, search, 404 and single-post templates across desktop, tablet and mobile.

The expected production gate is zero responsive failures, no broken images, at least three visible images on generated visual pages, and no horizontal overflow.

## Editing

Gusy-owned pages open in Gusy when the user clicks WordPress edit actions. Gutenberg remains available only through explicit WordPress fallback URLs.

The front-end admin bar replaces **Edit Page** and **Edit Site** with **Edit with Gusy** on Gusy-owned pages.

## Réglages français

1. Activez le thème puis le plugin Gusy.
2. Ouvrez **Gusy > Themes**.
3. Sélectionnez **FR** pour importer les pages traduites.
4. Les pages restent modifiables dans Gusy et utilisent les mêmes photos que la version anglaise.
