<?php
/**
 * Plugin Name: Gusy AI Builder Pro
 * Plugin URI: https://example.com/gusy-ai-builder-pro
 * Description: Pro add-on for Gusy AI Builder. Unlocks LLM Gateway, product agent, premium theme kits, revisions and Elementor migration.
 * Version: 0.1.0
 * Requires at least: 6.4
 * Requires PHP: 8.1
 * Requires Plugins: gusy-ai-builder
 * Author: Gusy
 * Text Domain: gusy-ai-builder-pro
 *
 * @package Gusy_AI_Builder_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GUSY_AI_BUILDER_PRO_VERSION', '0.1.0' );
define( 'GUSY_AI_BUILDER_PRO_FILE', __FILE__ );

/**
 * Registers Pro unlock filters.
 */
final class Gusy_AI_Builder_Pro {
	/**
	 * Boot the add-on.
	 */
	public static function boot(): void {
		add_filter( 'gusy_ai_builder_plan', array( __CLASS__, 'plan' ) );
		add_filter( 'gusy_ai_builder_features', array( __CLASS__, 'features' ), 10, 2 );
		add_filter( 'gusy_ai_builder_upgrade_url', array( __CLASS__, 'upgrade_url' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( GUSY_AI_BUILDER_PRO_FILE ), array( __CLASS__, 'plugin_action_links' ) );
		add_action( 'admin_notices', array( __CLASS__, 'dependency_notice' ) );
	}

	/**
	 * Pro plan marker.
	 */
	public static function plan(): string {
		return 'pro';
	}

	/**
	 * Unlock paid features. A license service can wrap this filter later.
	 *
	 * @param array<string,bool> $features Feature map.
	 * @param string             $plan Current plan.
	 * @return array<string,bool>
	 */
	public static function features( array $features, string $plan ): array {
		if ( 'pro' !== $plan ) {
			return $features;
		}

		foreach (
			array(
				'pages.revisions',
				'ai.llm_gateway',
				'ai.product_agent',
				'ai.agent_memory',
				'ai.brand_kit',
				'theme_kits.import_full',
				'theme_kits.customize',
				'theme_kits.all',
				'migration.elementor',
			) as $feature
		) {
			$features[ $feature ] = true;
		}

		return $features;
	}

	/**
	 * The upgrade target becomes the add-on screen once Pro is active.
	 */
	public static function upgrade_url(): string {
		return admin_url( 'plugins.php?plugin_status=active' );
	}

	/**
	 * Action link for the plugins list.
	 *
	 * @param array<int,string> $links Existing links.
	 * @return array<int,string>
	 */
	public static function plugin_action_links( array $links ): array {
		array_unshift(
			$links,
			'<a href="' . esc_url( admin_url( 'admin.php?page=gusy-ai-builder' ) ) . '">' . esc_html__( 'Open Gusy', 'gusy-ai-builder-pro' ) . '</a>'
		);

		return $links;
	}

	/**
	 * Show a dependency notice if the free base plugin is missing.
	 */
	public static function dependency_notice(): void {
		if ( defined( 'GUSY_AI_BUILDER_VERSION' ) ) {
			return;
		}

		echo '<div class="notice notice-error"><p>';
		echo esc_html__( 'Gusy AI Builder Pro requires the free Gusy AI Builder plugin to be installed and active.', 'gusy-ai-builder-pro' );
		echo '</p></div>';
	}
}

add_action( 'plugins_loaded', array( 'Gusy_AI_Builder_Pro', 'boot' ), 5 );
