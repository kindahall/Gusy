<?php
/**
 * Design token helpers.
 *
 * @package Gusy_AI_Builder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Creates, normalizes and exports design tokens.
 */
final class Gusy_AI_Builder_Design_Token_Service {
	/**
	 * Default brand-neutral tokens for Gusy pages.
	 *
	 * @return array<string,mixed>
	 */
	public function default_tokens(): array {
		return array(
			'style'      => 'premium editorial',
			'mode'       => 'light',
			'colors'     => array(
				'primary'   => '#102326',
				'secondary' => '#F7F8F3',
				'accent'    => '#E46F4D',
				'support'   => '#5C8D89',
				'gold'      => '#C99A3A',
				'surface'   => '#FFFFFF',
				'ink'       => '#121615',
				'muted'     => '#64716D',
				'line'      => '#DDE5DF',
			),
			'typography' => array(
				'fontFamily' => 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
				'scale'      => 'comfortable',
				'weight'     => '600',
			),
			'spacing'    => 'comfortable',
			'radius'     => array(
				'sm' => '8px',
				'md' => '14px',
				'lg' => '22px',
				'xl' => '30px',
			),
			'shadow'     => 'premium',
			'motion'     => 'subtle',
			'layout'     => 'wide',
		);
	}

	/**
	 * Generate tokens from a prompt and optional brand kit.
	 *
	 * @param string              $prompt Prompt text.
	 * @param array<string,mixed> $brand_kit Optional existing tokens.
	 * @return array<string,mixed>
	 */
	public function from_prompt( string $prompt, array $brand_kit = array() ): array {
		$tokens = $this->merge_tokens( $this->default_tokens(), $brand_kit );
		$lower  = strtolower( remove_accents( $prompt ) );

		if ( str_contains( $lower, 'avocat' ) || str_contains( $lower, 'juridique' ) || str_contains( $lower, 'finance' ) ) {
			$tokens['style']            = 'premium corporate';
			$tokens['colors']['primary'] = '#13212A';
			$tokens['colors']['accent']  = '#B88943';
			$tokens['colors']['support'] = '#6E7F80';
			$tokens['colors']['secondary'] = '#F5F1E8';
		}

		if ( str_contains( $lower, 'saas' ) || str_contains( $lower, 'logiciel' ) || str_contains( $lower, 'app' ) ) {
			$tokens['style']             = 'premium product';
			$tokens['colors']['primary'] = '#151A1E';
			$tokens['colors']['accent']  = '#2DAA78';
			$tokens['colors']['support'] = '#3B82A0';
			$tokens['colors']['gold']    = '#F0B44C';
		}

		if ( str_contains( $lower, 'restaurant' ) || str_contains( $lower, 'hotel' ) || str_contains( $lower, 'bien-etre' ) ) {
			$tokens['style']              = 'warm editorial';
			$tokens['colors']['primary']  = '#27332D';
			$tokens['colors']['accent']   = '#D85F45';
			$tokens['colors']['support']  = '#8BA36D';
			$tokens['colors']['secondary'] = '#FAF7EF';
		}

		if ( str_contains( $lower, 'dark' ) || str_contains( $lower, 'sombre' ) ) {
			$tokens['mode']                = 'dark';
			$tokens['colors']['surface']   = '#151817';
			$tokens['colors']['secondary'] = '#202724';
			$tokens['colors']['ink']       = '#F7FAF6';
			$tokens['colors']['muted']     = '#B9C6C0';
			$tokens['colors']['line']      = '#33413B';
		}

		if ( str_contains( $lower, 'minimal' ) || str_contains( $lower, 'sobre' ) ) {
			$tokens['shadow'] = 'subtle';
			$tokens['motion'] = 'quiet';
			$tokens['radius']['xl'] = '22px';
		}

		return $this->normalize_tokens( $tokens );
	}

	/**
	 * Merge token arrays without dropping nested defaults.
	 *
	 * @param array<string,mixed> $base Base tokens.
	 * @param array<string,mixed> $override Overrides.
	 * @return array<string,mixed>
	 */
	public function merge_tokens( array $base, array $override ): array {
		foreach ( $override as $key => $value ) {
			if ( is_array( $value ) && isset( $base[ $key ] ) && is_array( $base[ $key ] ) ) {
				$base[ $key ] = $this->merge_tokens( $base[ $key ], $value );
			} elseif ( null !== $value && '' !== $value ) {
				$base[ $key ] = $value;
			}
		}

		return $base;
	}

