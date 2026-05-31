<?php
/**
 * Free/Pro feature registry.
 *
 * @package Gusy_AI_Builder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Centralizes plan detection and server-side feature checks.
 */
final class Gusy_AI_Builder_Feature_Manager {
	public const PLAN_FREE = 'free';
	public const PLAN_PRO  = 'pro';

	/**
	 * Features available in the free plugin before add-ons run filters.
	 *
	 * @return array<string,bool>
	 */
	public static function default_features(): array {
		return array(
			'pages.manage'             => true,
			'pages.revisions'          => false,
			'sections.library'         => true,
			'export.json'              => true,
			'import.json'              => true,
			'audit.basic'              => true,
			'leads.capture'            => true,
			'ai.local_generation'      => true,
			'ai.llm_gateway'           => false,
			'ai.product_agent'         => false,
			'ai.agent_memory'          => false,
			'ai.brand_kit'             => false,
			'theme_kits.preview'       => true,
			'theme_kits.import_single' => true,
			'theme_kits.import_full'   => false,
			'theme_kits.customize'     => false,
			'theme_kits.all'           => false,
			'migration.elementor'      => false,
		);
	}

	/**
	 * Current commercial plan.
	 */
	public function plan(): string {
		$plan = sanitize_key( (string) apply_filters( 'gusy_ai_builder_plan', self::PLAN_FREE ) );

		return self::PLAN_PRO === $plan ? self::PLAN_PRO : self::PLAN_FREE;
	}

	/**
	 * Whether the Pro add-on has unlocked Pro mode.
	 */
	public function is_pro(): bool {
		return self::PLAN_PRO === $this->plan();
	}

	/**
	 * Resolved feature map after add-ons and license checks.
	 *
	 * @return array<string,bool>
	 */
	public function features(): array {
		$defaults = self::default_features();
		$features = apply_filters( 'gusy_ai_builder_features', $defaults, $this->plan() );
		$features = is_array( $features ) ? $features : $defaults;

		foreach ( $defaults as $feature => $enabled ) {
			$features[ $feature ] = ! empty( $features[ $feature ] );
		}

		return $features;
	}

	/**
	 * Check one feature flag.
	 */
	public function is_available( string $feature ): bool {
		$features = $this->features();

		return ! empty( $features[ $feature ] );
	}

	/**
	 * Return true or a REST-safe feature error.
	 *
	 * @param string $feature Feature key.
	 * @param string $message Optional message.
	 * @return true|WP_Error
	 */
	public function require_feature( string $feature, string $message = '' ) {
		if ( $this->is_available( $feature ) ) {
			return true;
		}

		return new WP_Error(
			'gusy_pro_feature_required',
			$message ? $message : __( 'This feature requires Gusy AI Builder Pro.', 'gusy-ai-builder' ),
			array(
				'status'     => 403,
				'feature'    => $feature,
				'plan'       => $this->plan(),
				'upgradeUrl' => $this->upgrade_url(),
			)
		);
	}

	/**
	 * Theme kits importable in Free.
	 *
	 * @return array<int,string>
	 */
	public function free_theme_kit_slugs(): array {
		$slugs = apply_filters(
			'gusy_ai_builder_free_theme_kit_slugs',
			array(
				'atelier-artisan',
				'restaurant-table',
				'coach-wellness',
			)
		);
		$slugs = is_array( $slugs ) ? $slugs : array();

		return array_values(
			array_unique(
				array_filter(
					array_map(
						static function ( $slug ): string {
							return sanitize_title( (string) $slug );
						},
						$slugs
					)
				)
			)
		);
	}

	/**
	 * Whether one theme kit can be previewed/imported on the current plan.
	 */
	public function is_theme_kit_available( string $slug ): bool {
		return $this->is_available( 'theme_kits.all' ) || in_array( sanitize_title( $slug ), $this->free_theme_kit_slugs(), true );
	}

	/**
	 * URL used by the admin UI for upgrade CTAs.
	 */
	public function upgrade_url(): string {
		$url = (string) apply_filters( 'gusy_ai_builder_upgrade_url', admin_url( 'admin.php?page=gusy-ai-builder&gusy_upgrade=pro' ) );

		return esc_url_raw( $url );
	}

	/**
	 * Public, non-secret settings safe for JavaScript.
	 *
	 * @return array<string,mixed>
	 */
	public function public_settings(): array {
		return array(
			'plan'              => $this->plan(),
			'isPro'             => $this->is_pro(),
			'features'          => $this->features(),
			'freeThemeKitSlugs' => $this->free_theme_kit_slugs(),
			'upgradeUrl'        => $this->upgrade_url(),
		);
	}
}
