<?php
/**
 * Gutenberg block serializer.
 *
 * @package Gusy_AI_Builder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Converts Gusy blueprints into clean WordPress block content.
 */
final class Gusy_AI_Builder_Block_Serializer {
	/**
	 * Token service.
	 *
	 * @var Gusy_AI_Builder_Design_Token_Service
	 */
	private Gusy_AI_Builder_Design_Token_Service $tokens;

	/**
	 * Constructor.
	 *
	 * @param Gusy_AI_Builder_Design_Token_Service $tokens Token service.
	 */
	public function __construct( Gusy_AI_Builder_Design_Token_Service $tokens ) {
		$this->tokens = $tokens;
	}

	/**
	 * Serialize a page blueprint.
	 *
	 * @param array<string,mixed> $blueprint Blueprint.
	 * @return string
	 */
	public function serialize_page( array $blueprint ): string {
		$page     = isset( $blueprint['page'] ) && is_array( $blueprint['page'] ) ? $blueprint['page'] : array();
		$sections = isset( $page['sections'] ) && is_array( $page['sections'] ) ? $page['sections'] : array();
		$tokens   = isset( $page['designSystem'] ) && is_array( $page['designSystem'] ) ? $page['designSystem'] : $this->tokens->default_tokens();
		$tokens   = $this->tokens->normalize_tokens( $tokens );
		$style    = '<!-- wp:html -->' . "\n" . '<style id="gusy-inline-tokens">' . $this->minify_css( $this->tokens->css_variables( $tokens, '.gusy-page' ) ) . '</style>' . "\n" . '<!-- /wp:html -->' . "\n\n";

		$content = '';
		foreach ( $sections as $section ) {
			if ( is_array( $section ) ) {
				$content .= $this->serialize_section( $section );
			}
		}

		return $style . $this->group(
			'gusy-page alignfull',
			$content,
			array(
				'layout' => array(
					'type' => 'constrained',
				),
			)
		);
	}

