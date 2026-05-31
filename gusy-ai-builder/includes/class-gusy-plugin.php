<?php
/**
 * Main plugin bootstrap.
 *
 * @package Gusy_AI_Builder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Wires WordPress hooks, admin UI, REST API and conditional assets.
 */
final class Gusy_AI_Builder_Plugin {
	/**
	 * Singleton instance.
	 *
	 * @var self|null
	 */
	private static ?self $instance = null;

	/**
	 * Feature manager.
	 *
	 * @var Gusy_AI_Builder_Feature_Manager
	 */
	private Gusy_AI_Builder_Feature_Manager $features;

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
	 * LLM gateway.
	 *
	 * @var Gusy_AI_Builder_LLM_Gateway
	 */
	private Gusy_AI_Builder_LLM_Gateway $llm;

	/**
	 * Product assistant agent.
	 *
	 * @var Gusy_AI_Builder_Product_Agent
	 */
	private Gusy_AI_Builder_Product_Agent $agent;

	/**
	 * Generator.
	 *
	 * @var Gusy_AI_Builder_Page_Generator
	 */
	private Gusy_AI_Builder_Page_Generator $generator;

	/**
	 * Serializer.
	 *
	 * @var Gusy_AI_Builder_Block_Serializer
	 */
	private Gusy_AI_Builder_Block_Serializer $serializer;

	/**
	 * REST controller.
	 *
	 * @var Gusy_AI_Builder_Rest_Controller
	 */
	private Gusy_AI_Builder_Rest_Controller $rest;

	/**
	 * Boot singleton.
	 */
	public static function boot(): void {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		self::$instance->init();
	}

	/**
	 * Activation callback.
	 */
	public static function activate(): void {
		self::boot();
		self::$instance->register_post_types();
		flush_rewrite_rules();
	}

	/**
	 * Deactivation callback.
	 */
	public static function deactivate(): void {
		flush_rewrite_rules();
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		$this->features  = new Gusy_AI_Builder_Feature_Manager();
		$this->tokens     = new Gusy_AI_Builder_Design_Token_Service();
		$this->templates  = new Gusy_AI_Builder_Template_Repository();
		$this->llm        = new Gusy_AI_Builder_LLM_Gateway();
		$this->agent      = new Gusy_AI_Builder_Product_Agent( $this->llm );
		$this->generator  = new Gusy_AI_Builder_Page_Generator( $this->templates, $this->tokens, $this->llm );
		$this->serializer = new Gusy_AI_Builder_Block_Serializer( $this->tokens );
		$this->rest       = new Gusy_AI_Builder_Rest_Controller( $this->generator, $this->serializer, $this->templates, $this->tokens, $this->llm, $this->agent, $this->features );
	}

