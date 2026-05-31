# Performance

## Conditional Loading

`frontend.css` loads only on pages containing `gusy-` classes. `frontend.js` loads only if the page contains a form, pricing grid or Gusy interaction.

## Page Output

Published content is readable Gutenberg HTML with `gusy-` prefixed classes. Page tokens are printed as CSS variables, avoiding a large generated stylesheet per page.

## CSS

The CSS uses cascade layers, variables, `color-mix()` and container queries to keep responsive behavior stable without JavaScript.