	/**
	 * Serialize one section.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	public function serialize_section( array $section ): string {
		$type     = sanitize_key( (string) ( $section['type'] ?? 'section' ) );
		$variant  = sanitize_key( (string) ( $section['variant'] ?? 'default' ) );
		$id       = sanitize_key( (string) ( $section['id'] ?? wp_unique_id( 'gusy-section-' ) ) );
		$settings = isset( $section['settings'] ) && is_array( $section['settings'] ) ? $section['settings'] : array();
		$bg       = sanitize_key( (string) ( $settings['background'] ?? 'plain' ) );
		$spacing  = sanitize_key( (string) ( $settings['spacing'] ?? 'lg' ) );
		$accent   = sanitize_key( (string) ( $settings['accent'] ?? 'accent' ) );
		$width    = sanitize_key( (string) ( $settings['width'] ?? 'wide' ) );
		$columns  = max( 1, min( 4, absint( $settings['columns'] ?? 3 ) ) );
		$tablet_columns = max( 1, min( 3, absint( $settings['tabletColumns'] ?? min( $columns, 2 ) ) ) );
		$mobile_columns = max( 1, min( 2, absint( $settings['mobileColumns'] ?? 1 ) ) );
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
		$motion_enabled  = ! empty( $settings['motionEnabled'] );
		$motion_entrance = sanitize_key( (string) ( $settings['motionEntrance'] ?? 'fade-up' ) );
		$motion_duration = max( 100, min( 1200, absint( $settings['motionDuration'] ?? 600 ) ) );
		if ( ! in_array( $motion_entrance, array( 'fade-up', 'scale-in', 'slide-in' ), true ) ) {
			$motion_entrance = 'fade-up';
		}
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
		$image    = isset( $settings['backgroundImage'] ) && is_array( $settings['backgroundImage'] ) ? $settings['backgroundImage'] : array();
		$image_url = esc_url_raw( (string) ( $image['url'] ?? '' ) );
		$video    = isset( $settings['backgroundVideo'] ) && is_array( $settings['backgroundVideo'] ) ? $settings['backgroundVideo'] : array();
		$video_url = esc_url_raw( (string) ( $video['url'] ?? '' ) );
		$classes  = trim( 'gusy-section gusy-section-' . $type . ' gusy-variant-' . $variant . ' gusy-bg-' . $bg . ' gusy-spacing-' . $spacing . ' gusy-accent-' . $accent . ' gusy-width-' . $width . ' gusy-align-' . $text_align . ' gusy-heading-' . $heading_scale . ' gusy-text-width-' . $text_width . ' gusy-body-' . $body_scale . ' gusy-button-style-' . $button_style . ' gusy-button-size-' . $button_size . ' gusy-button-shape-' . $button_shape . ' gusy-image-aspect-' . $image_aspect . ' gusy-image-position-' . $image_position . ' gusy-image-shape-' . $image_shape . ' gusy-video-mode-' . $video_mode . ' gusy-desktop-cols-' . $columns . ' gusy-tablet-cols-' . $tablet_columns . ' gusy-mobile-cols-' . $mobile_columns );
		$html_style = '';
		if ( '' !== $image_url ) {
			$classes .= ' gusy-has-bg-image';
			$html_style = '--gusy-section-bg-image:url("' . str_replace( array( '"', '\\', "\n", "\r" ), '', $image_url ) . '");';
		}
		if ( '' !== $video_url ) {
			$classes .= ' gusy-has-bg-video';
		}
		if ( $motion_enabled ) {
			$classes .= ' gusy-motion-enabled gusy-motion-' . $motion_entrance;
			$html_style .= '--gusy-motion-duration:' . $motion_duration . 'ms;';
		}

		switch ( $type ) {
			case 'header':
				$inner = $this->header_inner( $section );
				break;
			case 'hero':
				$inner = $this->hero_inner( $section );
				break;
			case 'features':
			case 'process':
			case 'testimonials':
			case 'team':
			case 'integrations':
			case 'metrics':
				$inner = $this->cards_inner( $section );
				break;
			case 'pricing':
				$inner = $this->pricing_inner( $section );
				break;
			case 'faq':
				$inner = $this->faq_inner( $section );
				break;
			case 'form':
			case 'newsletter':
			case 'lead-magnet':
			case 'audit':
				$inner = $this->form_inner( $section );
				break;
			case 'logos':
				$inner = $this->logos_inner( $section );
				break;
			case 'stats':
				$inner = $this->stats_inner( $section );
				break;
			case 'comparison':
				$inner = $this->comparison_inner( $section );
				break;
			case 'cta':
			case 'sticky-offer':
				$inner = $this->cta_inner( $section );
				break;
			case 'footer':
				$inner = $this->footer_inner( $section );
				break;
			default:
				$inner = $this->generic_inner( $section );
				break;
		}

		if ( '' !== $video_url && 'background' === $video_mode ) {
			$inner = $this->background_video( $video, $image ) . $inner;
		}

		return $this->group(
			$classes,
			$inner,
			array(
				'anchor' => $id,
				'htmlStyle' => $html_style,
				'layout' => array(
					'type' => 'constrained',
				),
			)
		);
	}

	/**
	 * Header markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function header_inner( array $section ): string {
		$links = '';
		foreach ( array_slice( $this->items( $section ), 0, 4 ) as $item ) {
			$links .= '<a href="' . esc_url( $this->clean_url( (string) $item['body'] ) ) . '">' . esc_html( $item['title'] ) . '</a>';
		}

		return '<div class="gusy-header-block">'
			. '<strong>' . esc_html( (string) ( $section['title'] ?? 'Brand' ) ) . '</strong>'
			. '<nav>' . $links . '</nav>'
			. $this->buttons( $section )
			. '</div>';
	}

	/**
	 * Hero markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function hero_inner( array $section ): string {
		$items = $this->items( $section );
		$proof = '';
		foreach ( array_slice( $items, 0, 3 ) as $item ) {
			$proof .= '<div class="gusy-proof-chip"><strong>' . esc_html( $item['label'] ) . '</strong><span>' . esc_html( $item['title'] ) . '</span></div>';
		}

		$visual = $this->section_photo( $section );
		if ( '' === $visual ) {
			$visual = '<div class="gusy-hero-visual" aria-hidden="true">'
				. '<div class="gusy-browser-bar"><span></span><span></span><span></span></div>'
				. '<div class="gusy-mini-page"><i></i><b></b><b></b><em></em><em></em><em></em></div>'
				. '</div>';
		}

		return '<div class="gusy-hero-grid">'
			. '<div class="gusy-hero-copy">'
			. $this->kicker( $section )
			. $this->heading( $section, 1, 'gusy-display' )
			. $this->paragraph( (string) ( $section['body'] ?? '' ), 'gusy-lead' )
			. $this->buttons( $section )
			. '<div class="gusy-proof-row">' . $proof . '</div>'
			. '</div>'
			. $visual
			. '</div>';
	}

	/**
	 * Cards markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function cards_inner( array $section ): string {
		$columns = max( 1, min( 4, absint( $section['settings']['columns'] ?? 3 ) ) );
		$cards   = '';
		$media_class = 'testimonials' === sanitize_key( (string) ( $section['type'] ?? '' ) ) ? 'gusy-testimonial-media' : 'gusy-card-media';

		foreach ( $this->items( $section ) as $item ) {
			$cards .= '<article class="gusy-card">'
				. $this->item_media( $item, $media_class )
				. '<span class="gusy-card-label">' . esc_html( $item['label'] ) . '</span>'
				. '<h3>' . esc_html( $item['title'] ) . '</h3>'
				. '<p>' . esc_html( $item['body'] ) . '</p>'
				. '</article>';
		}

		return $this->section_header( $section )
			. '<div class="gusy-card-grid gusy-cols-' . esc_attr( (string) $columns ) . '">' . $cards . '</div>';
	}

	/**
	 * Pricing markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function pricing_inner( array $section ): string {
		$cards = '';
		$index = 0;

		foreach ( $this->items( $section ) as $item ) {
			$featured = 1 === $index ? ' is-featured' : '';
			$cards   .= '<article class="gusy-price-card' . esc_attr( $featured ) . '">'
				. $this->item_media( $item, 'gusy-price-media' )
				. '<span>' . esc_html( $item['title'] ) . '</span>'
				. '<strong data-monthly="' . esc_attr( $item['label'] ) . '" data-yearly="' . esc_attr( $this->yearly_label( $item['label'] ) ) . '">' . esc_html( $item['label'] ) . '</strong>'
				. '<p>' . esc_html( $item['body'] ) . '</p>'
				. '<a class="gusy-link-button" href="' . esc_url( $this->clean_url( (string) ( $section['cta']['url'] ?? '#contact' ) ) ) . '">' . esc_html( $section['cta']['label'] ?? 'Choose' ) . '</a>'
				. '</article>';
			$index++;
		}

		return '<div class="gusy-pricing gusy-interactive" data-gusy-pricing>'
			. $this->section_header( $section )
			. '<div class="gusy-toggle" role="group" aria-label="Billing"><button type="button" data-billing="monthly" aria-pressed="true">Monthly</button><button type="button" data-billing="yearly" aria-pressed="false">Yearly</button></div>'
			. '<div class="gusy-price-grid">' . $cards . '</div>'
			. '</div>';
	}

	/**
	 * FAQ markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function faq_inner( array $section ): string {
		$items = '';
		foreach ( $this->items( $section ) as $item ) {
			$items .= '<details class="gusy-faq-item gusy-interactive">'
				. '<summary>' . esc_html( $item['title'] ) . '</summary>'
				. '<p>' . esc_html( $item['body'] ) . '</p>'
				. '</details>';
		}

		return '<div class="gusy-faq-layout">'
			. '<div>' . $this->section_header( $section ) . '</div>'
			. '<div class="gusy-faq-list">' . $items . '</div>'
			. '</div>';
	}

	/**
	 * Form markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function form_inner( array $section ): string {
		$field_html = '';
		foreach ( $this->form_fields( $section ) as $index => $field ) {
			$field_html .= $this->form_field( $field, $index );
		}

		return '<div id="contact" class="gusy-form-layout">'
			. '<div>' . $this->section_header( $section ) . '</div>'
			. '<form class="gusy-form gusy-interactive" data-gusy-form novalidate>'
			. $field_html
			. '<input class="gusy-hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">'
			. '<label class="gusy-privacy"><input name="privacyConsent" type="checkbox" value="1" required> <span>' . esc_html__( 'I agree to be contacted about this request.', 'gusy-ai-builder' ) . '</span></label>'
			. '<button type="submit">' . esc_html( $section['cta']['label'] ?? 'Send' ) . '</button>'
			. '<p class="gusy-form-status" role="status" aria-live="polite"></p>'
			. '</form>'
			. '</div>';
	}

	/**
	 * Form field definitions.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return array<int,array<string,mixed>>
	 */
	private function form_fields( array $section ): array {
		$items = array();
		foreach ( $this->items( $section ) as $item ) {
			if ( '' !== trim( (string) $item['title'] ) ) {
				$items[] = $item;
			}
		}

		$titles = array_map(
			static function ( $item ) {
				return strtolower( trim( (string) ( $item['title'] ?? '' ) ) );
			},
			$items
		);
		$looks_like_contact_details = in_array( 'address', $titles, true ) && in_array( 'hours', $titles, true ) && in_array( 'phone', $titles, true );
		if ( $looks_like_contact_details ) {
			$items = array();
		}

		$defaults = array(
			array( 'title' => 'Name', 'body' => 'Your full name', 'label' => 'text' ),
			array( 'title' => 'Email', 'body' => 'Your email address', 'label' => 'email' ),
			array( 'title' => 'Project', 'body' => 'Tell us what you need', 'label' => 'textarea' ),
		);

		$fields = array();
		for ( $index = 0; $index < 3; $index++ ) {
			$fields[] = array_merge( $defaults[ $index ], isset( $items[ $index ] ) && is_array( $items[ $index ] ) ? $items[ $index ] : array() );
		}

		return $fields;
	}

