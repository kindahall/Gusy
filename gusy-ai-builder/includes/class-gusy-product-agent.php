<?php
/**
 * Product assistant agent.
 *
 * @package Gusy_AI_Builder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Guides users inside Gusy using product knowledge and optional LLM reasoning.
 */
final class Gusy_AI_Builder_Product_Agent {
	private const MEMORY_META_KEY = 'gusy_project_memory';

	/**
	 * LLM gateway.
	 *
	 * @var Gusy_AI_Builder_LLM_Gateway
	 */
	private Gusy_AI_Builder_LLM_Gateway $llm;

	/**
	 * Constructor.
	 *
	 * @param Gusy_AI_Builder_LLM_Gateway $llm LLM gateway.
	 */
	public function __construct( Gusy_AI_Builder_LLM_Gateway $llm ) {
		$this->llm = $llm;
	}

	/**
	 * Answer a user question about Gusy and return optional UI actions.
	 *
	 * @param string              $message User message.
	 * @param array<string,mixed> $context Editor context.
	 * @return array<string,mixed>|WP_Error
	 */
	public function chat( string $message, array $context = array() ) {
		$message = trim( sanitize_textarea_field( $message ) );
		if ( '' === $message ) {
			return new WP_Error( 'gusy_agent_empty_message', __( 'Message required.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}
		$context = $this->enrich_context( $context );

		if ( $this->llm->is_configured() ) {
			$response = $this->llm->complete_json(
				$this->system_prompt(),
				$this->user_prompt( $message, $context ),
				$this->response_shape(),
				1600
			);

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			return $this->sanitize_response( $response );
		}

		return $this->fallback_response( $message, $context );
	}

	/**
	 * Active WordPress theme context.
	 *
	 * @return array<string,mixed>
	 */
	public function theme_context(): array {
		$theme    = wp_get_theme();
		$settings = function_exists( 'wp_get_global_settings' ) ? wp_get_global_settings() : array();
		$styles   = function_exists( 'wp_get_global_styles' ) ? wp_get_global_styles() : array();

		return array(
			'name'        => sanitize_text_field( $theme->get( 'Name' ) ),
			'template'    => sanitize_key( (string) get_template() ),
			'stylesheet'  => sanitize_key( (string) get_stylesheet() ),
			'version'     => sanitize_text_field( $theme->get( 'Version' ) ),
			'author'      => sanitize_text_field( wp_strip_all_tags( $theme->get( 'Author' ) ) ),
			'blockTheme'  => function_exists( 'wp_is_block_theme' ) ? (bool) wp_is_block_theme() : false,
			'supports'    => array(
				'customLogo'       => current_theme_supports( 'custom-logo' ),
				'alignWide'        => current_theme_supports( 'align-wide' ),
				'editorStyles'     => current_theme_supports( 'editor-styles' ),
				'responsiveEmbeds' => current_theme_supports( 'responsive-embeds' ),
			),
			'layout'      => array(
				'contentSize' => sanitize_text_field( (string) ( $settings['layout']['contentSize'] ?? '' ) ),
				'wideSize'    => sanitize_text_field( (string) ( $settings['layout']['wideSize'] ?? '' ) ),
			),
			'typography'  => array(
				'fontFamily' => sanitize_text_field( (string) ( $styles['typography']['fontFamily'] ?? '' ) ),
				'fontSize'   => sanitize_text_field( (string) ( $styles['typography']['fontSize'] ?? '' ) ),
				'lineHeight' => sanitize_text_field( (string) ( $styles['typography']['lineHeight'] ?? '' ) ),
			),
			'palette'     => $this->extract_palette( is_array( $settings ) ? $settings : array() ),
			'tokens'      => $this->theme_tokens( is_array( $settings ) ? $settings : array(), is_array( $styles ) ? $styles : array() ),
		);
	}

	/**
	 * Get the current user's project memory.
	 *
	 * @return array<string,mixed>
	 */
	public function get_memory(): array {
		$user_id = get_current_user_id();
		$memory  = $user_id ? get_user_meta( $user_id, self::MEMORY_META_KEY, true ) : array();

		return $this->sanitize_memory( is_array( $memory ) ? $memory : array() );
	}

	/**
	 * Save the current user's project memory.
	 *
	 * @param array<string,mixed> $input Input.
	 * @return array<string,mixed>
	 */
	public function save_memory( array $input ): array {
		$memory  = $this->sanitize_memory( $input );
		$user_id = get_current_user_id();

		if ( $user_id ) {
			update_user_meta( $user_id, self::MEMORY_META_KEY, $memory );
		}

		return $memory;
	}

	/**
	 * Product manual for the agent.
	 */
	private function system_prompt(): string {
		return 'You are Gusy Product Agent, the in-app expert for Gusy AI Builder. You know the product by heart and help WordPress users decide the next practical step. Keep answers concise and actionable. Do not invent unavailable features. The UI is in English. Return JSON only.

Gusy product facts:
- Gusy is an AI-first WordPress page builder for creating editable landing pages without Elementor lock-in.
- Users can start from a professional theme kit, create with AI from a prompt, start a blank page, add sections, import Elementor pages, edit sections, audit, export, and publish to WordPress.
- Main navigation: Start, Pages, Themes, Edit, Add sections, Design, Audit, Publish, Import and Backup.
- Pages: saved WordPress pages and blank page creation.
- Themes: professional multi-page business kits that can be personalized with real company details, offers, reviews, menu pages and photos before import.
- Add sections: insert real section templates such as hero, features, pricing, FAQ, form, CTA, testimonials, gallery, process, comparison, local, newsletter.
- Edit: visual page editor where sections can be selected, duplicated, removed, reordered, edited, and improved.
- Brand: design tokens such as colors, typography, spacing, radius and preview.
- Audit: checks SEO, accessibility, performance and conversion issues on the current blueprint.
- Export: exports/imports JSON templates and syncs/publishes to WordPress.
- Migrate: scans existing Elementor pages and converts one into a Gusy blueprint.
- LLM Gateway is configured in the right panel when no section is selected. Providers: OpenAI Responses API, Anthropic Claude, Google Gemini, OpenAI-compatible, LLM gateway.
- If no LLM key is configured, local fallback generation still works, but real AI quality requires LLM Gateway setup.
- The assistant can guide Gusy by proposing strict actions: open tabs, insert a section, transform the selected section, update selected section style, move selected section up/down, apply active WordPress theme styles, run audit, scan Elementor, save draft, publish.
- The agent must adapt advice to the active WordPress theme context: theme name, block theme status, support flags, palette and theme-derived design tokens.
- Mission Mode executes a full workflow from a user brief: remember the project, adapt to the theme, generate or complete the page, apply SEO, audit, and prepare for saving.
- Project Memory stores business, audience, offer, tone, local market, brand voice, primary goal, keywords and notes.
- Safe Actions must be confirmed for impactful changes before applying them.
- Visual Critique inspects the current page structure, copy, CTA path, section mix, audit score and theme fit.
- SEO Local can create metadata, FAQ structure and JSON-LD schema.
- Migration Agent scans Elementor pages, previews a conversion and guides cleanup.
- WordPress Agent can save, publish, open preview and set a page as homepage when available.
- Brand Agent creates or refines design tokens and voice from the project memory and active theme.
- Finish This Page completes missing structure, SEO, audit and publish readiness.
- Action fields are strict: create_section uses sectionType; move_selected uses direction up or down; update_selected_style uses settings with background, spacing, width, accent, columns, tabletColumns, mobileColumns, mobileStack, textAlign, headingScale, textWidth, bodyScale, buttonStyle, buttonSize, buttonShape, imageAspect, imagePosition, imageShape or videoMode.
- The product should avoid fake testimonials, fake metrics, placeholder copy and explanatory filler.';
	}

	/**
	 * User prompt with editor context.
	 *
	 * @param string              $message Message.
	 * @param array<string,mixed> $context Context.
	 */
	private function user_prompt( string $message, array $context ): string {
		$encoded = wp_json_encode( $this->sanitize_context( $context ), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );

		return 'User message: ' . $message . "\n\nCurrent editor context:\n" . ( is_string( $encoded ) ? $encoded : '{}' );
	}

	/**
	 * Expected agent response shape.
	 *
	 * @return array<string,mixed>
	 */
	private function response_shape(): array {
		return array(
			'reply'   => 'Concise product guidance in English.',
			'intent'  => 'guidance',
			'actions' => array(
				array(
					'type'   => 'open_tab',
					'target' => 'blocks',
					'label'  => 'Add Sections',
				),
				array(
					'type'        => 'create_section',
					'target'      => 'layers',
					'label'       => 'Add FAQ',
					'sectionType' => 'faq',
				),
				array(
					'type'      => 'update_selected_style',
					'target'    => 'layers',
					'label'     => 'Make Soft',
					'settings'  => array( 'background' => 'soft' ),
				),
			),
		);
	}

	/**
	 * Local product-knowledge fallback.
	 *
	 * @param string              $message Message.
	 * @param array<string,mixed> $context Context.
	 * @return array<string,mixed>
	 */
	private function fallback_response( string $message, array $context ): array {
		$lower    = strtolower( remove_accents( $message ) );
		$sections = absint( $context['sectionCount'] ?? 0 );

		if ( str_contains( $lower, 'mission' ) || str_contains( $lower, 'pilote' ) || str_contains( $lower, 'jusqu au bout' ) || str_contains( $lower, "jusqu'au bout" ) ) {
			return array(
				'reply'   => 'Mission Mode can take the brief and run the build sequence: memory, theme, page structure, SEO, audit and publish readiness.',
				'intent'  => 'mission',
				'actions' => array(
					array( 'type' => 'start_mission', 'target' => 'layers', 'label' => 'Start Mission', 'prompt' => $message ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'finish' ) || str_contains( $lower, 'complete' ) || str_contains( $lower, 'termine' ) || str_contains( $lower, 'finalise' ) || str_contains( $lower, 'finir' ) ) {
			return array(
				'reply'   => 'I can finish the current page by filling missing sections, applying theme fit, preparing SEO and running an audit.',
				'intent'  => 'finish',
				'actions' => array(
					array( 'type' => 'finish_page', 'target' => 'audit', 'label' => 'Finish Page', 'prompt' => $message ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'theme' ) || str_contains( $lower, 'theme wordpress' ) || str_contains( $lower, 'style du site' ) || str_contains( $lower, 'adapter' ) ) {
			$theme = isset( $context['theme']['name'] ) ? (string) $context['theme']['name'] : 'the active WordPress theme';
			return array(
				'reply'   => 'I can adapt the page to ' . $theme . ': apply theme-derived colors and typography, then review sections in the page editor.',
				'intent'  => 'theme_adaptation',
				'actions' => array(
					array( 'type' => 'apply_theme_tokens', 'target' => 'brand', 'label' => 'Apply Theme Styles' ),
					array( 'type' => 'open_tab', 'target' => 'brand', 'label' => 'Open Brand' ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'memoire' ) || str_contains( $lower, 'memory' ) || str_contains( $lower, 'remember' ) || str_contains( $lower, 'souviens' ) ) {
			return array(
				'reply'   => 'I can save this as project memory so future pages keep the same business context, tone, offer and audience.',
				'intent'  => 'memory',
				'actions' => array(
					array( 'type' => 'save_project_memory', 'target' => 'agent', 'label' => 'Save Memory', 'prompt' => $message ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'brand' ) || str_contains( $lower, 'marque' ) || str_contains( $lower, 'identite' ) || str_contains( $lower, 'identité' ) ) {
			return array(
				'reply'   => 'I can build a brand kit from the active theme and project memory, then apply it to the current page.',
				'intent'  => 'brand',
				'actions' => array(
					array( 'type' => 'build_brand_kit', 'target' => 'brand', 'label' => 'Build Site Style', 'prompt' => $message ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'schema' ) || str_contains( $lower, 'json-ld' ) || str_contains( $lower, 'seo local' ) || str_contains( $lower, 'referencement' ) || str_contains( $lower, 'référencement' ) ) {
			return array(
				'reply'   => 'I can prepare local SEO metadata, FAQ coverage and JSON-LD schema for the current page.',
				'intent'  => 'seo',
				'actions' => array(
					array( 'type' => 'generate_local_seo', 'target' => 'audit', 'label' => 'Generate SEO' ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'critique' ) || str_contains( $lower, 'review' ) || str_contains( $lower, 'inspect' ) || str_contains( $lower, 'analyse' ) ) {
			return array(
				'reply'   => 'I can critique the current page structure, copy, CTA path, SEO and theme fit, then propose fixes.',
				'intent'  => 'critique',
				'actions' => array(
					array( 'type' => 'critique_page', 'target' => 'agent', 'label' => 'Critique Page' ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		$section_type = $this->requested_section_type( $lower );
		if ( $section_type && ( str_contains( $lower, 'section' ) || str_contains( $lower, 'block' ) || str_contains( $lower, 'bloc' ) || str_contains( $lower, 'add' ) || str_contains( $lower, 'insert' ) || str_contains( $lower, 'ajoute' ) ) ) {
			return array(
				'reply'   => 'I can insert that section into the current page, then you can tune it in the page editor.',
				'intent'  => 'create_section',
				'actions' => array(
					array( 'type' => 'create_section', 'target' => 'layers', 'label' => 'Add Section', 'sectionType' => $section_type ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'move' ) || str_contains( $lower, 'deplace' ) || str_contains( $lower, 'déplace' ) || str_contains( $lower, 'remonte' ) || str_contains( $lower, 'descend' ) ) {
			$direction = ( str_contains( $lower, 'down' ) || str_contains( $lower, 'after' ) || str_contains( $lower, 'descend' ) ) ? 'down' : 'up';
			return array(
				'reply'   => 'Select the section to move, then I can reposition it in the page.',
				'intent'  => 'move_section',
				'actions' => array(
					array( 'type' => 'move_selected', 'target' => 'layers', 'label' => 'Move ' . ucfirst( $direction ), 'direction' => $direction ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		$style_settings = $this->requested_style_settings( $lower );
		if ( $style_settings ) {
			return array(
				'reply'   => 'Select the section to style, then I can apply the requested layout or background change.',
				'intent'  => 'style_section',
				'actions' => array(
					array( 'type' => 'update_selected_style', 'target' => 'layers', 'label' => 'Apply Style', 'settings' => $style_settings ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'create' ) || str_contains( $lower, 'generate' ) || str_contains( $lower, 'build' ) || str_contains( $lower, 'creer' ) || str_contains( $lower, 'créer' ) ) {
			return array(
				'reply'   => 'I can create the page from your brief, then you can refine the generated sections in the page editor.',
				'intent'  => 'create',
				'actions' => array(
					array( 'type' => 'generate_page', 'target' => 'layers', 'label' => 'Generate Page', 'prompt' => $message ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'modify' ) || str_contains( $lower, 'edit' ) || str_contains( $lower, 'change' ) || str_contains( $lower, 'modifier' ) ) {
			return array(
				'reply'   => 'Select the section you want to change, then I can transform that section with your instruction.',
				'intent'  => 'modify',
				'actions' => array(
					array( 'type' => 'transform_selected', 'target' => 'layers', 'label' => 'Modify Selected', 'prompt' => $message ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'llm' ) || str_contains( $lower, 'api' ) || str_contains( $lower, 'key' ) || str_contains( $lower, 'gpt' ) || str_contains( $lower, 'claude' ) || str_contains( $lower, 'gemini' ) ) {
			return array(
				'reply'   => 'Configure LLM Gateway first: choose a provider, enter the model and API key, save, then test. After that, page generation and section edits use the real provider.',
				'intent'  => 'setup',
				'actions' => array(
					array( 'type' => 'open_page_settings', 'target' => 'pages', 'label' => 'Open LLM Settings' ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'elementor' ) || str_contains( $lower, 'migrate' ) || str_contains( $lower, 'import' ) ) {
			return array(
				'reply'   => 'I can scan Elementor pages, preview the first conversion and then guide the cleanup in the page editor.',
				'intent'  => 'migration',
				'actions' => array(
					array( 'type' => 'open_tab', 'target' => 'migrate', 'label' => 'Open Migrate' ),
					array( 'type' => 'scan_elementor', 'target' => 'migrate', 'label' => 'Scan Elementor' ),
					array( 'type' => 'preview_first_elementor', 'target' => 'migrate', 'label' => 'Preview First' ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'audit' ) || str_contains( $lower, 'seo' ) || str_contains( $lower, 'performance' ) ) {
			return array(
				'reply'   => 'Run Audit on the current page. It checks SEO, accessibility, performance and conversion, then you can fix the selected issue with AI.',
				'intent'  => 'audit',
				'actions' => array(
					array( 'type' => 'run_audit', 'target' => 'audit', 'label' => 'Run Audit' ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( str_contains( $lower, 'publish' ) || str_contains( $lower, 'wordpress' ) || str_contains( $lower, 'save' ) ) {
			return array(
				'reply'   => 'I can handle WordPress handoff: save a draft, publish, open preview or set this page as the homepage after it has a WordPress page ID.',
				'intent'  => 'publish',
				'actions' => array(
					array( 'type' => 'save_draft', 'target' => 'pages', 'label' => 'Save Draft' ),
					array( 'type' => 'publish', 'target' => 'pages', 'label' => 'Publish' ),
					array( 'type' => 'set_homepage', 'target' => 'pages', 'label' => 'Set Homepage' ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		if ( 0 === $sections ) {
			return array(
				'reply'   => 'Start with a real brief. Use Create with AI for a full page, or add sections if you want to assemble the page step by step.',
				'intent'  => 'start',
				'actions' => array(
					array( 'type' => 'open_tab', 'target' => 'blocks', 'label' => 'Add Sections' ),
					array( 'type' => 'open_tab', 'target' => 'layers', 'label' => 'Edit Page' ),
				),
				'source'  => array( 'type' => 'local-product-agent' ),
			);
		}

		return array(
			'reply'   => 'Open the page editor, select the weakest section, edit its copy in the right panel, then run Audit before publishing.',
			'intent'  => 'guidance',
			'actions' => array(
				array( 'type' => 'open_tab', 'target' => 'layers', 'label' => 'Edit Page' ),
				array( 'type' => 'run_audit', 'target' => 'audit', 'label' => 'Run Audit' ),
			),
			'source'  => array( 'type' => 'local-product-agent' ),
		);
	}

	/**
	 * Sanitize context sent by the editor.
	 *
	 * @param array<string,mixed> $context Context.
	 * @return array<string,mixed>
	 */
	private function enrich_context( array $context ): array {
		$clean          = $this->sanitize_context( $context );
		$clean['theme'] = $this->theme_context();
		$clean['memory'] = $this->get_memory();

		return $clean;
	}

	/**
	 * Sanitize context sent by the editor.
	 *
	 * @param array<string,mixed> $context Context.
	 * @return array<string,mixed>
	 */
	private function sanitize_context( array $context ): array {
		return array(
			'activeTab'      => sanitize_key( (string) ( $context['activeTab'] ?? 'pages' ) ),
			'pageTitle'      => sanitize_text_field( (string) ( $context['pageTitle'] ?? '' ) ),
			'sectionCount'   => absint( $context['sectionCount'] ?? 0 ),
			'selectedType'   => sanitize_key( (string) ( $context['selectedType'] ?? '' ) ),
			'auditScore'     => absint( $context['auditScore'] ?? 0 ),
			'llmConfigured'  => (bool) ( $context['llmConfigured'] ?? false ),
			'canPublish'     => (bool) ( $context['canPublish'] ?? false ),
			'postId'         => absint( $context['postId'] ?? 0 ),
		);
	}

	/**
	 * Sanitize project memory.
	 *
	 * @param array<string,mixed> $input Memory.
	 * @return array<string,mixed>
	 */
	private function sanitize_memory( array $input ): array {
		$keywords = array();
		if ( isset( $input['keywords'] ) && is_array( $input['keywords'] ) ) {
			foreach ( $input['keywords'] as $keyword ) {
				$keyword = sanitize_text_field( (string) $keyword );
				if ( '' !== $keyword ) {
					$keywords[] = $keyword;
				}
			}
		}

		return array(
			'business'      => sanitize_text_field( (string) ( $input['business'] ?? '' ) ),
			'audience'      => sanitize_text_field( (string) ( $input['audience'] ?? '' ) ),
			'offer'         => sanitize_text_field( (string) ( $input['offer'] ?? '' ) ),
			'tone'          => sanitize_text_field( (string) ( $input['tone'] ?? 'premium, clear' ) ),
			'localMarket'   => sanitize_text_field( (string) ( $input['localMarket'] ?? '' ) ),
			'brandVoice'    => sanitize_textarea_field( (string) ( $input['brandVoice'] ?? '' ) ),
			'primaryGoal'   => sanitize_text_field( (string) ( $input['primaryGoal'] ?? 'Generate qualified enquiries' ) ),
			'keywords'      => array_slice( $keywords, 0, 12 ),
			'notes'         => sanitize_textarea_field( (string) ( $input['notes'] ?? '' ) ),
			'lastUpdatedAt' => sanitize_text_field( (string) ( $input['lastUpdatedAt'] ?? gmdate( 'c' ) ) ),
		);
	}

	/**
	 * Extract theme palette colors.
	 *
	 * @param array<string,mixed> $settings Global settings.
	 * @return array<int,array<string,string>>
	 */
	private function extract_palette( array $settings ): array {
		$palette = array();
		$groups  = array(
			$settings['color']['palette']['theme'] ?? array(),
			$settings['color']['palette']['custom'] ?? array(),
		);

		foreach ( $groups as $group ) {
			if ( ! is_array( $group ) ) {
				continue;
			}
			foreach ( $group as $color ) {
				if ( ! is_array( $color ) || empty( $color['color'] ) ) {
					continue;
				}
				$palette[] = array(
					'name'  => sanitize_text_field( (string) ( $color['name'] ?? $color['slug'] ?? 'Color' ) ),
					'slug'  => sanitize_key( (string) ( $color['slug'] ?? '' ) ),
					'color' => sanitize_hex_color( (string) $color['color'] ) ?: '#111827',
				);
			}
		}

		return $palette;
	}

	/**
	 * Build Gusy tokens from the active theme.
	 *
	 * @param array<string,mixed> $settings Global settings.
	 * @param array<string,mixed> $styles Global styles.
	 * @return array<string,mixed>
	 */
	private function theme_tokens( array $settings, array $styles ): array {
		$palette    = $this->extract_palette( $settings );
		$primary    = $palette[0]['color'] ?? '#2563eb';
		$accent     = $palette[1]['color'] ?? '#14b8a6';
		$support    = $palette[2]['color'] ?? '#7c3aed';
		$background = sanitize_hex_color( (string) ( $styles['color']['background'] ?? '' ) ) ?: '#ffffff';
		$ink        = sanitize_hex_color( (string) ( $styles['color']['text'] ?? '' ) ) ?: '#111827';
		$font       = sanitize_text_field( (string) ( $styles['typography']['fontFamily'] ?? 'Inter, ui-sans-serif, system-ui, sans-serif' ) );
		$content    = sanitize_text_field( (string) ( $settings['layout']['contentSize'] ?? '' ) );
		$wide       = sanitize_text_field( (string) ( $settings['layout']['wideSize'] ?? '' ) );

		return array(
			'style'      => 'theme-adapted',
			'mode'       => 'light',
			'colors'     => array(
				'primary' => $primary,
				'accent'  => $accent,
				'support' => $support,
				'surface' => $background,
				'ink'     => $ink,
				'muted'   => '#64748b',
				'line'    => '#e2e8f0',
			),
			'typography' => array(
				'fontFamily' => $font,
				'scale'      => 'comfortable',
				'weight'     => '600',
			),
			'spacing'    => 'comfortable',
			'radius'     => array(
				'sm' => '8px',
				'md' => '12px',
				'lg' => '18px',
				'xl' => '24px',
			),
			'shadow'     => 'theme',
			'motion'     => 'subtle',
			'layout'     => current_theme_supports( 'align-wide' ) ? 'wide' : 'boxed',
			'content'    => array(
				'contentSize' => $content,
				'wideSize'    => $wide,
			),
		);
	}

	/**
	 * Sanitize model or fallback response.
	 *
	 * @param array<string,mixed> $response Raw response.
	 * @return array<string,mixed>
	 */
	private function sanitize_response( array $response ): array {
		$actions = array();
		if ( isset( $response['actions'] ) && is_array( $response['actions'] ) ) {
			foreach ( $response['actions'] as $action ) {
				if ( ! is_array( $action ) ) {
					continue;
				}

				$type = sanitize_key( (string) ( $action['type'] ?? '' ) );
				if ( ! in_array( $type, array( 'open_tab', 'open_page_settings', 'scan_elementor', 'run_audit', 'save_draft', 'publish', 'generate_page', 'create_section', 'transform_selected', 'update_selected_style', 'move_selected', 'apply_theme_tokens', 'start_mission', 'finish_page', 'save_project_memory', 'build_brand_kit', 'generate_local_seo', 'critique_page', 'preview_first_elementor', 'set_homepage' ), true ) ) {
					continue;
				}

				$clean_action = array(
					'type'   => $type,
					'target' => sanitize_key( (string) ( $action['target'] ?? '' ) ),
					'label'  => sanitize_text_field( (string) ( $action['label'] ?? 'Run action' ) ),
					'prompt' => sanitize_textarea_field( (string) ( $action['prompt'] ?? '' ) ),
				);

				if ( isset( $action['sectionType'] ) ) {
					$clean_action['sectionType'] = $this->sanitize_section_type( (string) $action['sectionType'] );
				}
				if ( isset( $action['direction'] ) ) {
					$direction = sanitize_key( (string) $action['direction'] );
					if ( in_array( $direction, array( 'up', 'down' ), true ) ) {
						$clean_action['direction'] = $direction;
					}
				}
				if ( isset( $action['settings'] ) && is_array( $action['settings'] ) ) {
					$settings = $this->sanitize_action_settings( $action['settings'] );
					if ( $settings ) {
						$clean_action['settings'] = $settings;
					}
				}

				$actions[] = $clean_action;
			}
		}

		return array(
			'reply'   => sanitize_textarea_field( (string) ( $response['reply'] ?? 'I can help you choose the next step in Gusy.' ) ),
			'intent'  => sanitize_key( (string) ( $response['intent'] ?? 'guidance' ) ),
			'actions' => $actions,
			'source'  => array(
				'type' => $this->llm->is_configured() ? 'llm-product-agent' : 'local-product-agent',
			),
		);
	}

	/**
	 * Infer a requested section type from a normalized prompt.
	 *
	 * @param string $lower Lowercase prompt.
	 */
	private function requested_section_type( string $lower ): string {
		$aliases = array(
			'header'      => 'header',
			'navigation'  => 'header',
			'hero'        => 'hero',
			'service'     => 'features',
			'services'    => 'features',
			'feature'     => 'features',
			'pricing'     => 'pricing',
			'price'       => 'pricing',
			'faq'         => 'faq',
			'question'    => 'faq',
			'form'        => 'form',
			'contact'     => 'form',
			'cta'         => 'cta',
			'testimonial' => 'testimonials',
			'proof'       => 'testimonials',
			'gallery'     => 'gallery',
			'process'     => 'process',
			'comparison'  => 'comparison',
			'local'       => 'local',
			'newsletter'  => 'newsletter',
			'footer'      => 'footer',
		);

		foreach ( $aliases as $needle => $type ) {
			if ( str_contains( $lower, $needle ) ) {
				return $type;
			}
		}

		return '';
	}

	/**
	 * Infer style settings from a normalized prompt.
	 *
	 * @param string $lower Lowercase prompt.
	 * @return array<string,mixed>
	 */
	private function requested_style_settings( string $lower ): array {
		$settings = array();

		if ( str_contains( $lower, 'soft' ) ) {
			$settings['background'] = 'soft';
		} elseif ( str_contains( $lower, 'raised' ) || str_contains( $lower, 'elevated' ) ) {
			$settings['background'] = 'elevated';
		} elseif ( str_contains( $lower, 'hero background' ) ) {
			$settings['background'] = 'hero';
		} elseif ( str_contains( $lower, 'plain background' ) ) {
			$settings['background'] = 'plain';
		}

		if ( str_contains( $lower, 'boxed' ) ) {
			$settings['width'] = 'boxed';
		} elseif ( str_contains( $lower, 'full width' ) || str_contains( $lower, 'full-width' ) ) {
			$settings['width'] = 'full';
		} elseif ( str_contains( $lower, 'wide' ) ) {
			$settings['width'] = 'wide';
		}

		if ( str_contains( $lower, 'compact' ) || str_contains( $lower, 'tight' ) ) {
			$settings['spacing'] = 'compact';
		} elseif ( str_contains( $lower, 'roomy' ) || str_contains( $lower, 'large spacing' ) ) {
			$settings['spacing'] = 'xl';
		} elseif ( str_contains( $lower, 'normal spacing' ) ) {
			$settings['spacing'] = 'lg';
		}

		if ( str_contains( $lower, '1 column' ) || str_contains( $lower, 'one column' ) ) {
			$settings['columns'] = 1;
		} elseif ( str_contains( $lower, '2 column' ) || str_contains( $lower, 'two column' ) ) {
			$settings['columns'] = 2;
		} elseif ( str_contains( $lower, '3 column' ) || str_contains( $lower, 'three column' ) ) {
			$settings['columns'] = 3;
		} elseif ( str_contains( $lower, '4 column' ) || str_contains( $lower, 'four column' ) ) {
			$settings['columns'] = 4;
		}

		foreach ( array( 'tablet' => 'tabletColumns', 'mobile' => 'mobileColumns' ) as $device => $key ) {
			if ( preg_match( '/(?:' . $device . ').{0,18}(1|one|2|two|3|three)\s+col/u', $lower, $matches ) ) {
				$value = array( 'one' => 1, 'two' => 2, 'three' => 3 )[ $matches[1] ] ?? absint( $matches[1] );
				$settings[ $key ] = 'mobileColumns' === $key ? min( 2, max( 1, $value ) ) : min( 3, max( 1, $value ) );
			}
		}
		foreach ( array( 'left', 'center', 'right' ) as $align ) {
			if ( str_contains( $lower, $align . ' align' ) || str_contains( $lower, 'align ' . $align ) ) {
				$settings['textAlign'] = $align;
			}
		}
		foreach ( array( 'compact', 'display' ) as $scale ) {
			if ( str_contains( $lower, $scale . ' heading' ) || str_contains( $lower, $scale . ' title' ) ) {
				$settings['headingScale'] = $scale;
			}
		}
		foreach ( array( 'narrow', 'wide' ) as $width ) {
			if ( str_contains( $lower, $width . ' text' ) || str_contains( $lower, $width . ' copy' ) ) {
				$settings['textWidth'] = $width;
			}
		}
		foreach ( array( 'compact', 'large' ) as $scale ) {
			if ( str_contains( $lower, $scale . ' body' ) || str_contains( $lower, $scale . ' paragraph' ) ) {
				$settings['bodyScale'] = $scale;
			}
		}
		foreach ( array( 'solid', 'soft', 'outline' ) as $style ) {
			if ( str_contains( $lower, $style . ' button' ) || str_contains( $lower, $style . ' cta' ) ) {
				$settings['buttonStyle'] = $style;
			}
		}
		if ( str_contains( $lower, 'large button' ) || str_contains( $lower, 'big button' ) ) {
			$settings['buttonSize'] = 'lg';
		} elseif ( str_contains( $lower, 'small button' ) ) {
			$settings['buttonSize'] = 'sm';
		}
		foreach ( array( 'pill', 'rounded', 'square' ) as $shape ) {
			if ( str_contains( $lower, $shape . ' button' ) || str_contains( $lower, $shape . ' cta' ) ) {
				$settings['buttonShape'] = $shape;
			}
		}
		foreach ( array( 'landscape', 'portrait', 'square' ) as $aspect ) {
			if ( str_contains( $lower, $aspect . ' image' ) || str_contains( $lower, $aspect . ' photo' ) ) {
				$settings['imageAspect'] = $aspect;
			}
		}
		foreach ( array( 'top', 'center', 'bottom' ) as $position ) {
			if ( str_contains( $lower, 'image ' . $position ) || str_contains( $lower, 'photo ' . $position ) ) {
				$settings['imagePosition'] = $position;
			}
		}
		foreach ( array( 'rounded', 'square', 'soft' ) as $shape ) {
			if ( str_contains( $lower, $shape . ' image' ) || str_contains( $lower, $shape . ' photo' ) ) {
				$settings['imageShape'] = $shape;
			}
		}
		if ( str_contains( $lower, 'background video' ) || str_contains( $lower, 'video background' ) ) {
			$settings['videoMode'] = 'background';
		} elseif ( str_contains( $lower, 'inline video' ) || str_contains( $lower, 'video in section' ) ) {
			$settings['videoMode'] = 'inline';
		}

		return $settings;
	}

	/**
	 * Sanitize a section type carried by an action.
	 *
	 * @param string $type Type.
	 */
	private function sanitize_section_type( string $type ): string {
		$type    = sanitize_key( $type );
		$allowed = array( 'header', 'hero', 'features', 'pricing', 'form', 'faq', 'cta', 'testimonials', 'gallery', 'process', 'comparison', 'local', 'newsletter', 'logos', 'stats', 'footer' );

		return in_array( $type, $allowed, true ) ? $type : '';
	}

	/**
	 * Sanitize style settings carried by an action.
	 *
	 * @param array<string,mixed> $settings Settings.
	 * @return array<string,mixed>
	 */
	private function sanitize_action_settings( array $settings ): array {
		$clean = array();

		if ( isset( $settings['background'] ) && in_array( $settings['background'], array( 'plain', 'soft', 'elevated', 'hero' ), true ) ) {
			$clean['background'] = $settings['background'];
		}
		if ( isset( $settings['spacing'] ) && in_array( $settings['spacing'], array( 'compact', 'lg', 'xl' ), true ) ) {
			$clean['spacing'] = $settings['spacing'];
		}
		if ( isset( $settings['width'] ) && in_array( $settings['width'], array( 'boxed', 'wide', 'full' ), true ) ) {
			$clean['width'] = $settings['width'];
		}
		if ( isset( $settings['textAlign'] ) && in_array( $settings['textAlign'], array( 'left', 'center', 'right' ), true ) ) {
			$clean['textAlign'] = $settings['textAlign'];
		}
		if ( isset( $settings['headingScale'] ) && in_array( $settings['headingScale'], array( 'compact', 'standard', 'display' ), true ) ) {
			$clean['headingScale'] = $settings['headingScale'];
		}
		if ( isset( $settings['textWidth'] ) && in_array( $settings['textWidth'], array( 'narrow', 'standard', 'wide' ), true ) ) {
			$clean['textWidth'] = $settings['textWidth'];
		}
		if ( isset( $settings['bodyScale'] ) && in_array( $settings['bodyScale'], array( 'compact', 'standard', 'large' ), true ) ) {
			$clean['bodyScale'] = $settings['bodyScale'];
		}
		if ( isset( $settings['buttonStyle'] ) && in_array( $settings['buttonStyle'], array( 'solid', 'soft', 'outline' ), true ) ) {
			$clean['buttonStyle'] = $settings['buttonStyle'];
		}
		if ( isset( $settings['buttonSize'] ) && in_array( $settings['buttonSize'], array( 'sm', 'md', 'lg' ), true ) ) {
			$clean['buttonSize'] = $settings['buttonSize'];
		}
		if ( isset( $settings['buttonShape'] ) && in_array( $settings['buttonShape'], array( 'pill', 'rounded', 'square' ), true ) ) {
			$clean['buttonShape'] = $settings['buttonShape'];
		}
		if ( isset( $settings['imageAspect'] ) && in_array( $settings['imageAspect'], array( 'landscape', 'portrait', 'square' ), true ) ) {
			$clean['imageAspect'] = $settings['imageAspect'];
		}
		if ( isset( $settings['imagePosition'] ) && in_array( $settings['imagePosition'], array( 'center', 'top', 'bottom' ), true ) ) {
			$clean['imagePosition'] = $settings['imagePosition'];
		}
		if ( isset( $settings['imageShape'] ) && in_array( $settings['imageShape'], array( 'rounded', 'square', 'soft' ), true ) ) {
			$clean['imageShape'] = $settings['imageShape'];
		}
		if ( isset( $settings['videoMode'] ) && in_array( $settings['videoMode'], array( 'inline', 'background' ), true ) ) {
			$clean['videoMode'] = $settings['videoMode'];
		}
		if ( isset( $settings['accent'] ) && in_array( $settings['accent'], array( 'primary', 'accent', 'support', 'gold', 'ink' ), true ) ) {
			$clean['accent'] = $settings['accent'];
		}
		if ( isset( $settings['columns'] ) ) {
			$columns = absint( $settings['columns'] );
			if ( $columns >= 1 && $columns <= 4 ) {
				$clean['columns'] = $columns;
			}
		}
		if ( isset( $settings['tabletColumns'] ) ) {
			$tablet_columns = absint( $settings['tabletColumns'] );
			if ( $tablet_columns >= 1 && $tablet_columns <= 3 ) {
				$clean['tabletColumns'] = $tablet_columns;
			}
		}
		if ( isset( $settings['mobileColumns'] ) ) {
			$mobile_columns = absint( $settings['mobileColumns'] );
			if ( $mobile_columns >= 1 && $mobile_columns <= 2 ) {
				$clean['mobileColumns'] = $mobile_columns;
			}
		}
		if ( isset( $settings['mobileStack'] ) ) {
			$clean['mobileStack'] = (bool) $settings['mobileStack'];
		}

		return $clean;
	}
}
