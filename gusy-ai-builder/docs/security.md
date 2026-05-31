# Security

## REST Permissions

Generation, transformation, templates and save routes require `edit_posts`. Publishing requires `publish_posts`. The global brand kit route requires `manage_options`.

Page creation routes additionally check `edit_pages`, and page listings filter every returned page with `current_user_can( 'edit_post', $post_id )`. Theme-kit imports refuse to overwrite an existing slug unless the current user can edit that exact page.

## Validation

Prompts, blueprints, sections, SEO fields, CTAs and tokens are sanitized in PHP before use. Color tokens accept only six-character hexadecimal values.

REST write endpoints enforce bounded payload sizes, prompt lengths, section counts, item counts and JSON-LD size. Expensive editor/AI routes use transient-backed rate limiting per authenticated user.

## Free/Pro Gates

Paid workflows are enforced server-side through `Gusy_AI_Builder_Feature_Manager`. The React UI only mirrors the current plan; REST routes still reject Pro-only LLM Gateway, Product Agent, premium theme kits, Elementor migration and revision history when the Pro add-on is inactive.

## Public Forms

Gusy forms send requests to `/wp-json/gusy/v1/lead`. The endpoint validates name, email, message, message length, consent and a honeypot field. Public submissions are rate-limited by anonymized IP bucket and email bucket.

Lead records store only the submitted name, email, message, source URL, consent marker and retention expiry. The default retention window is 180 days and can be changed with the `gusy_lead_retention_days` filter.

## Generated Content

Local generation does not produce arbitrary JavaScript. Frontend interactions are limited to the pricing toggle and form submission.

## LLM Gateway

Public settings never expose the stored API key. Remote LLM base URLs must use HTTPS by default. Private or local HTTP endpoints require defining `GUSY_ALLOW_PRIVATE_LLM_ENDPOINTS` intentionally in WordPress configuration.

## Local Tools

Preview/import helper scripts are WP-CLI only. Do not copy `imagn/` fixtures or local zip archives into a public web root.