	/**
	 * Single form field markup.
	 *
	 * @param array<string,mixed> $field Field.
	 * @param int                 $index Field index.
	 * @return string
	 */
	private function form_field( array $field, int $index ): string {
		$label = trim( (string) ( $field['title'] ?? '' ) );
		$label = '' === $label ? (string) ( array( 'Name', 'Email', 'Project' )[ $index ] ?? 'Message' ) : $label;
		$kind  = sanitize_key( (string) ( $field['label'] ?? '' ) );
		$hint  = trim( (string) ( $field['body'] ?? '' ) );
		$placeholder = '' !== $hint ? ' placeholder="' . esc_attr( $hint ) . '"' : '';

		if ( 1 === $index || str_contains( $kind, 'email' ) ) {
			return '<label>' . esc_html( $label ) . '<input name="email" type="email" autocomplete="email" required' . $placeholder . '></label>';
		}

		if ( 2 === $index || str_contains( $kind, 'textarea' ) || str_contains( $kind, 'message' ) ) {
			return '<label>' . esc_html( $label ) . '<textarea name="message" rows="5" required' . $placeholder . '></textarea></label>';
		}

		return '<label>' . esc_html( $label ) . '<input name="name" autocomplete="name" required' . $placeholder . '></label>';
	}

	/**
	 * Logos markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function logos_inner( array $section ): string {
		$items = $this->items( $section );
		$logos = array();
		foreach ( array_slice( $items, 0, 8 ) as $item ) {
			$title = trim( (string) $item['title'] );
			if ( '' !== $title ) {
				$logos[] = $title;
			}
		}
		if ( empty( $logos ) ) {
			$logos = array( 'Northstar', 'Atelier', 'Pilot', 'Evergreen', 'Union', 'Keystone' );
		}

		$html  = '';
		foreach ( $logos as $logo ) {
			$html .= '<span>' . esc_html( $logo ) . '</span>';
		}

		return $this->section_header( $section ) . '<div class="gusy-logo-cloud">' . $html . '</div>';
	}

	/**
	 * Stats markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function stats_inner( array $section ): string {
		$stats = '';
		foreach ( $this->items( $section ) as $item ) {
			$stats .= '<div class="gusy-stat"><strong>' . esc_html( $item['label'] ) . '</strong><span>' . esc_html( $item['title'] ) . '</span><p>' . esc_html( $item['body'] ) . '</p></div>';
		}

		return $this->section_header( $section ) . '<div class="gusy-stats-band">' . $stats . '</div>';
	}

	/**
	 * Comparison markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function comparison_inner( array $section ): string {
		$rows = '';
		foreach ( $this->items( $section ) as $item ) {
			$rows .= '<div class="gusy-comparison-row"><span>' . esc_html( $item['title'] ) . '</span><p>' . esc_html( $item['body'] ) . '</p><strong>' . esc_html( $item['label'] ) . '</strong></div>';
		}

		return $this->section_header( $section ) . '<div class="gusy-comparison">' . $rows . '</div>';
	}

	/**
	 * CTA markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function cta_inner( array $section ): string {
		return '<div class="gusy-cta-panel">'
			. $this->kicker( $section )
			. $this->heading( $section, 2, 'gusy-section-title' )
			. $this->paragraph( (string) ( $section['body'] ?? '' ), 'gusy-section-body' )
			. $this->buttons( $section )
			. '</div>';
	}

	/**
	 * Footer markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function footer_inner( array $section ): string {
		$columns = '';
		foreach ( $this->items( $section ) as $item ) {
			$columns .= '<article class="gusy-card"><h3>' . esc_html( $item['title'] ) . '</h3><p>' . esc_html( $item['body'] ) . '</p></article>';
		}

		return '<div class="gusy-footer-block">'
			. '<div>' . $this->section_header( $section ) . $this->buttons( $section ) . '</div>'
			. '<div class="gusy-card-grid gusy-cols-3">' . $columns . '</div>'
			. '</div>';
	}

	/**
	 * Generic markup.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function generic_inner( array $section ): string {
		$cards = '';
		foreach ( $this->items( $section ) as $item ) {
			$cards .= '<article class="gusy-card">'
				. $this->item_media( $item, 'gusy-card-media' )
				. '<span class="gusy-card-label">' . esc_html( $item['label'] ) . '</span>'
				. '<h3>' . esc_html( $item['title'] ) . '</h3>'
				. '<p>' . esc_html( $item['body'] ) . '</p>'
				. '</article>';
		}

		return $this->section_header( $section ) . '<div class="gusy-card-grid">' . $cards . '</div>';
	}

	/**
	 * Header shared by most sections.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function section_header( array $section ): string {
		return '<header class="gusy-section-header">'
			. $this->kicker( $section )
			. $this->heading( $section, 2, 'gusy-section-title' )
			. $this->paragraph( (string) ( $section['body'] ?? '' ), 'gusy-section-body' )
			. '</header>';
	}

	/**
	 * Kicker.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function kicker( array $section ): string {
		$kicker = trim( (string) ( $section['kicker'] ?? '' ) );
		if ( '' === $kicker ) {
			return '';
		}

		return '<p class="gusy-kicker">' . esc_html( $kicker ) . '</p>';
	}

	/**
	 * Heading block.
	 *
	 * @param array<string,mixed> $section Section.
	 * @param int                 $level Heading level.
	 * @param string              $class Class.
	 * @return string
	 */
	private function heading( array $section, int $level, string $class ): string {
		$level = max( 1, min( 6, $level ) );
		$title = (string) ( $section['title'] ?? '' );

		return $this->block(
			'heading',
			array(
				'level'     => $level,
				'className' => $class,
			),
			'<h' . $level . ' class="wp-block-heading ' . esc_attr( $class ) . '">' . esc_html( $title ) . '</h' . $level . '>'
		);
	}

