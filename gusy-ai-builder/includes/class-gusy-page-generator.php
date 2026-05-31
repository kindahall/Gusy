<?php
/**
 * Page generator with optional LLM gateway.
 *
 * @package Gusy_AI_Builder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Builds validated page blueprints from prompts and templates.
 */
final class Gusy_AI_Builder_Page_Generator {
	/**
	 * Template repository.
	 *
	 * @var Gusy_AI_Builder_Template_Repository
	 */
	private Gusy_AI_Builder_Template_Repository $templates;

	/**
	 * Token service.
	 *
	 * @var Gusy_AI_Builder_Design_Token_Service
	 */
	private Gusy_AI_Builder_Design_Token_Service $tokens;

	/**
	 * Optional LLM gateway.
	 *
	 * @var Gusy_AI_Builder_LLM_Gateway|null
	 */
	private ?Gusy_AI_Builder_LLM_Gateway $llm;

	/**
	 * Constructor.
	 *
	 * @param Gusy_AI_Builder_Template_Repository $templates Templates.
	 * @param Gusy_AI_Builder_Design_Token_Service $tokens Tokens.
	 * @param Gusy_AI_Builder_LLM_Gateway|null $llm LLM gateway.
	 */
	public function __construct( Gusy_AI_Builder_Template_Repository $templates, Gusy_AI_Builder_Design_Token_Service $tokens, ?Gusy_AI_Builder_LLM_Gateway $llm = null ) {
		$this->templates = $templates;
		$this->tokens    = $tokens;
		$this->llm       = $llm;
	}