	/**
	 * Normalize colors and scalar tokens.
	 *
	 * @param array<string,mixed> $tokens Raw tokens.
	 * @return array<string,mixed>
	 */
	public function normalize_tokens( array $tokens ): array {
		$defaults = $this->default_tokens();
		$tokens   = $this->merge_tokens( $defaults, $tokens );

		foreach ( $defaults['colors'] as $name => $fallback ) {
			$value = $tokens['colors'][ $name ] ?? $fallback;
			$tokens['colors'][ $name ] = $this->sanitize_color( (string) $value, $fallback );
		}

		foreach ( $defaults['radius'] as $name => $fallback ) {
			$value = (string) ( $tokens['radius'][ $name ] ?? $fallback );
			$tokens['radius'][ $name ] = preg_match( '/^[0-9]{1,3}px$/', $value ) ? $value : $fallback;
		}

		$tokens['style']   = sanitize_text_field( (string) $tokens['style'] );
		$tokens['mode']    = 'dark' === $tokens['mode'] ? 'dark' : 'light';
		$tokens['spacing'] = sanitize_key( (string) $tokens['spacing'] );
		$tokens['shadow']  = sanitize_key( (string) $tokens['shadow'] );
		$tokens['motion']  = sanitize_key( (string) $tokens['motion'] );
		$tokens['layout']  = sanitize_key( (string) $tokens['layout'] );

		return $tokens;
	}

	/**
	 * Export tokens as CSS variables.
	 *
	 * @param array<string,mixed> $tokens Tokens.
	 * @param string              $selector CSS selector.
	 * @return string
	 */
	public function css_variables( array $tokens, string $selector = '.gusy-page' ): string {
		$tokens = $this->normalize_tokens( $tokens );
		$colors = $tokens['colors'];
		$radius = $tokens['radius'];

		$lines = array(
			$selector . ' {',
			'  --gusy-primary: ' . $colors['primary'] . ';',
			'  --gusy-secondary: ' . $colors['secondary'] . ';',
			'  --gusy-accent: ' . $colors['accent'] . ';',
			'  --gusy-support: ' . $colors['support'] . ';',
			'  --gusy-gold: ' . $colors['gold'] . ';',
			'  --gusy-surface: ' . $colors['surface'] . ';',
			'  --gusy-ink: ' . $colors['ink'] . ';',
			'  --gusy-muted: ' . $colors['muted'] . ';',
			'  --gusy-line: ' . $colors['line'] . ';',
			'  --gusy-radius-sm: ' . $radius['sm'] . ';',
			'  --gusy-radius-md: ' . $radius['md'] . ';',
			'  --gusy-radius-lg: ' . $radius['lg'] . ';',
			'  --gusy-radius-xl: ' . $radius['xl'] . ';',
			'  --gusy-font-sans: ' . sanitize_text_field( (string) $tokens['typography']['fontFamily'] ) . ';',
			'  --gusy-ease: cubic-bezier(.2,.8,.2,1);',
			'}',
		);

		return implode( "\n", $lines );
	}

	/**
	 * Export a theme.json-compatible partial.
	 *
	 * @param array<string,mixed> $tokens Tokens.
	 * @return array<string,mixed>
	 */
	public function theme_json( array $tokens ): array {
		$tokens = $this->normalize_tokens( $tokens );

		return array(
			'version'  => 3,
			'settings' => array(
				'color'      => array(
					'palette' => array(
						array(
							'name'  => 'Gusy Primary',
							'slug'  => 'gusy-primary',
							'color' => $tokens['colors']['primary'],
						),
						array(
							'name'  => 'Gusy Accent',
							'slug'  => 'gusy-accent',
							'color' => $tokens['colors']['accent'],
						),
						array(
							'name'  => 'Gusy Surface',
							'slug'  => 'gusy-surface',
							'color' => $tokens['colors']['surface'],
						),
					),
				),
				'typography' => array(
					'fontFamilies' => array(
						array(
							'name'       => 'Gusy Sans',
							'slug'       => 'gusy-sans',
							'fontFamily' => $tokens['typography']['fontFamily'],
						),
					),
				),
				'spacing'    => array(
					'spacingScale' => array(
						'steps'      => 7,
						'mediumStep' => '1.5rem',
						'unit'       => 'rem',
					),
				),
			),
		);
	}

	/**
	 * Sanitize a hex color.
	 *
	 * @param string $color Color candidate.
	 * @param string $fallback Fallback.
	 * @return string
	 */
	private function sanitize_color( string $color, string $fallback ): string {
		$color = trim( $color );

		if ( preg_match( '/^#[0-9a-fA-F]{6}$/', $color ) ) {
			return strtoupper( $color );
		}

		return $fallback;
	}
}