	/**
	 * Paragraph block.
	 *
	 * @param string $text Text.
	 * @param string $class Class.
	 * @return string
	 */
	private function paragraph( string $text, string $class ): string {
		if ( '' === trim( $text ) ) {
			return '';
		}

		return $this->block(
			'paragraph',
			array(
				'className' => $class,
			),
			'<p class="' . esc_attr( $class ) . '">' . esc_html( $text ) . '</p>'
		);
	}

	/**
	 * Buttons block.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return string
	 */
	private function buttons( array $section ): string {
		$cta       = isset( $section['cta'] ) && is_array( $section['cta'] ) ? $section['cta'] : array();
		$primary   = (string) ( $cta['label'] ?? '' );
		$secondary = (string) ( $cta['secondaryLabel'] ?? '' );
		$primary_url = (string) ( $cta['url'] ?? '#contact' );
		$secondary_url = (string) ( $cta['secondaryUrl'] ?? '#proof' );

		$html = '';
		if ( '' !== $primary ) {
			$html .= $this->button( $primary, $primary_url, 'is-style-fill' );
		}
		if ( '' !== $secondary ) {
			$html .= $this->button( $secondary, $secondary_url, 'is-style-outline' );
		}

		if ( '' === $html ) {
			return '';
		}

		return $this->block( 'buttons', array( 'className' => 'gusy-actions' ), '<div class="wp-block-buttons gusy-actions">' . $html . '</div>' );
	}