	/**
	 * Register hooks.
	 */
	public function init(): void {
		add_action( 'init', array( $this, 'register_post_types' ) );
		add_action( 'admin_menu', array( $this, 'register_admin_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_action( 'rest_api_init', array( $this->rest, 'register_routes' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
		add_action( 'wp_head', array( $this, 'print_page_tokens' ), 20 );
		add_action( 'wp_head', array( $this, 'print_page_schema' ), 21 );
		add_action( 'admin_init', array( $this, 'redirect_gusy_page_edits' ) );
		add_action( 'admin_bar_menu', array( $this, 'replace_admin_bar_edit_links' ), 1000 );
		add_filter( 'get_edit_post_link', array( $this, 'filter_gusy_edit_post_link' ), 10, 3 );
		add_filter( 'plugin_action_links_' . plugin_basename( GUSY_AI_BUILDER_FILE ), array( $this, 'plugin_action_links' ) );
	}

	/**
	 * Register internal post types.
	 */
	public function register_post_types(): void {
		register_post_type(
			'gusy_template',
			array(
				'label'        => __( 'Gusy Templates', 'gusy-ai-builder' ),
				'public'       => false,
				'show_ui'      => false,
				'show_in_rest' => false,
				'supports'     => array( 'title', 'editor', 'custom-fields' ),
			)
		);

		register_post_type(
			'gusy_brand_kit',
			array(
				'label'        => __( 'Gusy Brand Kits', 'gusy-ai-builder' ),
				'public'       => false,
				'show_ui'      => false,
				'show_in_rest' => false,
				'supports'     => array( 'title', 'custom-fields' ),
			)
		);

		register_post_type(
			'gusy_revision',
			array(
				'label'        => __( 'Gusy Revisions', 'gusy-ai-builder' ),
				'public'       => false,
				'show_ui'      => false,
				'show_in_rest' => false,
				'supports'     => array( 'title', 'custom-fields' ),
			)
		);

		register_post_type(
			'gusy_lead',
			array(
				'label'        => __( 'Gusy Leads', 'gusy-ai-builder' ),
				'public'       => false,
				'show_ui'      => current_user_can( 'manage_options' ),
				'show_in_menu' => false,
				'show_in_rest' => false,
				'supports'     => array( 'title', 'custom-fields' ),
			)
		);
	}

	/**
	 * Add admin page.
	 */
	public function register_admin_page(): void {
		add_menu_page(
			__( 'Gusy', 'gusy-ai-builder' ),
			__( 'Gusy', 'gusy-ai-builder' ),
			'edit_posts',
			'gusy-ai-builder',
			array( $this, 'render_admin_page' ),
			'dashicons-layout',
			58
		);
	}

	/**
	 * Render admin app root.
	 */
	public function render_admin_page(): void {
		echo '<div id="gusy-app" class="gusy-app-shell">';
		echo '<div class="gusy-loading"><strong>Gusy</strong><span>' . esc_html__( 'Loading editor', 'gusy-ai-builder' ) . '</span></div>';
		echo '</div>';
	}

	/**
	 * Enqueue admin assets only on the Gusy page.
	 *
	 * @param string $hook Current admin hook.
	 */
	public function enqueue_admin_assets( string $hook ): void {
		if ( 'toplevel_page_gusy-ai-builder' !== $hook ) {
			return;
		}

		$dist_css = GUSY_AI_BUILDER_PATH . 'assets/dist/admin-app.css';
		$dist_js  = GUSY_AI_BUILDER_PATH . 'assets/dist/admin-app.js';
		$css_path = file_exists( $dist_css ) ? $dist_css : GUSY_AI_BUILDER_PATH . 'assets/css/admin.css';
		$js_path  = file_exists( $dist_js ) ? $dist_js : GUSY_AI_BUILDER_PATH . 'assets/js/admin-app.js';
		$css_url  = file_exists( $dist_css ) ? GUSY_AI_BUILDER_URL . 'assets/dist/admin-app.css' : GUSY_AI_BUILDER_URL . 'assets/css/admin.css';
		$js_url   = file_exists( $dist_js ) ? GUSY_AI_BUILDER_URL . 'assets/dist/admin-app.js' : GUSY_AI_BUILDER_URL . 'assets/js/admin-app.js';
		$css_ver  = GUSY_AI_BUILDER_VERSION . '-' . ( file_exists( $css_path ) ? (string) filemtime( $css_path ) : 'dev' );
		$js_ver   = GUSY_AI_BUILDER_VERSION . '-' . ( file_exists( $js_path ) ? (string) filemtime( $js_path ) : 'dev' );
		$initial_post_id = isset( $_GET['post_id'] ) ? absint( wp_unslash( $_GET['post_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! $initial_post_id && isset( $_GET['page_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$initial_post_id = absint( wp_unslash( $_GET['page_id'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}

		wp_enqueue_media();

		wp_enqueue_style(
			'gusy-admin',
			$css_url,
			array(),
			$css_ver
		);

		wp_enqueue_script(
			'gusy-admin-app',
			$js_url,
			array( 'wp-element', 'wp-api-fetch', 'wp-i18n', 'media-editor', 'media-views' ),
			$js_ver,
			true
		);

		wp_localize_script(
			'gusy-admin-app',
			'GusyBuilderSettings',
			array(
				'restBase'      => esc_url_raw( rest_url( 'gusy/v1' ) ),
				'nonce'         => wp_create_nonce( 'wp_rest' ),
				'templates'     => $this->templates->get_sections(),
				'brandKit'      => get_option( 'gusy_brand_kit', $this->tokens->default_tokens() ),
				'siteName'      => get_bloginfo( 'name' ),
				'adminUrl'      => admin_url(),
				'canPublish'    => current_user_can( 'publish_posts' ),
				'pluginVersion' => GUSY_AI_BUILDER_VERSION,
				'locale'        => determine_locale(),
				'llm'           => $this->llm->get_public_settings(),
				'plan'          => $this->features->plan(),
				'isPro'         => $this->features->is_pro(),
				'features'      => $this->features->features(),
				'upgradeUrl'    => $this->features->upgrade_url(),
				'initialPostId' => $initial_post_id,
				'initialEdit'   => isset( $_GET['gusy_edit'] ), // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			)
		);
	}

	/**
	 * Return true when a post should be edited in Gusy instead of Gutenberg.
	 *
	 * @param int $post_id Post ID.
	 * @return bool
	 */
	private function is_gusy_editable_post( int $post_id ): bool {
		if ( $post_id <= 0 || ! current_user_can( 'edit_post', $post_id ) ) {
			return false;
		}

		return '1' === (string) get_post_meta( $post_id, '_gusy_edit_with_gusy', true );
	}

	/**
	 * Build the canonical Gusy editor URL for one WordPress post.
	 *
	 * @param int $post_id Post ID.
	 * @return string
	 */
	private function gusy_editor_url( int $post_id ): string {
		return add_query_arg(
			array(
				'page'      => 'gusy-ai-builder',
				'post_id'   => $post_id,
				'gusy_edit' => '1',
			),
			admin_url( 'admin.php' )
		);
	}

	/**
	 * Send direct Gutenberg edit requests for Gusy pages back to the Gusy editor.
	 */
	public function redirect_gusy_page_edits(): void {
		global $pagenow;

		if ( 'post.php' !== $pagenow ) {
			return;
		}

		$post_id = isset( $_GET['post'] ) ? absint( wp_unslash( $_GET['post'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$action  = isset( $_GET['action'] ) ? sanitize_key( wp_unslash( $_GET['action'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( 'edit' !== $action || ! $this->is_gusy_editable_post( $post_id ) ) {
			return;
		}

		wp_safe_redirect( $this->gusy_editor_url( $post_id ) );
		exit;
	}

	/**
	 * Replace WordPress edit links with the Gusy editor for Gusy pages.
	 *
	 * @param string $link Existing edit link.
	 * @param int    $post_id Post ID.
	 * @param string $context Link context.
	 * @return string
	 */
	public function filter_gusy_edit_post_link( string $link, int $post_id, string $context ): string {
		unset( $context );

		if ( ! $this->is_gusy_editable_post( $post_id ) ) {
			return $link;
		}

		return $this->gusy_editor_url( $post_id );
	}

	/**
	 * Replace front-end admin bar edit shortcuts on Gusy pages.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin bar instance.
	 */
	public function replace_admin_bar_edit_links( WP_Admin_Bar $wp_admin_bar ): void {
		if ( ! is_singular() ) {
			return;
		}

		$post = get_post();
		if ( ! $post || ! $this->is_gusy_editable_post( (int) $post->ID ) ) {
			return;
		}

		$url = $this->gusy_editor_url( (int) $post->ID );
		$wp_admin_bar->add_node(
			array(
				'id'    => 'edit',
				'title' => __( 'Edit with Gusy', 'gusy-ai-builder' ),
				'href'  => $url,
			)
		);
		$wp_admin_bar->add_node(
			array(
				'id'    => 'site-editor',
				'title' => __( 'Edit with Gusy', 'gusy-ai-builder' ),
				'href'  => $url,
			)
		);
	}

	/**
	 * Enqueue frontend assets only on generated pages.
	 */
	public function enqueue_frontend_assets(): void {
		if ( ! is_singular() ) {
			return;
		}

		$post = get_post();
		if ( ! $post || false === strpos( (string) $post->post_content, 'gusy-' ) ) {
			return;
		}

		wp_enqueue_style(
			'gusy-frontend',
			GUSY_AI_BUILDER_URL . 'assets/css/frontend.css',
			array(),
			GUSY_AI_BUILDER_VERSION
		);

		if (
			false !== strpos( $post->post_content, 'gusy-interactive' ) ||
			false !== strpos( $post->post_content, 'gusy-form' ) ||
			false !== strpos( $post->post_content, 'gusy-pricing' )
		) {
			wp_enqueue_script(
				'gusy-frontend',
				GUSY_AI_BUILDER_URL . 'assets/js/frontend.js',
				array(),
				GUSY_AI_BUILDER_VERSION,
				true
			);

			wp_localize_script(
				'gusy-frontend',
				'GusyFrontendSettings',
				array(
					'restBase' => esc_url_raw( rest_url( 'gusy/v1' ) ),
					'nonce'    => wp_create_nonce( 'wp_rest' ),
				)
			);
		}
	}

	/**
	 * Print per-page CSS variables from saved design tokens.
	 */
	public function print_page_tokens(): void {
		if ( ! is_singular() ) {
			return;
		}

		$post = get_post();
		if ( ! $post || false === strpos( (string) $post->post_content, 'gusy-' ) ) {
			return;
		}

		$tokens = get_post_meta( $post->ID, '_gusy_design_tokens', true );
		if ( ! is_array( $tokens ) ) {
			$tokens = $this->tokens->default_tokens();
		}

		$css = $this->tokens->css_variables( $tokens, ':root' );
		if ( '' === $css ) {
			return;
		}

		echo "\n<style id=\"gusy-page-tokens\">\n" . wp_strip_all_tags( $css ) . "\n</style>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Print saved JSON-LD schema for generated pages.
	 */
	public function print_page_schema(): void {
		if ( ! is_singular() ) {
			return;
		}

		$post = get_post();
		if ( ! $post || false === strpos( (string) $post->post_content, 'gusy-' ) ) {
			return;
		}

		$seo    = get_post_meta( $post->ID, '_gusy_seo', true );
		$schema = is_array( $seo ) && isset( $seo['schemaJsonLd'] ) && is_array( $seo['schemaJsonLd'] ) ? $seo['schemaJsonLd'] : array();
		if ( empty( $schema ) ) {
			return;
		}

		$json = wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		if ( ! is_string( $json ) ) {
			return;
		}

		echo "\n<script type=\"application/ld+json\" id=\"gusy-page-schema\">" . $json . "</script>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Add shortcut link.
	 *
	 * @param array<int,string> $links Existing links.
	 * @return array<int,string>
	 */
	public function plugin_action_links( array $links ): array {
		array_unshift(
			$links,
			sprintf(
				'<a href="%s">%s</a>',
				esc_url( admin_url( 'admin.php?page=gusy-ai-builder' ) ),
				esc_html__( 'Open Gusy', 'gusy-ai-builder' )
			)
		);

		return $links;
	}
}