	/**
	 * Generate a complete landing page blueprint.
	 *
	 * @param string              $prompt User prompt.
	 * @param array<string,mixed> $brand_kit Optional brand kit.
	 * @param bool                $use_llm Whether configured LLM providers may be used.
	 * @return array<string,mixed>|WP_Error
	 */
	public function generate_page( string $prompt, array $brand_kit = array(), bool $use_llm = true ) {
		$prompt = trim( wp_strip_all_tags( $prompt ) );

		if ( '' === $prompt ) {
			return new WP_Error( 'gusy_prompt_required', __( 'Prompt required.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$local = $this->build_local_blueprint( $prompt, $brand_kit );

		if ( $use_llm && $this->llm && $this->llm->is_configured() ) {
			$response = $this->llm->complete_json(
				$this->page_system_prompt(),
				$this->page_user_prompt( $prompt, $brand_kit, $local ),
				$this->blueprint_shape(),
				5200
			);

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$blueprint           = $this->sanitize_blueprint_response( $response, $local );
			$blueprint['source'] = array_merge(
				$this->llm->source(),
				array(
					'prompt' => $prompt,
				)
			);

			return $blueprint;
		}

		$local['source']['type'] = 'local-fallback';

		return $local;
	}

	/**
	 * Generate a single section from a template.
	 *
	 * @param string              $type Section type.
	 * @param string              $prompt User prompt.
	 * @param array<string,mixed> $template_section Template section.
	 * @param bool                $use_llm Whether configured LLM providers may be used.
	 * @return array<string,mixed>|WP_Error
	 */
	public function generate_section( string $type, string $prompt, array $template_section, bool $use_llm = true ) {
		$prompt = trim( wp_strip_all_tags( $prompt ) );
		$type   = sanitize_key( $type );
		$local  = $template_section;

		$local['id'] = sanitize_key( 'gusy-' . $type . '-' . wp_generate_uuid4() );

		if ( '' !== $prompt ) {
			$local['body']  = $this->smart_excerpt( $prompt, 180 );
			$local['title'] = $this->title_from_text( $prompt, (string) ( $local['title'] ?? 'Section' ) );
		}

		$local = $this->sanitize_section( $local );

		if ( $use_llm && $this->llm && $this->llm->is_configured() && '' !== $prompt ) {
			$response = $this->llm->complete_json(
				$this->section_system_prompt(),
				"Section type: {$type}\nPrompt: {$prompt}\nBase section JSON: " . wp_json_encode( $local ),
				array( 'section' => $this->section_shape() ),
				2200
			);

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$section       = isset( $response['section'] ) && is_array( $response['section'] ) ? $response['section'] : $response;
			$section['id'] = $local['id'];

			return $this->sanitize_section( $section );
		}

		return $local;
	}

	/**
	 * Build local fallback blueprint.
	 *
	 * @param string              $prompt Prompt.
	 * @param array<string,mixed> $brand_kit Brand kit.
	 * @return array<string,mixed>
	 */
	private function build_local_blueprint( string $prompt, array $brand_kit ): array {
		$profile  = $this->profile_prompt( $prompt );
		$tokens   = $this->tokens->from_prompt( $prompt, $brand_kit );
		$sections = $this->templates->starter_page_sections( $profile['businessType'] );
		$sections = $this->adapt_sections( $sections, $profile, $prompt );

		$title = $this->page_title( $profile );

		return array(
			'schemaVersion' => '1.0',
			'page'          => array(
				'title'        => $title,
				'slug'         => sanitize_title( $title ),
				'language'     => 'en',
				'seo'          => array(
					'metaTitle'       => $this->seo_title( $profile ),
					'metaDescription' => $this->seo_description( $profile ),
				),
				'designSystem' => $tokens,
				'sections'     => $sections,
			),
			'audits'        => $this->audit_blueprint( $sections ),
			'generatedAt'   => gmdate( 'c' ),
			'source'        => array(
				'type'   => 'local-orchestrator',
				'prompt' => $prompt,
			),
		);
	}

	/**
	 * Transform a section according to a contextual prompt.
	 *
	 * @param array<string,mixed> $section Section.
	 * @param string              $instruction Instruction.
	 * @param bool                $use_llm Whether configured LLM providers may be used.
	 * @return array<string,mixed>|WP_Error
	 */
	public function transform_section( array $section, string $instruction, bool $use_llm = true ) {
		$instruction = trim( wp_strip_all_tags( $instruction ) );
		$local       = $this->transform_section_locally( $section, $instruction );

		if ( $use_llm && $this->llm && $this->llm->is_configured() && '' !== $instruction ) {
			$response = $this->llm->complete_json(
				$this->section_system_prompt(),
				"Instruction: {$instruction}\nCurrent section JSON: " . wp_json_encode( $section ),
				array( 'section' => $this->section_shape() ),
				2200
			);

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$updated       = isset( $response['section'] ) && is_array( $response['section'] ) ? $response['section'] : $response;
			$updated['id'] = (string) ( $section['id'] ?? $local['id'] );

			return $this->sanitize_section( $updated );
		}

		return $local;
	}

	/**
	 * Local deterministic transform fallback.
	 *
	 * @param array<string,mixed> $section Section.
	 * @param string              $instruction Instruction.
	 * @return array<string,mixed>
	 */
	private function transform_section_locally( array $section, string $instruction ): array {
		$lower       = strtolower( remove_accents( $instruction ) );
		$before_json = wp_json_encode( $section );

		if ( ! isset( $section['settings'] ) || ! is_array( $section['settings'] ) ) {
			$section['settings'] = array();
		}

		$clean_instruction = preg_replace( '/^(Canvas annotation|Page note) for the ".+?" section:\s*/i', '', $instruction );
		$clean_instruction = preg_replace( '/\s*Apply the requested change directly.*$/i', '', (string) $clean_instruction );
		$quoted            = '';

		if ( preg_match( '/["“”]([^"“”]{3,140})["“”]/u', (string) $clean_instruction, $matches ) ) {
			$quoted = sanitize_text_field( $matches[1] );
		}

		if ( '' !== $quoted && ( str_contains( $lower, 'title' ) || str_contains( $lower, 'headline' ) || str_contains( $lower, 'titre' ) ) ) {
			$section['title'] = $quoted;
		} elseif ( '' !== $quoted && ( str_contains( $lower, 'button' ) || str_contains( $lower, 'cta' ) || str_contains( $lower, 'bouton' ) ) ) {
			$section['cta']['label'] = $quoted;
		} elseif ( '' !== $quoted && ( str_contains( $lower, 'text' ) || str_contains( $lower, 'body' ) || str_contains( $lower, 'texte' ) ) ) {
			$section['body'] = $quoted;
		}

		if ( str_contains( $lower, 'premium' ) || str_contains( $lower, 'moderne' ) ) {
			$section['variant'] = 'premium-' . sanitize_key( (string) ( $section['type'] ?? 'section' ) );
			$section['settings']['background'] = 'elevated';
			$section['settings']['spacing']    = 'xl';
			$section['kicker'] = $this->append_once( (string) ( $section['kicker'] ?? 'Section' ), 'Refined design' );
			$section['title']  = $this->tighten_title( (string) ( $section['title'] ?? 'Premium section' ) );
			$section['body']   = $this->append_sentence(
				(string) ( $section['body'] ?? '' ),
				'The visual hierarchy puts proof, benefit and action in a clearer order.'
			);
		}

		if ( str_contains( $lower, 'bento' ) || str_contains( $lower, 'grille' ) ) {
			$section['variant'] = 'bento';
			$section['settings']['columns'] = 3;
		}

		if ( str_contains( $lower, 'mobile' ) || str_contains( $lower, 'responsive' ) ) {
			$section['settings']['mobileStack'] = true;
			$section['settings']['spacing']     = 'lg';
			$section['notes'][] = 'Optimized for mobile reading with clear stacking.';
		}

		if ( str_contains( $lower, 'conversion' ) || str_contains( $lower, 'cta' ) ) {
			$section['cta']['label'] = 'Get a proposal';
			$section['body'] = $this->append_sentence(
				(string) ( $section['body'] ?? '' ),
				'The call to action is phrased to reduce friction and increase qualified enquiries.'
			);
		}

		if ( str_contains( $lower, 'corporate' ) || str_contains( $lower, 'sobre' ) ) {
			$section['variant'] = 'corporate-clean';
			$section['settings']['background'] = 'plain';
			$section['settings']['spacing'] = 'lg';
		}

		if ( $before_json === wp_json_encode( $section ) ) {
			$section['settings']['background'] = str_contains( $lower, 'color' ) || str_contains( $lower, 'couleur' ) || str_contains( $lower, 'colore' ) ? 'elevated' : (string) ( $section['settings']['background'] ?? 'plain' );
			$section['variant'] = 'annotated-' . sanitize_key( (string) ( $section['type'] ?? 'section' ) );
			$section['body']    = $this->append_sentence(
				(string) ( $section['body'] ?? '' ),
				'Updated to match the annotation: ' . $this->smart_excerpt( (string) $clean_instruction, 110 ) . '.'
			);

			$section['notes'][] = 'Applied annotation: ' . $this->smart_excerpt( (string) $clean_instruction, 120 );
		}

		$section['updatedAt'] = gmdate( 'c' );

		return $this->sanitize_section( $section );
	}

	/**
	 * Audit sections and return actionable checks.
	 *
	 * @param array<int,array<string,mixed>> $sections Sections.
	 * @return array<string,mixed>
	 */
	public function audit_blueprint( array $sections ): array {
		$has_form = false;
		$has_faq  = false;
		$has_cta  = false;

		foreach ( $sections as $section ) {
			$type = (string) ( $section['type'] ?? '' );
			$has_form = $has_form || 'form' === $type;
			$has_faq  = $has_faq || 'faq' === $type;
			$has_cta  = $has_cta || ( isset( $section['cta']['label'] ) && '' !== $section['cta']['label'] );
		}

		return array(
			'seo'           => $has_faq ? 'FAQ structure helps objections and long-tail search.' : 'Add a FAQ to improve SEO coverage.',
			'accessibility' => 'Contrast, visible focus, form labels and native accordions are planned.',
			'performance'   => 'Shared CSS and conditional frontend JS only for forms, pricing or interactions.',
			'conversion'    => $has_form && $has_cta ? 'Complete flow with CTA and lead capture.' : 'Add a form or final CTA to close the flow.',
		);
	}

	/**
	 * Prompt used for full page generation.
	 */
	private function page_system_prompt(): string {
		return 'You generate production-ready WordPress landing page blueprints for Gusy. Write all page content in English. Create concrete, useful sections based on the user prompt. Avoid placeholder text, fake metrics, fake testimonials, and explanatory product-tour copy. Use concise labels and conversion-focused content.';
	}

	/**
	 * Prompt used for one section generation or transform.
	 */
	private function section_system_prompt(): string {
		return 'You edit one Gusy page section. Keep the same JSON structure, write in English, preserve the section id when possible, and return only the improved section JSON. Do not invent fake testimonials, fake company names, or fake statistics.';
	}

	/**
	 * Build the page user prompt.
	 *
	 * @param string              $prompt Prompt.
	 * @param array<string,mixed> $brand_kit Brand kit.
	 * @param array<string,mixed> $local Local fallback.
	 */
	private function page_user_prompt( string $prompt, array $brand_kit, array $local ): string {
		return 'User request: ' . $prompt
			. "\nBrand kit JSON: " . wp_json_encode( $brand_kit )
			. "\nLocal fallback blueprint JSON: " . wp_json_encode( $local )
			. "\nReturn a complete blueprint with 4 to 7 sections. Use section types such as hero, features, pricing, faq, form, testimonials, cta, gallery, footer only when they fit the request.";
	}

	/**
	 * Expected full blueprint shape.
	 *
	 * @return array<string,mixed>
	 */
	private function blueprint_shape(): array {
		return array(
			'schemaVersion' => '1.0',
			'page'          => array(
				'title'        => 'Landing page title',
				'slug'         => 'landing-page-title',
				'language'     => 'en',
				'seo'          => array(
					'metaTitle'       => 'SEO title',
					'metaDescription' => 'SEO description between 120 and 160 characters',
				),
				'designSystem' => array(),
				'sections'     => array(
					$this->section_shape(),
				),
			),
		);
	}

	/**
	 * Expected section shape.
	 *
	 * @return array<string,mixed>
	 */
	private function section_shape(): array {
		return array(
			'id'       => 'gusy-section-id',
			'type'     => 'hero',
			'variant'  => 'default',
			'label'    => 'Hero Section',
			'intent'   => 'What this section achieves',
			'kicker'   => 'Short label',
			'title'    => 'Clear section headline',
			'body'     => 'Useful supporting text',
			'cta'      => array(
				'label'          => 'Primary action',
				'url'            => '#contact',
				'secondaryLabel' => 'Secondary action',
				'secondaryUrl'   => '#details',
			),
			'items'    => array(
				array(
					'title' => 'Item title',
					'body'  => 'Item body',
					'label' => 'Item label',
				),
			),
			'settings' => array(
				'background'  => 'plain',
				'spacing'     => 'lg',
				'columns'     => 3,
				'mobileStack' => true,
				'interactive' => false,
			),
			'notes'    => array(),
		);
	}

	/**
	 * Sanitize LLM blueprint while keeping a valid fallback.
	 *
	 * @param array<string,mixed> $response LLM response.
	 * @param array<string,mixed> $fallback Fallback blueprint.
	 * @return array<string,mixed>
	 */
	private function sanitize_blueprint_response( array $response, array $fallback ): array {
		$page          = isset( $response['page'] ) && is_array( $response['page'] ) ? $response['page'] : $response;
		$fallback_page = isset( $fallback['page'] ) && is_array( $fallback['page'] ) ? $fallback['page'] : array();
		$raw_sections  = isset( $page['sections'] ) && is_array( $page['sections'] ) ? $page['sections'] : array();
		$sections      = array();

		foreach ( $raw_sections as $index => $section ) {
			if ( ! is_array( $section ) ) {
				continue;
			}

			if ( empty( $section['id'] ) ) {
				$section['id'] = 'gusy-' . sanitize_key( (string) ( $section['type'] ?? 'section' ) ) . '-' . ( $index + 1 );
			}

			$sections[] = $this->sanitize_section( $section );
		}

		if ( empty( $sections ) && isset( $fallback_page['sections'] ) && is_array( $fallback_page['sections'] ) ) {
			$sections = array_map( array( $this, 'sanitize_section' ), $fallback_page['sections'] );
		}

		$title  = sanitize_text_field( (string) ( $page['title'] ?? $fallback_page['title'] ?? 'Gusy Page' ) );
		$slug   = sanitize_title( (string) ( $page['slug'] ?? $title ) );
		$seo    = isset( $page['seo'] ) && is_array( $page['seo'] ) ? $page['seo'] : array();
		$tokens = isset( $page['designSystem'] ) && is_array( $page['designSystem'] )
			? $this->tokens->normalize_tokens( $page['designSystem'] )
			: (array) ( $fallback_page['designSystem'] ?? $this->tokens->default_tokens() );

		return array(
			'schemaVersion' => '1.0',
			'page'          => array(
				'title'        => '' !== $title ? $title : 'Gusy Page',
				'slug'         => '' !== $slug ? $slug : 'gusy-page',
				'language'     => 'en',
				'seo'          => array(
					'metaTitle'       => sanitize_text_field( (string) ( $seo['metaTitle'] ?? $title ) ),
					'metaDescription' => sanitize_textarea_field( (string) ( $seo['metaDescription'] ?? '' ) ),
					'schemaJsonLd'    => isset( $seo['schemaJsonLd'] ) && is_array( $seo['schemaJsonLd'] ) ? $seo['schemaJsonLd'] : array(),
				),
				'designSystem' => $tokens,
				'sections'     => $sections,
			),
			'audits'        => $this->audit_blueprint( $sections ),
			'generatedAt'   => gmdate( 'c' ),
		);
	}

	/**
	 * Infer page profile from prompt.
	 *
	 * @param string $prompt Prompt.
	 * @return array<string,string>
	 */
	private function profile_prompt( string $prompt ): array {
		$lower = strtolower( remove_accents( $prompt ) );

		$business_type = 'saas';
		if ( str_contains( $lower, 'avocat' ) || str_contains( $lower, 'lyon' ) || str_contains( $lower, 'restaurant' ) || str_contains( $lower, 'local' ) || str_contains( $lower, 'cabinet' ) ) {
			$business_type = 'local';
		}
		if ( str_contains( $lower, 'agence' ) || str_contains( $lower, 'freelance' ) || str_contains( $lower, 'studio' ) ) {
			$business_type = 'agency';
		}

		$sector = 'premium service';
		if ( str_contains( $lower, 'avocat' ) ) {
			$sector = 'business law firm';
		} elseif ( str_contains( $lower, 'saas' ) || str_contains( $lower, 'logiciel' ) ) {
			$sector = 'SaaS product';
		} elseif ( str_contains( $lower, 'restaurant' ) ) {
			$sector = 'restaurant';
		} elseif ( str_contains( $lower, 'ecommerce' ) || str_contains( $lower, 'e-commerce' ) ) {
			$sector = 'e-commerce';
		} elseif ( str_contains( $lower, 'agence' ) ) {
			$sector = 'web agency';
		}

		$city = '';
		if ( preg_match( '/\b(?:a|à|sur)\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ-]+)/u', $prompt, $matches ) ) {
			$city = sanitize_text_field( $matches[1] );
		}

		$tone = 'premium';
		if ( str_contains( $lower, 'sobre' ) ) {
			$tone = 'sobre';
		}
		if ( str_contains( $lower, 'audacieux' ) || str_contains( $lower, 'creatif' ) ) {
			$tone = 'audacieux';
		}

		return array(
			'businessType' => $business_type,
			'sector'       => $sector,
			'city'         => $city,
			'tone'         => $tone,
		);
	}

	/**
	 * Adapt starter sections to the inferred profile.
	 *
	 * @param array<int,array<string,mixed>> $sections Sections.
	 * @param array<string,string>           $profile Profile.
	 * @param string                         $prompt Prompt.
	 * @return array<int,array<string,mixed>>
	 */
	private function adapt_sections( array $sections, array $profile, string $prompt ): array {
		$adapted = array();
		$index   = 1;

		foreach ( $sections as $section ) {
			$section['id'] = sanitize_key( 'gusy-' . ( $section['type'] ?? 'section' ) . '-' . $index );

			if ( 1 === $index ) {
				$section['title'] = $this->hero_title( $profile );
				$section['body']  = $this->hero_body( $profile, $prompt );
				$section['kicker'] = 'Gusy AI Builder';
				$section['cta']['label'] = 'Request a proposal';
				$section['cta']['secondaryLabel'] = 'See the method';
			}

			if ( 'pricing' === ( $section['type'] ?? '' ) ) {
				$section['items'] = $this->pricing_for_profile( $profile );
			}

			if ( 'faq' === ( $section['type'] ?? '' ) ) {
				$section['items'] = $this->faq_for_profile( $profile );
			}

			if ( 'form' === ( $section['type'] ?? '' ) ) {
				$section['title'] = 'Describe your project in a few lines';
				$section['body']  = 'Gusy prepares a structured request so you can answer quickly with the right level of detail.';
				$section['cta']['label'] = 'Send request';
			}

			$adapted[] = $this->sanitize_section( $section );
			$index++;
		}

		return $adapted;
	}

	/**
	 * Sanitize a section recursively.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return array<string,mixed>
	 */
	private function sanitize_section( array $section ): array {
		$background_image = array();
		if ( isset( $section['settings']['backgroundImage'] ) && is_array( $section['settings']['backgroundImage'] ) ) {
			$image_url = esc_url_raw( (string) ( $section['settings']['backgroundImage']['url'] ?? '' ) );
			if ( '' !== $image_url ) {
				$background_image = array(
					'id'    => absint( $section['settings']['backgroundImage']['id'] ?? 0 ),
					'url'   => $image_url,
					'alt'   => sanitize_text_field( (string) ( $section['settings']['backgroundImage']['alt'] ?? '' ) ),
					'title' => sanitize_text_field( (string) ( $section['settings']['backgroundImage']['title'] ?? '' ) ),
				);
			}
		}
		$background_video = array();
		if ( isset( $section['settings']['backgroundVideo'] ) && is_array( $section['settings']['backgroundVideo'] ) ) {
			$video_url = esc_url_raw( (string) ( $section['settings']['backgroundVideo']['url'] ?? '' ) );
			if ( '' !== $video_url ) {
				$background_video = array(
					'id'     => absint( $section['settings']['backgroundVideo']['id'] ?? 0 ),
					'url'    => $video_url,
					'title'  => sanitize_text_field( (string) ( $section['settings']['backgroundVideo']['title'] ?? '' ) ),
					'poster' => esc_url_raw( (string) ( $section['settings']['backgroundVideo']['poster'] ?? '' ) ),
					'mime'   => sanitize_text_field( (string) ( $section['settings']['backgroundVideo']['mime'] ?? '' ) ),
				);
			}
		}

		$clean = array(
			'id'       => sanitize_key( (string) ( $section['id'] ?? wp_unique_id( 'gusy-section-' ) ) ),
			'type'     => sanitize_key( (string) ( $section['type'] ?? 'section' ) ),
			'variant'  => sanitize_key( (string) ( $section['variant'] ?? 'default' ) ),
			'label'    => sanitize_text_field( (string) ( $section['label'] ?? 'Section' ) ),
			'intent'   => sanitize_text_field( (string) ( $section['intent'] ?? '' ) ),
			'kicker'   => sanitize_text_field( (string) ( $section['kicker'] ?? '' ) ),
			'title'    => sanitize_text_field( (string) ( $section['title'] ?? '' ) ),
			'body'     => sanitize_textarea_field( (string) ( $section['body'] ?? '' ) ),
			'cta'      => array(
				'label'          => sanitize_text_field( (string) ( $section['cta']['label'] ?? '' ) ),
				'url'            => esc_url_raw( (string) ( $section['cta']['url'] ?? '#contact' ) ),
				'secondaryLabel' => sanitize_text_field( (string) ( $section['cta']['secondaryLabel'] ?? '' ) ),
				'secondaryUrl'   => esc_url_raw( (string) ( $section['cta']['secondaryUrl'] ?? '#proof' ) ),
			),
			'items'    => array(),
			'settings' => $this->sanitize_section_settings( $section, $background_image, $background_video ),
			'notes'    => array(),
		);

		if ( isset( $section['items'] ) && is_array( $section['items'] ) ) {
			foreach ( $section['items'] as $item ) {
				if ( ! is_array( $item ) ) {
					continue;
				}

				$clean['items'][] = array(
					'title' => sanitize_text_field( (string) ( $item['title'] ?? '' ) ),
					'body'  => sanitize_textarea_field( (string) ( $item['body'] ?? '' ) ),
					'label' => sanitize_text_field( (string) ( $item['label'] ?? '' ) ),
				);
			}
		}

		if ( isset( $section['notes'] ) && is_array( $section['notes'] ) ) {
			foreach ( $section['notes'] as $note ) {
				$clean['notes'][] = sanitize_text_field( (string) $note );
			}
		}

		return $clean;
	}

	/**
	 * Sanitize section layout and visual settings.
	 *
	 * @param array<string,mixed> $section Section.
	 * @param array<string,mixed> $background_image Background image.
	 * @param array<string,mixed> $background_video Background video.
	 * @return array<string,mixed>
	 */
	private function sanitize_section_settings( array $section, array $background_image, array $background_video ): array {
		$settings = isset( $section['settings'] ) && is_array( $section['settings'] ) ? $section['settings'] : array();
		$columns  = max( 1, min( 4, absint( $settings['columns'] ?? 2 ) ) );
		$text_align = sanitize_key( (string) ( $settings['textAlign'] ?? 'left' ) );
		$heading_scale = sanitize_key( (string) ( $settings['headingScale'] ?? 'standard' ) );
		$text_width = sanitize_key( (string) ( $settings['textWidth'] ?? 'standard' ) );
		$body_scale = sanitize_key( (string) ( $settings['bodyScale'] ?? 'standard' ) );
		$button_style = sanitize_key( (string) ( $settings['buttonStyle'] ?? 'solid' ) );
		$button_size = sanitize_key( (string) ( $settings['buttonSize'] ?? 'md' ) );
		$button_shape = sanitize_key( (string) ( $settings['buttonShape'] ?? 'pill' ) );
		$image_aspect = sanitize_key( (string) ( $settings['imageAspect'] ?? 'landscape' ) );
		$image_position = sanitize_key( (string) ( $settings['imagePosition'] ?? 'center' ) );
		$image_shape = sanitize_key( (string) ( $settings['imageShape'] ?? 'rounded' ) );
		$video_mode = sanitize_key( (string) ( $settings['videoMode'] ?? 'inline' ) );
		if ( ! in_array( $text_align, array( 'left', 'center', 'right' ), true ) ) {
			$text_align = 'left';
		}
		if ( ! in_array( $heading_scale, array( 'compact', 'standard', 'display' ), true ) ) {
			$heading_scale = 'standard';
		}
		if ( ! in_array( $text_width, array( 'narrow', 'standard', 'wide' ), true ) ) {
			$text_width = 'standard';
		}
		if ( ! in_array( $body_scale, array( 'compact', 'standard', 'large' ), true ) ) {
			$body_scale = 'standard';
		}
		if ( ! in_array( $button_style, array( 'solid', 'soft', 'outline' ), true ) ) {
			$button_style = 'solid';
		}
		if ( ! in_array( $button_size, array( 'sm', 'md', 'lg' ), true ) ) {
			$button_size = 'md';
		}
		if ( ! in_array( $button_shape, array( 'pill', 'rounded', 'square' ), true ) ) {
			$button_shape = 'pill';
		}
		if ( ! in_array( $image_aspect, array( 'landscape', 'portrait', 'square' ), true ) ) {
			$image_aspect = 'landscape';
		}
		if ( ! in_array( $image_position, array( 'center', 'top', 'bottom' ), true ) ) {
			$image_position = 'center';
		}
		if ( ! in_array( $image_shape, array( 'rounded', 'square', 'soft' ), true ) ) {
			$image_shape = 'rounded';
		}
		if ( ! in_array( $video_mode, array( 'inline', 'background' ), true ) ) {
			$video_mode = 'inline';
		}

		return array(
			'background'      => sanitize_key( (string) ( $settings['background'] ?? 'plain' ) ),
			'spacing'         => sanitize_key( (string) ( $settings['spacing'] ?? 'lg' ) ),
			'columns'         => $columns,
			'tabletColumns'   => max( 1, min( 3, absint( $settings['tabletColumns'] ?? min( $columns, 2 ) ) ) ),
			'mobileColumns'   => max( 1, min( 2, absint( $settings['mobileColumns'] ?? 1 ) ) ),
			'accent'          => sanitize_key( (string) ( $settings['accent'] ?? 'accent' ) ),
			'width'           => sanitize_key( (string) ( $settings['width'] ?? 'wide' ) ),
			'textAlign'       => $text_align,
			'headingScale'    => $heading_scale,
			'textWidth'       => $text_width,
			'bodyScale'       => $body_scale,
			'buttonStyle'     => $button_style,
			'buttonSize'      => $button_size,
			'buttonShape'     => $button_shape,
			'imageAspect'     => $image_aspect,
			'imagePosition'   => $image_position,
			'imageShape'      => $image_shape,
			'backgroundImage' => $background_image,
			'backgroundVideo' => $background_video,
			'videoMode'       => $video_mode,
			'mobileStack'     => (bool) ( $settings['mobileStack'] ?? true ),
			'interactive'     => (bool) ( $settings['interactive'] ?? false ),
		);
	}

	/**
	 * Page title.
	 *
	 * @param array<string,string> $profile Profile.
	 * @return string
	 */
	private function page_title( array $profile ): string {
		$sector = ucfirst( $profile['sector'] );
		$city   = $profile['city'] ? ' in ' . $profile['city'] : '';

		return $sector . $city . ' - Gusy landing page';
	}

	/**
	 * SEO title.
	 *
	 * @param array<string,string> $profile Profile.
	 * @return string
	 */
	private function seo_title( array $profile ): string {
		$city = $profile['city'] ? ' in ' . $profile['city'] : '';

		return ucfirst( $profile['sector'] ) . $city . ' | Premium page';
	}

	/**
	 * SEO description.
	 *
	 * @param array<string,string> $profile Profile.
	 * @return string
	 */
	private function seo_description( array $profile ): string {
		$city = $profile['city'] ? ' in ' . $profile['city'] : '';

		return 'Discover a clear offer for ' . $profile['sector'] . $city . ', with proof, pricing, FAQ and a contact form.';
	}

	/**
	 * Hero title.
	 *
	 * @param array<string,string> $profile Profile.
	 * @return string
	 */
	private function hero_title( array $profile ): string {
		$city = $profile['city'] ? ' in ' . $profile['city'] : '';

		if ( 'business law firm' === $profile['sector'] ) {
			return 'A business law firm' . $city . ' built for decision-makers';
		}

		if ( 'SaaS product' === $profile['sector'] ) {
			return 'Present your SaaS with a clear, fast and persuasive page';
		}

		if ( 'web agency' === $profile['sector'] ) {
			return 'An agency that turns ideas into pages ready to convert';
		}

		return 'A premium page built to convert faster';
	}

	/**
	 * Hero body.
	 *
	 * @param array<string,string> $profile Profile.
	 * @param string               $prompt Prompt.
	 * @return string
	 */
	private function hero_body( array $profile, string $prompt ): string {
		unset( $prompt );

		if ( 'business law firm' === $profile['sector'] ) {
			return 'Create a calm, credible presence to present your expertise, reassure decision-makers and generate qualified enquiries.';
		}

		if ( 'SaaS product' === $profile['sector'] ) {
			return 'Explain product value, show key benefits and guide visitors toward a demo or trial.';
		}

		return 'Gusy assembles a conversion-focused structure, coherent design system and editable WordPress blocks without lock-in.';
	}

	/**
	 * Pricing for profile.
	 *
	 * @param array<string,string> $profile Profile.
	 * @return array<int,array<string,string>>
	 */
	private function pricing_for_profile( array $profile ): array {
		if ( 'business law firm' === $profile['sector'] ) {
			return array(
				array( 'title' => 'Consultation', 'body' => 'Initial analysis, situation framing and next steps.', 'label' => 'Custom' ),
				array( 'title' => 'Support', 'body' => 'Contract follow-up, negotiation or disputes with clear reporting.', 'label' => 'Fixed fee' ),
				array( 'title' => 'Legal desk', 'body' => 'Recurring support for leaders and operational teams.', 'label' => 'Monthly' ),
			);
		}

		return array(
			array( 'title' => 'Starter', 'body' => 'Launch a clean page with essential sections.', 'label' => '$59/yr' ),
			array( 'title' => 'Pro', 'body' => 'Produce faster with contextual AI and brand kits.', 'label' => '$149/yr' ),
			array( 'title' => 'Agency', 'body' => 'Standardize client production and approval flows.', 'label' => '$349/yr' ),
		);
	}

	/**
	 * FAQ for profile.
	 *
	 * @param array<string,string> $profile Profile.
	 * @return array<int,array<string,string>>
	 */
	private function faq_for_profile( array $profile ): array {
		if ( 'business law firm' === $profile['sector'] ) {
			return array(
				array( 'title' => 'When should we talk?', 'body' => 'As soon as a contract decision, negotiation or dispute may affect the business.', 'label' => 'Timing' ),
				array( 'title' => 'Are exchanges confidential?', 'body' => 'Yes, shared information is handled with a high level of confidentiality.', 'label' => 'Trust' ),
				array( 'title' => 'Can we frame a budget before starting?', 'body' => 'Yes, the first step clarifies scope, urgency and billing model.', 'label' => 'Budget' ),
			);
		}

		return array(
			array( 'title' => 'Does the page stay editable in WordPress?', 'body' => 'Yes, the output prioritizes native blocks and readable structure.', 'label' => 'WordPress' ),
			array( 'title' => 'Can I edit one section without touching the rest?', 'body' => 'Yes, contextual editing acts on the selected section.', 'label' => 'Editing' ),
			array( 'title' => 'Is the layout optimized for mobile?', 'body' => 'Sections use simple, stable and adjustable responsive rules.', 'label' => 'Mobile' ),
		);
	}

	/**
	 * Build a compact excerpt.
	 *
	 * @param string $text Text.
	 * @param int    $limit Character limit.
	 */
	private function smart_excerpt( string $text, int $limit ): string {
		$text = trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( $text ) ) );
		if ( strlen( $text ) <= $limit ) {
			return sanitize_text_field( $text );
		}

		$text = substr( $text, 0, $limit );
		$text = preg_replace( '/\s+\S*$/', '', $text );

		return sanitize_text_field( trim( (string) $text ) );
	}

	/**
	 * Create a title from user text.
	 *
	 * @param string $text Text.
	 * @param string $fallback Fallback.
	 */
	private function title_from_text( string $text, string $fallback ): string {
		$text = $this->smart_excerpt( $text, 72 );
		if ( '' === $text ) {
			return sanitize_text_field( $fallback );
		}

		return ucwords( strtolower( $text ) );
	}

	/**
	 * Append a short label once.
	 *
	 * @param string $text Text.
	 * @param string $append Append.
	 * @return string
	 */
	private function append_once( string $text, string $append ): string {
		return str_contains( $text, $append ) ? $text : trim( $text . ' · ' . $append );
	}

	/**
	 * Make title more direct.
	 *
	 * @param string $title Title.
	 * @return string
	 */
	private function tighten_title( string $title ): string {
		if ( str_contains( strtolower( remove_accents( $title ) ), 'premium' ) ) {
			return $title;
		}

		return $title . ', with a more premium finish';
	}

	/**
	 * Append sentence if missing.
	 *
	 * @param string $body Body.
	 * @param string $sentence Sentence.
	 * @return string
	 */
	private function append_sentence( string $body, string $sentence ): string {
		if ( str_contains( $body, $sentence ) ) {
			return $body;
		}

		return trim( $body . ' ' . $sentence );
	}
}