	/**
	 * Single button block.
	 *
	 * @param string $label Label.
	 * @param string $url URL.
	 * @param string $style Style class.
	 * @return string
	 */
	private function button( string $label, string $url, string $style ): string {
		$url = $this->clean_url( $url );

		return '<!-- wp:button {"className":"' . esc_attr( $style ) . '"} -->'
			. '<div class="wp-block-button ' . esc_attr( $style ) . '"><a class="wp-block-button__link wp-element-button" href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a></div>'
			. '<!-- /wp:button -->';
	}

	/**
	 * Group block wrapper.
	 *
	 * @param string              $class Class name.
	 * @param string              $inner Inner blocks/html.
	 * @param array<string,mixed> $attrs Attributes.
	 * @return string
	 */
	private function group( string $class, string $inner, array $attrs = array() ): string {
		$html_style = isset( $attrs['htmlStyle'] ) ? sanitize_text_field( (string) $attrs['htmlStyle'] ) : '';
		unset( $attrs['htmlStyle'] );
		$attrs['className'] = trim( $class );
		$attrs = array_filter(
			$attrs,
			static function ( $value ) {
				return null !== $value && '' !== $value;
			}
		);

		$id = isset( $attrs['anchor'] ) ? ' id="' . esc_attr( (string) $attrs['anchor'] ) . '"' : '';
		$style = '' !== $html_style ? ' style="' . esc_attr( $html_style ) . '"' : '';

		return $this->block(
			'group',
			$attrs,
			'<div' . $id . $style . ' class="wp-block-group ' . esc_attr( $class ) . '">' . "\n" . $inner . "\n" . '</div>'
		);
	}

