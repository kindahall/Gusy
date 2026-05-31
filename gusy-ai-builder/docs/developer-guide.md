# Developer Guide

## Architecture

The plugin separates the main responsibilities:

`Gusy_AI_Builder_Plugin` initializes WordPress hooks, assets and internal post types.

`Gusy_AI_Builder_Rest_Controller` exposes secured REST routes.

`Gusy_AI_Builder_Page_Generator` turns a brief into a blueprint.

`Gusy_AI_Builder_Block_Serializer` converts a blueprint into Gutenberg content.

`Gusy_AI_Builder_Template_Repository` provides built-in sections.

## Add A Section

Add an entry in `Gusy_AI_Builder_Template_Repository::get_sections()`, then extend `Gusy_AI_Builder_Block_Serializer::serialize_section()` if the type needs dedicated markup.

## Extend The Vite Build

The entry point is `src/admin/main.tsx`. The build output is `assets/dist`. WordPress loads the Vite bundle when the file exists.