	/**
	 * Generic block wrapper.
	 *
	 * @param string              $name Block name without core prefix.
	 * @param array<string,mixed> $attrs Attributes.
	 * @param string              $html HTML.
	 * @return string
	 */
	private function block( string $name, array $attrs, string $html ): string {
		$json = empty( $attrs ) ? '' : ' ' . wp_json_encode( $attrs, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );

		return '<!-- wp:' . $name . $json . ' -->' . "\n" . $html . "\n" . '<!-- /wp:' . $name . ' -->' . "\n\n";
	}

	/**
	 * Render a sanitized image figure.
	 *
	 * @param array<string,mixed> $image Image data.
	 * @param string              $class Figure class.
	 * @param string              $fallback_alt Fallback alt text.
	 * @return string
	 */
	private function image_figure( array $image, string $class, string $fallback_alt ): string {
		$url = esc_url_raw( (string) ( $image['url'] ?? '' ) );
		if ( '' === $url ) {
			return '';
		}

		$alt = (string) ( $image['alt'] ?? $image['title'] ?? $fallback_alt );

		return '<figure class="' . esc_attr( $class ) . '"><img src="' . esc_url( $url ) . '" alt="' . esc_attr( $alt ) . '" loading="lazy"></figure>';
	}

	/**
	 * Render a sanitized video figure.
	 *
	 * @param array<string,mixed> $video Video data.
	 * @param string              $class Figure class.
	 * @return string
	 */
	private function video_figure( array $video, string $class ): string {
		$url = esc_url_raw( (string) ( $video['url'] ?? '' ) );
		if ( '' === $url ) {
			return '';
		}

		$poster = esc_url_raw( (string) ( $video['poster'] ?? '' ) );
		$mime   = sanitize_text_field( (string) ( $video['mime'] ?? '' ) );
		$attrs  = '' !== $poster ? ' poster="' . esc_url( $poster ) . '"' : '';
		$type   = '' !== $mime ? ' type="' . esc_attr( $mime ) . '"' : '';

		return '<figure class="' . esc_attr( $class ) . '"><video controls playsinline preload="metadata"' . $attrs . '><source src="' . esc_url( $url ) . '"' . $type . '></video></figure>';
	}

	/**
	 * Render a muted looping background video.
	 *
	 * @param array<string,mixed> $video Video data.
	 * @param array<string,mixed> $fallback_image Image data.
	 * @return string
	 */
	private function background_video( array $video, array $fallback_image = array() ): string {
		$url = esc_url_raw( (string) ( $video['url'] ?? '' ) );
		if ( '' === $url ) {
			return '';
		}

		$poster = esc_url_raw( (string) ( $video['poster'] ?? $fallback_image['url'] ?? '' ) );
		$mime   = sanitize_text_field( (string) ( $video['mime'] ?? '' ) );
		$attrs  = '' !== $poster ? ' poster="' . esc_url( $poster ) . '"' : '';
		$type   = '' !== $mime ? ' type="' . esc_attr( $mime ) . '"' : '';

		return '<video class="gusy-background-video" autoplay muted loop playsinline preload="metadata"' . $attrs . '><source src="' . esc_url( $url ) . '"' . $type . '></video>';
	}

	/**
	 * Render the section background image as hero media.
	 *
	 * @param array<string,mixed> $section Section data.
	 * @return string
	 */
	private function section_photo( array $section ): string {
		$settings = isset( $section['settings'] ) && is_array( $section['settings'] ) ? $section['settings'] : array();
		$video    = isset( $settings['backgroundVideo'] ) && is_array( $settings['backgroundVideo'] ) ? $settings['backgroundVideo'] : array();
		if ( ! empty( $video['url'] ) && 'background' !== ( $settings['videoMode'] ?? 'inline' ) ) {
			return $this->video_figure( $video, 'gusy-hero-photo gusy-hero-visual gusy-hero-video' );
		}
		$image    = isset( $settings['backgroundImage'] ) && is_array( $settings['backgroundImage'] ) ? $settings['backgroundImage'] : array();

		return $this->image_figure( $image, 'gusy-hero-photo gusy-hero-visual', (string) ( $section['title'] ?? '' ) );
	}

	/**
	 * Render item media when an editable image is attached.
	 *
	 * @param array<string,mixed> $item Item data.
	 * @param string              $class Figure class.
	 * @return string
	 */
	private function item_media( array $item, string $class ): string {
		$image = isset( $item['image'] ) && is_array( $item['image'] ) ? $item['image'] : array();

		return $this->image_figure( $image, $class, (string) ( $item['title'] ?? '' ) );
	}

	/**
	 * Section items.
	 *
	 * @param array<string,mixed> $section Section.
	 * @return array<int,array<string,mixed>>
	 */
	private function items( array $section ): array {
		$items = array();
		if ( ! isset( $section['items'] ) || ! is_array( $section['items'] ) ) {
			return $items;
		}

		foreach ( $section['items'] as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}

			$items[] = array(
				'title' => (string) ( $item['title'] ?? '' ),
				'body'  => (string) ( $item['body'] ?? '' ),
				'label' => (string) ( $item['label'] ?? '' ),
				'image' => isset( $item['image'] ) && is_array( $item['image'] ) ? $item['image'] : array(),
			);
		}

		return $items;
	}

	/**
	 * Create a yearly display label from a monthly-ish label.
	 *
	 * @param string $label Label.
	 * @return string
	 */
	private function yearly_label( string $label ): string {
		if ( preg_match( '/([0-9]+)/', $label, $matches ) ) {
			$yearly = (int) $matches[1] * 10;
			return preg_replace( '/[0-9]+/', (string) $yearly, $label, 1 ) ?: $label;
		}

		return $label;
	}

	/**
	 * Preserve anchors while sanitizing URLs.
	 *
	 * @param string $url URL.
	 * @return string
	 */
	private function clean_url( string $url ): string {
		$url = trim( $url );
		if ( str_starts_with( $url, '#' ) ) {
			return '#' . sanitize_title( substr( $url, 1 ) );
		}

		return esc_url_raw( $url );
	}

	/**
	 * Minify CSS enough for inline token variables.
	 *
	 * @param string $css CSS.
	 * @return string
	 */
	private function minify_css( string $css ): string {
		$css = preg_replace( '/\s+/', ' ', $css );
		$css = str_replace( array( ' {', '{ ', '; ', ': ' ), array( '{', '{', ';', ':' ), (string) $css );

		return trim( $css );
	}
}
