<?php
/**
 * REST API controller.
 *
 * @package Gusy_AI_Builder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Secured REST endpoints for Gusy editor workflows.
 */
final class Gusy_AI_Builder_Rest_Controller {
	/**
	 * REST namespace.
	 */
	private const NAMESPACE = 'gusy/v1';
	private const MAX_JSON_BYTES = 262144;
	private const MAX_IMPORT_JSON_BYTES = 524288;
	private const MAX_PROMPT_CHARS = 2000;
	private const MAX_INSTRUCTION_CHARS = 1200;
	private const MAX_SECTIONS = 12;
	private const MAX_ITEMS_PER_SECTION = 12;
	private const MAX_NOTES_PER_SECTION = 12;
	private const MAX_TEXT_CHARS = 900;
	private const MAX_TEXTAREA_CHARS = 2400;
	private const MAX_SCHEMA_BYTES = 8192;
	private const MAX_REVISIONS_PER_PAGE = 20;
	private const LEAD_RATE_LIMIT = 5;
	private const LEAD_RATE_WINDOW = 900;
	private const EDITOR_RATE_LIMIT = 40;
	private const EDITOR_RATE_WINDOW = 3600;

	/**
	 * Page generator.
	 *
	 * @var Gusy_AI_Builder_Page_Generator
	 */
	private Gusy_AI_Builder_Page_Generator $generator;

	/**
	 * Block serializer.
	 *
	 * @var Gusy_AI_Builder_Block_Serializer
	 */
	private Gusy_AI_Builder_Block_Serializer $serializer;

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
	 * Feature manager.
	 *
	 * @var Gusy_AI_Builder_Feature_Manager
	 */
	private Gusy_AI_Builder_Feature_Manager $features;

	/**
	 * Constructor.
	 *
	 * @param Gusy_AI_Builder_Page_Generator $generator Generator.
	 * @param Gusy_AI_Builder_Block_Serializer $serializer Serializer.
	 * @param Gusy_AI_Builder_Template_Repository $templates Templates.
	 * @param Gusy_AI_Builder_Design_Token_Service $tokens Tokens.
	 * @param Gusy_AI_Builder_LLM_Gateway $llm LLM gateway.
	 * @param Gusy_AI_Builder_Product_Agent $agent Product agent.
	 * @param Gusy_AI_Builder_Feature_Manager $features Feature manager.
	 */
	public function __construct(
		Gusy_AI_Builder_Page_Generator $generator,
		Gusy_AI_Builder_Block_Serializer $serializer,
		Gusy_AI_Builder_Template_Repository $templates,
		Gusy_AI_Builder_Design_Token_Service $tokens,
		Gusy_AI_Builder_LLM_Gateway $llm,
		Gusy_AI_Builder_Product_Agent $agent,
		Gusy_AI_Builder_Feature_Manager $features
	) {
		$this->generator  = $generator;
		$this->serializer = $serializer;
		$this->templates  = $templates;
		$this->tokens     = $tokens;
		$this->llm        = $llm;
		$this->agent      = $agent;
		$this->features   = $features;
	}

	/**
	 * Register routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/page/generate',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'generate_page' ),
				'args'                => array(
					'prompt' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_textarea_field',
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/page/save',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'save_page' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/pages',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'list_pages' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/page/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'load_page' ),
				'args'                => array(
					'id' => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/page/(?P<id>\d+)/revisions',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'list_revisions' ),
				'args'                => array(
					'id' => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/page/export',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'export_page' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/page/import',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'import_page' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/page/audit',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'audit_page' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/section/generate',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'generate_section' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/block/transform',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'transform_block' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/templates',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'get_templates' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/theme-kits',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'get_theme_kits' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/theme-kits/import',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_manage' ),
				'callback'            => array( $this, 'import_theme_kit' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/theme-kits/preview',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'permission_callback' => array( $this, 'can_edit' ),
					'callback'            => array( $this, 'preview_theme_kit_page' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => array( $this, 'can_edit' ),
					'callback'            => array( $this, 'preview_theme_kit_page' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/theme-kits/customize',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_manage' ),
				'callback'            => array( $this, 'customize_theme_kit' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/theme-settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'permission_callback' => array( $this, 'can_edit' ),
					'callback'            => array( $this, 'get_theme_settings' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => array( $this, 'can_manage' ),
					'callback'            => array( $this, 'save_theme_settings' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/brand-kit',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'permission_callback' => array( $this, 'can_edit' ),
					'callback'            => array( $this, 'get_brand_kit' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => array( $this, 'can_manage' ),
					'callback'            => array( $this, 'save_brand_kit' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/llm/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'permission_callback' => array( $this, 'can_manage' ),
					'callback'            => array( $this, 'get_llm_settings' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => array( $this, 'can_manage' ),
					'callback'            => array( $this, 'save_llm_settings' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/llm/test',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_manage' ),
				'callback'            => array( $this, 'test_llm_settings' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/agent/chat',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'chat_with_agent' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/agent/memory',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'permission_callback' => array( $this, 'can_edit' ),
					'callback'            => array( $this, 'get_agent_memory' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => array( $this, 'can_edit' ),
					'callback'            => array( $this, 'save_agent_memory' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/theme/context',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'get_theme_context' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/page/(?P<id>\d+)/homepage',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_manage' ),
				'callback'            => array( $this, 'set_homepage' ),
				'args'                => array(
					'id' => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/migration/elementor/pages',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'list_elementor_pages' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/migration/elementor/preview',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( $this, 'can_edit' ),
				'callback'            => array( $this, 'preview_elementor_migration' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/lead',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => '__return_true',
				'callback'            => array( $this, 'capture_lead' ),
			)
		);
	}

	/**
	 * Edit permission.
	 *
	 * @return bool
	 */
	public function can_edit(): bool {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Manage permission.
	 *
	 * @return bool
	 */
	public function can_manage(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Return true or a Pro feature error.
	 *
	 * @param string $feature Feature key.
	 * @param string $message Optional message.
	 * @return true|WP_Error
	 */
	private function require_feature( string $feature, string $message = '' ) {
		return $this->features->require_feature( $feature, $message );
	}

	/**
	 * Whether editor generation may call a configured remote/local LLM.
	 */
	private function can_use_llm_gateway(): bool {
		return $this->features->is_available( 'ai.llm_gateway' );
	}

	/**
	 * Whether a theme kit slug is unlocked on the current plan.
	 *
	 * @param string $slug Theme kit slug.
	 * @return true|WP_Error
	 */
	private function require_theme_kit_available( string $slug ) {
		if ( $this->features->is_theme_kit_available( $slug ) ) {
			return true;
		}

		return $this->require_feature( 'theme_kits.all', __( 'This premium theme kit requires Gusy AI Builder Pro.', 'gusy-ai-builder' ) );
	}

	/**
	 * Generate page.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function generate_page( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'ai.local_generation' );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$limit = $this->check_rate_limit( 'editor:' . (string) get_current_user_id(), self::EDITOR_RATE_LIMIT, self::EDITOR_RATE_WINDOW );
		if ( is_wp_error( $limit ) ) {
			return $limit;
		}

		$prompt = $this->bounded_textarea_param( $params['prompt'] ?? $request->get_param( 'prompt' ), self::MAX_PROMPT_CHARS, 'gusy_prompt_too_long', __( 'Prompt is too long.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $prompt ) ) {
			return $prompt;
		}
		$brand_kit = $params['brandKit'] ?? null;
		$brand_kit = is_array( $brand_kit ) ? $brand_kit : get_option( 'gusy_brand_kit', $this->tokens->default_tokens() );
		$blueprint = $this->generator->generate_page( $prompt, $brand_kit, $this->can_use_llm_gateway() );
		if ( is_wp_error( $blueprint ) ) {
			return $blueprint;
		}
		$source    = isset( $blueprint['source'] ) && is_array( $blueprint['source'] ) ? $blueprint['source'] : array( 'type' => 'unknown' );
		$blueprint = $this->sanitize_blueprint( $blueprint );
		if ( ! $blueprint ) {
			return new WP_Error( 'gusy_generated_blueprint_invalid', __( 'Generated blueprint is invalid.', 'gusy-ai-builder' ), array( 'status' => 502 ) );
		}
		$blueprint['source'] = $source;

		$content   = $this->serializer->serialize_page( $blueprint );

		return rest_ensure_response(
			array(
				'blueprint'    => $blueprint,
				'blockContent' => $content,
				'themeJson'    => $this->tokens->theme_json( $blueprint['page']['designSystem'] ),
				'source'       => $source,
			)
		);
	}

	/**
	 * Save or publish a page.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_page( WP_REST_Request $request ) {
		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$blueprint = isset( $params['blueprint'] ) && is_array( $params['blueprint'] ) ? $this->sanitize_blueprint( $params['blueprint'] ) : null;

		if ( ! $blueprint ) {
			return new WP_Error( 'gusy_missing_blueprint', __( 'Invalid blueprint.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$status = isset( $params['status'] ) ? sanitize_key( (string) $params['status'] ) : 'draft';
		if ( 'publish' === $status && ! current_user_can( 'publish_posts' ) ) {
			return new WP_Error( 'gusy_publish_forbidden', __( 'Publishing is not allowed.', 'gusy-ai-builder' ), array( 'status' => 403 ) );
		}
		if ( ! in_array( $status, array( 'draft', 'publish' ), true ) ) {
			$status = 'draft';
		}

		$post_id = isset( $params['postId'] ) ? absint( $params['postId'] ) : 0;
		if ( ! $post_id && ! current_user_can( 'edit_pages' ) ) {
			return new WP_Error( 'gusy_create_page_forbidden', __( 'Creating pages is not allowed.', 'gusy-ai-builder' ), array( 'status' => 403 ) );
		}
		if ( $post_id && ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error( 'gusy_edit_forbidden', __( 'Editing is not allowed.', 'gusy-ai-builder' ), array( 'status' => 403 ) );
		}

		$page    = $blueprint['page'];
		$content = $this->serializer->serialize_page( $blueprint );
		$post    = array(
			'post_type'    => 'page',
			'post_title'   => sanitize_text_field( (string) $page['title'] ),
			'post_name'    => sanitize_title( (string) $page['slug'] ),
			'post_content' => $content,
			'post_status'  => $status,
		);

		if ( $post_id ) {
			$post['ID'] = $post_id;
		}

		$saved_id = wp_insert_post( wp_slash( $post ), true );
		if ( is_wp_error( $saved_id ) ) {
			return $saved_id;
		}

		update_post_meta( $saved_id, '_gusy_ai_blueprint', $blueprint );
		update_post_meta( $saved_id, '_gusy_design_tokens', $page['designSystem'] );
		update_post_meta( $saved_id, '_gusy_seo', $page['seo'] );
		update_post_meta( $saved_id, '_gusy_edit_with_gusy', '1' );
		$this->maybe_apply_gusy_page_template( $saved_id );
		$this->store_revision( $saved_id, $blueprint );

		return rest_ensure_response(
			array(
				'postId'       => $saved_id,
				'status'       => get_post_status( $saved_id ),
				'editLink'     => get_edit_post_link( $saved_id, 'raw' ),
				'previewLink'  => get_preview_post_link( $saved_id ),
				'viewLink'     => get_permalink( $saved_id ),
				'blockContent' => $content,
			)
		);
	}

	/**
	 * List Gusy-generated pages.
	 *
	 * @return WP_REST_Response
	 */
	public function list_pages(): WP_REST_Response {
		$posts = get_posts(
			array(
				'post_type'      => 'page',
				'post_status'    => array( 'draft', 'publish', 'private', 'pending' ),
				'posts_per_page' => 30,
				'meta_key'       => '_gusy_ai_blueprint',
				'orderby'        => 'modified',
				'order'          => 'DESC',
			)
		);

		$pages = array();
		foreach ( $posts as $post ) {
			if ( ! $post instanceof WP_Post || ! current_user_can( 'edit_post', $post->ID ) ) {
				continue;
			}

			$pages[] = $this->page_summary( $post );
		}

		return rest_ensure_response(
			array(
				'pages' => $pages,
			)
		);
	}

	/**
	 * Load one Gusy page.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function load_page( WP_REST_Request $request ) {
		$post_id = absint( $request->get_param( 'id' ) );
		$post    = get_post( $post_id );

		if ( ! $post || 'page' !== $post->post_type || ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error( 'gusy_page_not_found', __( 'Page not found.', 'gusy-ai-builder' ), array( 'status' => 404 ) );
		}

		$blueprint = $this->blueprint_from_post( $post_id );
		if ( ! $blueprint ) {
			return new WP_Error( 'gusy_blueprint_not_found', __( 'This page was not created with Gusy.', 'gusy-ai-builder' ), array( 'status' => 404 ) );
		}

		return rest_ensure_response(
			array(
				'post'         => $this->page_summary( $post ),
				'blueprint'    => $blueprint,
				'blockContent' => $this->serializer->serialize_page( $blueprint ),
				'themeJson'    => $this->tokens->theme_json( $blueprint['page']['designSystem'] ),
			)
		);
	}

	/**
	 * List stored Gusy revisions for a page.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function list_revisions( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'pages.revisions', __( 'Revision history requires Gusy AI Builder Pro.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$post_id = absint( $request->get_param( 'id' ) );
		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error( 'gusy_revision_forbidden', __( 'Revisions are not available.', 'gusy-ai-builder' ), array( 'status' => 403 ) );
		}

		$posts = get_posts(
			array(
				'post_type'      => 'gusy_revision',
				'post_status'    => 'private',
				'post_parent'    => $post_id,
				'posts_per_page' => 20,
				'orderby'        => 'date',
				'order'          => 'DESC',
			)
		);

		$revisions = array();
		foreach ( $posts as $revision ) {
			$blueprint = get_post_meta( $revision->ID, '_gusy_ai_blueprint', true );
			if ( ! is_array( $blueprint ) ) {
				continue;
			}

			$revisions[] = array(
				'id'          => $revision->ID,
				'title'       => get_the_title( $revision ),
				'createdAt'   => $this->post_date_atom( $revision, false ),
				'sectionCount' => isset( $blueprint['page']['sections'] ) && is_array( $blueprint['page']['sections'] ) ? count( $blueprint['page']['sections'] ) : 0,
				'blueprint'   => $this->sanitize_blueprint( $blueprint ),
			);
		}

		return rest_ensure_response(
			array(
				'revisions' => $revisions,
			)
		);
	}

	/**
	 * Export a blueprint as a portable JSON payload.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function export_page( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'export.json' );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$blueprint = isset( $params['blueprint'] ) && is_array( $params['blueprint'] ) ? $this->sanitize_blueprint( $params['blueprint'] ) : null;

		if ( ! $blueprint ) {
			return new WP_Error( 'gusy_export_invalid', __( 'Invalid export payload.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$title   = (string) $blueprint['page']['title'];
		$payload = array(
			'format'       => 'gusy-blueprint',
			'version'      => GUSY_AI_BUILDER_VERSION,
			'exportedAt'   => gmdate( 'c' ),
			'blueprint'    => $blueprint,
			'blockContent' => $this->serializer->serialize_page( $blueprint ),
			'themeJson'    => $this->tokens->theme_json( $blueprint['page']['designSystem'] ),
			'cssVariables' => $this->tokens->css_variables( $blueprint['page']['designSystem'], '.gusy-page' ),
		);

		return rest_ensure_response(
			array(
				'filename' => sanitize_title( $title ) . '-gusy-export.json',
				'export'   => $payload,
			)
		);
	}

	/**
	 * Import a portable blueprint JSON payload.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function import_page( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'import.json' );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$params = $this->limited_request_params( $request, self::MAX_IMPORT_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$raw    = isset( $params['payload'] ) ? $params['payload'] : null;

		if ( is_string( $raw ) ) {
			$decoded = json_decode( $raw, true );
		} elseif ( is_array( $raw ) ) {
			$decoded = $raw;
		} else {
			$decoded = null;
		}

		if ( ! is_array( $decoded ) ) {
			return new WP_Error( 'gusy_import_json_invalid', __( 'The import JSON is invalid.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$blueprint = isset( $decoded['blueprint'] ) && is_array( $decoded['blueprint'] ) ? $decoded['blueprint'] : $decoded;
		$blueprint = $this->sanitize_blueprint( $blueprint );

		if ( ! $blueprint ) {
			return new WP_Error( 'gusy_import_invalid', __( 'No valid Gusy blueprint was found.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		return rest_ensure_response(
			array(
				'blueprint'    => $blueprint,
				'blockContent' => $this->serializer->serialize_page( $blueprint ),
				'audit'        => $this->build_audit( $blueprint ),
			)
		);
	}

	/**
	 * Audit a page blueprint.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function audit_page( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'audit.basic' );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$blueprint = isset( $params['blueprint'] ) && is_array( $params['blueprint'] ) ? $this->sanitize_blueprint( $params['blueprint'] ) : null;

		if ( ! $blueprint ) {
			return new WP_Error( 'gusy_audit_invalid', __( 'Invalid blueprint.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		return rest_ensure_response(
			array(
				'audit'        => $this->build_audit( $blueprint ),
				'blockContent' => $this->serializer->serialize_page( $blueprint ),
			)
		);
	}

	/**
	 * Generate one section from a target type and prompt.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function generate_section( WP_REST_Request $request ) {
		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$limit = $this->check_rate_limit( 'editor:' . (string) get_current_user_id(), self::EDITOR_RATE_LIMIT, self::EDITOR_RATE_WINDOW );
		if ( is_wp_error( $limit ) ) {
			return $limit;
		}
		$type   = isset( $params['type'] ) ? sanitize_key( (string) $params['type'] ) : 'features';
		$prompt = $this->bounded_textarea_param( $params['prompt'] ?? '', self::MAX_PROMPT_CHARS, 'gusy_prompt_too_long', __( 'Prompt is too long.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $prompt ) ) {
			return $prompt;
		}

		$template = null;
		foreach ( $this->templates->get_sections() as $candidate ) {
			if ( $type === $candidate['type'] || $type === $candidate['id'] ) {
				$template = $candidate;
				break;
			}
		}

		if ( ! $template ) {
			return new WP_Error( 'gusy_section_type_invalid', __( 'Section type not found.', 'gusy-ai-builder' ), array( 'status' => 404 ) );
		}

		$use_llm = $this->can_use_llm_gateway();
		$section = $this->generator->generate_section( $type, $prompt, $template['section'], $use_llm );
		if ( is_wp_error( $section ) ) {
			return $section;
		}

		return rest_ensure_response(
			array(
				'section' => $this->sanitize_section( $section ),
				'source'  => $use_llm && $this->llm->is_configured() && '' !== $prompt ? $this->llm->source() : array( 'type' => 'local-fallback' ),
			)
		);
	}

	/**
	 * Transform selected section.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function transform_block( WP_REST_Request $request ) {
		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$limit = $this->check_rate_limit( 'editor:' . (string) get_current_user_id(), self::EDITOR_RATE_LIMIT, self::EDITOR_RATE_WINDOW );
		if ( is_wp_error( $limit ) ) {
			return $limit;
		}
		$section     = isset( $params['section'] ) && is_array( $params['section'] ) ? $params['section'] : null;
		$instruction = $this->bounded_textarea_param( $params['instruction'] ?? '', self::MAX_INSTRUCTION_CHARS, 'gusy_instruction_too_long', __( 'Instruction is too long.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $instruction ) ) {
			return $instruction;
		}

		if ( ! $section || '' === $instruction ) {
			return new WP_Error( 'gusy_transform_invalid', __( 'Invalid section or instruction.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$use_llm = $this->can_use_llm_gateway();
		$updated = $this->generator->transform_section( $section, $instruction, $use_llm );
		if ( is_wp_error( $updated ) ) {
			return $updated;
		}

		$updated = $this->sanitize_section( $updated );

		return rest_ensure_response(
			array(
				'section' => $updated,
				'audit'   => $this->generator->audit_blueprint( array( $updated ) ),
				'source'  => $use_llm && $this->llm->is_configured() ? $this->llm->source() : array( 'type' => 'local-fallback' ),
			)
		);
	}

	/**
	 * Get templates.
	 *
	 * @return WP_REST_Response
	 */
	public function get_templates(): WP_REST_Response {
		return rest_ensure_response(
			array(
				'templates' => $this->templates->get_sections(),
			)
		);
	}

	/**
	 * Get installable Gusy theme kits from the active base theme.
	 *
	 * @return WP_REST_Response
	 */
	public function get_theme_kits(): WP_REST_Response {
		if ( ! function_exists( 'gusy_base_template_catalog' ) ) {
			return rest_ensure_response(
				array(
					'available' => false,
					'message'   => __( 'Activate the Gusy Base theme to use theme kits.', 'gusy-ai-builder' ),
					'kits'      => array(),
					'settings'  => $this->theme_settings(),
				)
			);
		}

		$kits = array();
		foreach ( array( 'en', 'fr' ) as $language ) {
			foreach ( gusy_base_template_catalog( $language ) as $template ) {
				$kits[] = $this->theme_kit_summary( $template, $language );
			}
		}

		return rest_ensure_response(
			array(
				'available' => true,
				'kits'      => $kits,
				'settings'  => $this->theme_settings(),
			)
		);
	}

	/**
	 * Import one complete Gusy theme kit into WordPress pages.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function import_theme_kit( WP_REST_Request $request ) {
		if ( ! current_user_can( 'edit_pages' ) ) {
			return new WP_Error( 'gusy_theme_import_forbidden', __( 'Creating pages is not allowed.', 'gusy-ai-builder' ), array( 'status' => 403 ) );
		}
		if ( ! function_exists( 'gusy_base_template_catalog' ) || ! function_exists( 'gusy_base_render_template_pattern' ) ) {
			return new WP_Error( 'gusy_theme_missing', __( 'The Gusy Base theme is required to import theme kits.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$params   = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$params   = is_array( $params ) ? $params : $request->get_params();
		$slug     = isset( $params['slug'] ) ? sanitize_title( (string) $params['slug'] ) : '';
		$language = isset( $params['language'] ) && 'fr' === sanitize_key( (string) $params['language'] ) ? 'fr' : 'en';
		$scope    = isset( $params['scope'] ) ? sanitize_key( (string) $params['scope'] ) : 'full';
		$set_home = isset( $params['setHome'] ) ? rest_sanitize_boolean( $params['setHome'] ) : false;

		$template = $this->find_theme_template( $slug, $language );
		if ( ! $template ) {
			return new WP_Error( 'gusy_theme_not_found', __( 'Theme kit not found.', 'gusy-ai-builder' ), array( 'status' => 404 ) );
		}
		$kit_feature = $this->require_theme_kit_available( $slug );
		if ( is_wp_error( $kit_feature ) ) {
			return $kit_feature;
		}
		$import_feature = $this->require_feature(
			'single' === $scope ? 'theme_kits.import_single' : 'theme_kits.import_full',
			'single' === $scope ? __( 'Theme kit import requires Pro.', 'gusy-ai-builder' ) : __( 'Full multi-page theme kits require Gusy AI Builder Pro.', 'gusy-ai-builder' )
		);
		if ( is_wp_error( $import_feature ) ) {
			return $import_feature;
		}

		$imported = array();
		$home_id  = $this->import_theme_page(
			$template,
			array(
				'type'    => 'home',
				'title'   => (string) $template['brand'],
				'slug'    => function_exists( 'gusy_base_template_page_slug' ) ? gusy_base_template_page_slug( $template ) : sanitize_title( (string) $template['slug'] ),
				'content' => gusy_base_render_template_pattern( $template ),
				'blueprint' => function_exists( 'gusy_base_template_blueprint' ) ? gusy_base_template_blueprint( $template ) : null,
				'seo'     => array(
					'metaTitle'       => (string) $template['brand'] . ' - ' . (string) $template['name'],
					'metaDescription' => (string) $template['body'],
				),
			)
		);

		if ( is_wp_error( $home_id ) ) {
			return $home_id;
		}

		$imported[] = $this->imported_theme_page_summary( $home_id, 'home' );

		if ( 'single' !== $scope && function_exists( 'gusy_base_secondary_pages' ) && function_exists( 'gusy_base_render_secondary_page' ) ) {
			foreach ( gusy_base_secondary_pages( $template ) as $page ) {
				$secondary_slug = function_exists( 'gusy_base_template_page_slug' ) ? gusy_base_template_page_slug( $template, (string) $page['slug_suffix'] ) : sanitize_title( (string) $template['slug'] . '-' . (string) $page['slug_suffix'] );
				$secondary_id   = $this->import_theme_page(
					$template,
					array(
						'type'      => (string) $page['type'],
						'title'     => (string) $page['title'],
						'slug'      => $secondary_slug,
						'content'   => gusy_base_render_secondary_page( $template, (string) $page['type'] ),
						'blueprint' => function_exists( 'gusy_base_secondary_page_blueprint' ) ? gusy_base_secondary_page_blueprint( $template, $page ) : null,
						'seo'       => array(
							'metaTitle'       => (string) $page['title'] . ' - ' . (string) $template['brand'],
							'metaDescription' => (string) $page['metaDescription'],
						),
					)
				);

				if ( is_wp_error( $secondary_id ) ) {
					return $secondary_id;
				}

				$imported[] = $this->imported_theme_page_summary( $secondary_id, (string) $page['type'] );
			}
		}

		if ( $set_home && $home_id ) {
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', $home_id );
		}

		$settings = $this->theme_settings(
			array(
				'activeKit' => (string) $template['slug'],
				'language'  => $language,
			)
		);

		return rest_ensure_response(
			array(
				'kit'      => $this->theme_kit_summary( $template, $language ),
				'pages'    => $imported,
				'settings' => $settings,
			)
		);
	}

	/**
	 * Preview a Gusy theme-kit page as an editable blueprint before import.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function preview_theme_kit_page( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'theme_kits.preview' );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}
		if ( ! function_exists( 'gusy_base_template_catalog' ) ) {
			return new WP_Error( 'gusy_theme_missing', __( 'The Gusy Base theme is required to preview theme kits.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$params   = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$params   = is_array( $params ) ? $params : $request->get_params();
		$slug     = sanitize_title( (string) ( $params['slug'] ?? '' ) );
		$language = 'fr' === sanitize_key( (string) ( $params['language'] ?? '' ) ) ? 'fr' : 'en';
		$type     = sanitize_key( (string) ( $params['type'] ?? 'home' ) );
		$template = $this->find_theme_template( $slug, $language );

		if ( ! $template ) {
			return new WP_Error( 'gusy_theme_not_found', __( 'Theme kit not found.', 'gusy-ai-builder' ), array( 'status' => 404 ) );
		}
		$kit_feature = $this->require_theme_kit_available( $slug );
		if ( is_wp_error( $kit_feature ) ) {
			return $kit_feature;
		}

		$blueprint = $this->theme_kit_page_blueprint( $template, $type );
		if ( ! $blueprint ) {
			return new WP_Error( 'gusy_theme_page_not_found', __( 'Theme kit page not found.', 'gusy-ai-builder' ), array( 'status' => 404 ) );
		}

		if ( isset( $params['profile'] ) && is_array( $params['profile'] ) ) {
			$profile   = $this->sanitize_theme_profile( $params['profile'], $template );
			$blueprint = $this->personalize_theme_blueprint( $blueprint, $template, $profile, $type );
		}

		$blueprint = $this->sanitize_blueprint( $blueprint );
		if ( ! $blueprint ) {
			return new WP_Error( 'gusy_theme_preview_invalid', __( 'Theme kit preview is invalid.', 'gusy-ai-builder' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response(
			array(
				'kit'          => $this->theme_kit_summary( $template, $language ),
				'page'         => array(
					'type'  => $type,
					'title' => (string) $blueprint['page']['title'],
					'slug'  => (string) $blueprint['page']['slug'],
				),
				'blueprint'    => $blueprint,
				'blockContent' => $this->serializer->serialize_page( $blueprint ),
			)
		);
	}

	/**
	 * Import or update a full theme kit with one real business profile.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function customize_theme_kit( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'theme_kits.customize', __( 'Theme kit customization requires Gusy AI Builder Pro.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}
		if ( ! current_user_can( 'edit_pages' ) ) {
			return new WP_Error( 'gusy_theme_customize_forbidden', __( 'Creating pages is not allowed.', 'gusy-ai-builder' ), array( 'status' => 403 ) );
		}
		if ( ! function_exists( 'gusy_base_template_catalog' ) ) {
			return new WP_Error( 'gusy_theme_missing', __( 'The Gusy Base theme is required to customize theme kits.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$params   = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$params   = is_array( $params ) ? $params : $request->get_params();
		$slug     = isset( $params['slug'] ) ? sanitize_title( (string) $params['slug'] ) : '';
		$language = isset( $params['language'] ) && 'fr' === sanitize_key( (string) $params['language'] ) ? 'fr' : 'en';
		$set_home = isset( $params['setHome'] ) ? rest_sanitize_boolean( $params['setHome'] ) : false;

		$template = $this->find_theme_template( $slug, $language );
		if ( ! $template ) {
			return new WP_Error( 'gusy_theme_not_found', __( 'Theme kit not found.', 'gusy-ai-builder' ), array( 'status' => 404 ) );
		}
		$kit_feature = $this->require_theme_kit_available( $slug );
		if ( is_wp_error( $kit_feature ) ) {
			return $kit_feature;
		}

		$profile  = $this->sanitize_theme_profile( isset( $params['profile'] ) && is_array( $params['profile'] ) ? $params['profile'] : array(), $template );
		$page_map = $this->theme_kit_page_map( $template );
		$imported = array();

		foreach ( $page_map as $type => $page ) {
			$blueprint = $this->theme_kit_page_blueprint( $template, $type );
			if ( ! $blueprint ) {
				continue;
			}

			$blueprint = $this->personalize_theme_blueprint( $blueprint, $template, $profile, $type );
			$blueprint = $this->sanitize_blueprint( $blueprint );
			if ( ! $blueprint ) {
				continue;
			}

			$post_id = $this->import_theme_page(
				$template,
				array(
					'type'      => $type,
					'title'     => (string) $blueprint['page']['title'],
					'slug'      => (string) $blueprint['page']['slug'],
					'content'   => $this->serializer->serialize_page( $blueprint ),
					'blueprint' => $blueprint,
					'seo'       => isset( $blueprint['page']['seo'] ) && is_array( $blueprint['page']['seo'] ) ? $blueprint['page']['seo'] : array(),
				)
			);

			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}

			$imported[] = $this->imported_theme_page_summary( (int) $post_id, $type );
		}

		$home_page = null;
		foreach ( $imported as $page ) {
			if ( 'home' === $page['type'] ) {
				$home_page = $page;
				break;
			}
		}

		if ( $set_home && is_array( $home_page ) && ! empty( $home_page['id'] ) ) {
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', absint( $home_page['id'] ) );
		}

		$this->sync_theme_navigation_menu( $profile, $imported );

		$settings = $this->theme_settings(
			array(
				'activeKit' => (string) $template['slug'],
				'language'  => $language,
			)
		);

		return rest_ensure_response(
			array(
				'kit'      => $this->theme_kit_summary( $template, $language ),
				'pages'    => $imported,
				'profile'  => $profile,
				'settings' => $settings,
			)
		);
	}

	/**
	 * Get saved Gusy theme settings.
	 *
	 * @return WP_REST_Response
	 */
	public function get_theme_settings(): WP_REST_Response {
		return rest_ensure_response(
			array(
				'settings' => $this->theme_settings(),
			)
		);
	}

	/**
	 * Save Gusy theme settings.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function save_theme_settings( WP_REST_Request $request ) {
		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$params = is_array( $params ) ? $params : $request->get_params();

		return rest_ensure_response(
			array(
				'settings' => $this->theme_settings( $params ),
			)
		);
	}

	/**
	 * Default theme-kit settings.
	 *
	 * @return array<string,string|bool>
	 */
	private function theme_setting_defaults(): array {
		return array(
			'activeKit'      => '',
			'language'       => 'en',
			'styleVariation' => 'editorial',
			'density'        => 'comfortable',
			'buttonStyle'    => 'solid',
			'imageTone'      => 'natural',
			'setHomeOnImport'=> true,
		);
	}

	/**
	 * Read and optionally patch Gusy theme-kit settings.
	 *
	 * @param array<string,mixed> $patch Settings patch.
	 * @return array<string,string|bool>
	 */
	private function theme_settings( array $patch = array() ): array {
		$current = get_option( 'gusy_theme_settings', array() );
		$current = is_array( $current ) ? $current : array();
		$settings = $this->sanitize_theme_settings( array_merge( $this->theme_setting_defaults(), $current, $patch ) );

		if ( ! empty( $patch ) ) {
			update_option( 'gusy_theme_settings', $settings );
		}

		return $settings;
	}

	/**
	 * Sanitize theme-kit settings.
	 *
	 * @param array<string,mixed> $settings Raw settings.
	 * @return array<string,string|bool>
	 */
	private function sanitize_theme_settings( array $settings ): array {
		$allowed_languages  = array( 'en', 'fr' );
		$allowed_variations = array( 'editorial', 'luxe', 'clean', 'warm', 'bold' );
		$allowed_density    = array( 'compact', 'comfortable', 'editorial' );
		$allowed_buttons    = array( 'solid', 'soft', 'outline' );
		$allowed_tones      = array( 'natural', 'bright', 'warm', 'contrast' );

		$language       = in_array( (string) ( $settings['language'] ?? '' ), $allowed_languages, true ) ? (string) $settings['language'] : 'en';
		$style_variation = in_array( (string) ( $settings['styleVariation'] ?? '' ), $allowed_variations, true ) ? (string) $settings['styleVariation'] : 'editorial';
		$density        = in_array( (string) ( $settings['density'] ?? '' ), $allowed_density, true ) ? (string) $settings['density'] : 'comfortable';
		$button_style   = in_array( (string) ( $settings['buttonStyle'] ?? '' ), $allowed_buttons, true ) ? (string) $settings['buttonStyle'] : 'solid';
		$image_tone     = in_array( (string) ( $settings['imageTone'] ?? '' ), $allowed_tones, true ) ? (string) $settings['imageTone'] : 'natural';

		return array(
			'activeKit'       => sanitize_title( (string) ( $settings['activeKit'] ?? '' ) ),
			'language'        => $language,
			'styleVariation'  => $style_variation,
			'density'         => $density,
			'buttonStyle'     => $button_style,
			'imageTone'       => $image_tone,
			'setHomeOnImport' => isset( $settings['setHomeOnImport'] ) ? rest_sanitize_boolean( $settings['setHomeOnImport'] ) : true,
		);
	}

	/**
	 * Find a Gusy base template by slug and language.
	 *
	 * @param string $slug Template slug.
	 * @param string $language Language.
	 * @return array<string,mixed>|null
	 */
	private function find_theme_template( string $slug, string $language ): ?array {
		if ( ! function_exists( 'gusy_base_template_catalog' ) ) {
			return null;
		}

		foreach ( gusy_base_template_catalog( $language ) as $template ) {
			if ( $slug === sanitize_title( (string) ( $template['slug'] ?? '' ) ) ) {
				return $template;
			}
		}

		return null;
	}

	/**
	 * Build editable defaults for the guided business profile.
	 *
	 * @param array<string,mixed> $template Template data.
	 * @return array<string,mixed>
	 */
	private function theme_profile_defaults( array $template ): array {
		$contact = isset( $template['contact'] ) && is_array( $template['contact'] ) ? $template['contact'] : array();
		$reviews = function_exists( 'gusy_base_template_reviews' ) ? gusy_base_template_reviews( $template ) : array();
		$offers  = array();

		foreach ( isset( $template['offers'] ) && is_array( $template['offers'] ) ? $template['offers'] : array() as $offer ) {
			if ( ! is_array( $offer ) ) {
				continue;
			}

			$offers[] = array(
				'title' => (string) ( $offer['title'] ?? '' ),
				'body'  => (string) ( $offer['body'] ?? '' ),
				'label' => (string) ( $offer['price'] ?? '' ),
			);
		}

		$clean_reviews = array();
		foreach ( $reviews as $review ) {
			if ( ! is_array( $review ) ) {
				continue;
			}

			$clean_reviews[] = array(
				'quote'  => (string) ( $review['quote'] ?? '' ),
				'person' => (string) ( $review['person'] ?? '' ),
				'role'   => (string) ( $review['role'] ?? '' ),
			);
		}

		$slug = sanitize_title( (string) ( $template['slug'] ?? '' ) );
		$gallery = array(
			function_exists( 'gusy_base_image_url' ) ? gusy_base_image_url( $slug . '-hero.jpg' ) : '',
			function_exists( 'gusy_base_image_url' ) ? gusy_base_image_url( $slug . '-offer.jpg' ) : '',
			function_exists( 'gusy_base_image_url' ) ? gusy_base_image_url( $slug . '-detail.jpg' ) : '',
			function_exists( 'gusy_base_image_url' ) ? gusy_base_image_url( $slug . '-testimonial-1.jpg' ) : '',
			function_exists( 'gusy_base_image_url' ) ? gusy_base_image_url( $slug . '-testimonial-2.jpg' ) : '',
			function_exists( 'gusy_base_image_url' ) ? gusy_base_image_url( $slug . '-testimonial-3.jpg' ) : '',
		);

		return array(
			'businessName'    => (string) ( $template['brand'] ?? '' ),
			'city'            => (string) ( $template['location'] ?? '' ),
			'address'         => (string) ( $contact['address'] ?? '' ),
			'phone'           => (string) ( $contact['phone'] ?? '' ),
			'email'           => (string) ( $contact['email'] ?? '' ),
			'hours'           => (string) ( $contact['hours'] ?? '' ),
			'primaryAction'   => (string) ( $template['primary'] ?? '' ),
			'secondaryAction' => (string) ( $template['secondary'] ?? '' ),
			'heroTitle'       => (string) ( $template['title'] ?? '' ),
			'heroBody'        => (string) ( $template['body'] ?? '' ),
			'menuPages'       => array( 'home', 'offers', 'work', 'about', 'contact' ),
			'offers'          => $offers,
			'reviews'         => $clean_reviews,
			'heroImageUrl'    => $gallery[0],
			'offerImages'     => array_slice( $gallery, 1, 3 ),
			'reviewImages'    => array_slice( $gallery, 3, 3 ),
		);
	}

	/**
	 * Sanitize one guided business profile.
	 *
	 * @param array<string,mixed> $profile Raw profile.
	 * @param array<string,mixed> $template Template data.
	 * @return array<string,mixed>
	 */
	private function sanitize_theme_profile( array $profile, array $template ): array {
		$defaults = $this->theme_profile_defaults( $template );
		$strings  = array( 'businessName', 'city', 'address', 'phone', 'email', 'hours', 'primaryAction', 'secondaryAction', 'heroTitle', 'heroBody' );
		$clean    = $defaults;

		foreach ( $strings as $key ) {
			if ( ! array_key_exists( $key, $profile ) ) {
				continue;
			}

			$value = 'heroBody' === $key ? sanitize_textarea_field( (string) $profile[ $key ] ) : sanitize_text_field( (string) $profile[ $key ] );
			$clean[ $key ] = '' !== trim( $value ) ? $value : $defaults[ $key ];
		}

		if ( isset( $profile['email'] ) ) {
			$email = sanitize_email( (string) $profile['email'] );
			$clean['email'] = '' !== $email ? $email : $defaults['email'];
		}

		$allowed_pages = array( 'home', 'offers', 'work', 'about', 'contact' );
		if ( isset( $profile['menuPages'] ) && is_array( $profile['menuPages'] ) ) {
			$menu_pages = array_values(
				array_filter(
					array_map(
						static function ( $page ) use ( $allowed_pages ) {
							$page = sanitize_key( (string) $page );
							return in_array( $page, $allowed_pages, true ) ? $page : '';
						},
						$profile['menuPages']
					)
				)
			);

			$clean['menuPages'] = ! empty( $menu_pages ) ? array_values( array_unique( $menu_pages ) ) : $defaults['menuPages'];
		}

		foreach ( array( 'heroImageUrl' ) as $key ) {
			if ( isset( $profile[ $key ] ) ) {
				$url = esc_url_raw( (string) $profile[ $key ] );
				$clean[ $key ] = '' !== $url ? $url : $defaults[ $key ];
			}
		}

		foreach ( array( 'offerImages', 'reviewImages' ) as $key ) {
			if ( ! isset( $profile[ $key ] ) || ! is_array( $profile[ $key ] ) ) {
				continue;
			}

			$urls = array();
			foreach ( array_slice( $profile[ $key ], 0, 6 ) as $url ) {
				$url = esc_url_raw( (string) $url );
				if ( '' !== $url ) {
					$urls[] = $url;
				}
			}
			if ( ! empty( $urls ) ) {
				$clean[ $key ] = $urls;
			}
		}

		if ( isset( $profile['offers'] ) && is_array( $profile['offers'] ) ) {
			$offers = array();
			foreach ( array_slice( $profile['offers'], 0, 6 ) as $offer ) {
				if ( ! is_array( $offer ) ) {
					continue;
				}

				$title = sanitize_text_field( (string) ( $offer['title'] ?? '' ) );
				$body  = sanitize_textarea_field( (string) ( $offer['body'] ?? '' ) );
				$label = sanitize_text_field( (string) ( $offer['label'] ?? '' ) );
				if ( '' !== $title || '' !== $body || '' !== $label ) {
					$offers[] = array(
						'title' => '' !== $title ? $title : __( 'Offer', 'gusy-ai-builder' ),
						'body'  => $body,
						'label' => $label,
					);
				}
			}
			if ( ! empty( $offers ) ) {
				$clean['offers'] = $offers;
			}
		}

		if ( isset( $profile['reviews'] ) && is_array( $profile['reviews'] ) ) {
			$reviews = array();
			foreach ( array_slice( $profile['reviews'], 0, 6 ) as $review ) {
				if ( ! is_array( $review ) ) {
					continue;
				}

				$quote  = sanitize_textarea_field( (string) ( $review['quote'] ?? '' ) );
				$person = sanitize_text_field( (string) ( $review['person'] ?? '' ) );
				$role   = sanitize_text_field( (string) ( $review['role'] ?? '' ) );
				if ( '' !== $quote || '' !== $person || '' !== $role ) {
					$reviews[] = array(
						'quote'  => $quote,
						'person' => '' !== $person ? $person : __( 'Customer', 'gusy-ai-builder' ),
						'role'   => $role,
					);
				}
			}
			if ( ! empty( $reviews ) ) {
				$clean['reviews'] = $reviews;
			}
		}

		return $clean;
	}

	/**
	 * Return all page definitions for a theme kit.
	 *
	 * @param array<string,mixed> $template Template data.
	 * @return array<string,array<string,mixed>>
	 */
	private function theme_kit_page_map( array $template ): array {
		$home_slug = function_exists( 'gusy_base_template_page_slug' ) ? gusy_base_template_page_slug( $template ) : sanitize_title( (string) ( $template['slug'] ?? '' ) );
		$pages     = array(
			'home' => array(
				'type'        => 'home',
				'title'       => (string) ( $template['brand'] ?? '' ),
				'menu_label'  => function_exists( 'gusy_base_text' ) ? gusy_base_text( 'navHome', $template ) : 'Home',
				'slug'        => $home_slug,
				'slug_suffix' => '',
			),
		);

		if ( function_exists( 'gusy_base_secondary_pages' ) ) {
			foreach ( gusy_base_secondary_pages( $template ) as $page ) {
				if ( ! is_array( $page ) || empty( $page['type'] ) ) {
					continue;
				}
				$pages[ sanitize_key( (string) $page['type'] ) ] = $page;
			}
		}

		return $pages;
	}

	/**
	 * Build one theme-kit page blueprint without saving it.
	 *
	 * @param array<string,mixed> $template Template data.
	 * @param string             $type Page type.
	 * @return array<string,mixed>|null
	 */
	private function theme_kit_page_blueprint( array $template, string $type ): ?array {
		$type = sanitize_key( $type );

		if ( 'home' === $type && function_exists( 'gusy_base_template_blueprint' ) ) {
			return gusy_base_template_blueprint( $template );
		}

		if ( ! function_exists( 'gusy_base_secondary_pages' ) || ! function_exists( 'gusy_base_secondary_page_blueprint' ) ) {
			return null;
		}

		foreach ( gusy_base_secondary_pages( $template ) as $page ) {
			if ( is_array( $page ) && $type === sanitize_key( (string) ( $page['type'] ?? '' ) ) ) {
				return gusy_base_secondary_page_blueprint( $template, $page );
			}
		}

		return null;
	}

	/**
	 * Build menu items from the guided page selection.
	 *
	 * @param array<string,mixed> $template Template data.
	 * @param array<string,mixed> $profile Business profile.
	 * @return array<int,array<string,string>>
	 */
	private function theme_profile_nav_items( array $template, array $profile ): array {
		$page_map  = $this->theme_kit_page_map( $template );
		$menu      = isset( $profile['menuPages'] ) && is_array( $profile['menuPages'] ) ? $profile['menuPages'] : array_keys( $page_map );
		$nav_items = array();

		foreach ( $menu as $type ) {
			$type = sanitize_key( (string) $type );
			if ( ! isset( $page_map[ $type ] ) ) {
				continue;
			}

			$page   = $page_map[ $type ];
			$suffix = (string) ( $page['slug_suffix'] ?? '' );
			$url    = function_exists( 'gusy_base_template_page_url' ) ? gusy_base_template_page_url( $template, $suffix ) : home_url( '/' . (string) ( $page['slug'] ?? '' ) . '/' );
			$label  = (string) ( $page['menu_label'] ?? $page['title'] ?? ucfirst( $type ) );

			$nav_items[] = array(
				'title' => $label,
				'body'  => $url,
				'label' => '',
			);
		}

		return $nav_items;
	}

	/**
	 * Apply a business profile to a base blueprint.
	 *
	 * @param array<string,mixed> $blueprint Blueprint.
	 * @param array<string,mixed> $template Template data.
	 * @param array<string,mixed> $profile Business profile.
	 * @param string             $type Page type.
	 * @return array<string,mixed>
	 */
	private function personalize_theme_blueprint( array $blueprint, array $template, array $profile, string $type ): array {
		if ( ! isset( $blueprint['page'] ) || ! is_array( $blueprint['page'] ) ) {
			return $blueprint;
		}

		$contact_url = function_exists( 'gusy_base_template_page_url' ) ? gusy_base_template_page_url( $template, 'contact' ) : '#contact';
		$offers_url  = function_exists( 'gusy_base_template_page_url' ) && function_exists( 'gusy_base_secondary_slug_suffix' ) ? gusy_base_template_page_url( $template, gusy_base_secondary_slug_suffix( $template, 'offers' ) ) : '#offres';
		$nav_items   = $this->theme_profile_nav_items( $template, $profile );
		$page_title  = 'home' === $type ? (string) $profile['businessName'] : (string) $blueprint['page']['title'];
		$contact_line = implode(
			' - ',
			array_filter(
				array(
					(string) $profile['address'],
					(string) $profile['hours'],
					(string) $profile['phone'],
					(string) $profile['email'],
				)
			)
		);

		$blueprint['page']['title'] = $page_title;
		$blueprint['page']['seo']   = array(
			'metaTitle'       => $page_title . ' - ' . (string) $profile['city'],
			'metaDescription' => (string) $profile['heroBody'],
			'schemaJsonLd'    => array(
				'@context'  => 'https://schema.org',
				'@type'     => 'LocalBusiness',
				'name'      => (string) $profile['businessName'],
				'address'   => (string) $profile['address'],
				'email'     => (string) $profile['email'],
				'telephone' => (string) $profile['phone'],
			),
		);

		foreach ( $blueprint['page']['sections'] as &$section ) {
			if ( ! is_array( $section ) ) {
				continue;
			}

			$section_type = sanitize_key( (string) ( $section['type'] ?? '' ) );
			$section_id   = sanitize_key( (string) ( $section['id'] ?? '' ) );

			if ( 'header' === $section_type ) {
				$section['title'] = (string) $profile['businessName'];
				$section['body']  = (string) $profile['city'];
				$section['cta']   = array(
					'label' => (string) $profile['primaryAction'],
					'url'   => $contact_url,
				);
				$section['items'] = $nav_items;
				continue;
			}

			if ( 'hero' === $section_type ) {
				$section['kicker'] = (string) $profile['city'];
				if ( 'home' === $type ) {
					$section['title'] = (string) $profile['heroTitle'];
					$section['body']  = (string) $profile['heroBody'];
				}
				$section['cta'] = array(
					'label'          => (string) $profile['primaryAction'],
					'url'            => $contact_url,
					'secondaryLabel' => (string) $profile['secondaryAction'],
					'secondaryUrl'   => $offers_url,
				);
				if ( ! empty( $profile['heroImageUrl'] ) ) {
					$section['settings']['backgroundImage'] = array(
						'id'    => 0,
						'url'   => (string) $profile['heroImageUrl'],
						'alt'   => (string) $profile['businessName'],
						'title' => (string) $profile['businessName'],
					);
				}
				continue;
			}

			if ( 'pricing' === $section_type || 'offres' === $section_id ) {
				$section['items'] = $this->profile_offer_items( $profile, isset( $section['items'] ) && is_array( $section['items'] ) ? $section['items'] : array() );
				$section['cta']   = array(
					'label' => (string) $profile['primaryAction'],
					'url'   => $contact_url,
				);
				continue;
			}

			if ( 'testimonials' === $section_type || 'preuve' === $section_id ) {
				$section['items'] = $this->profile_review_items( $profile, isset( $section['items'] ) && is_array( $section['items'] ) ? $section['items'] : array() );
				continue;
			}

			if ( in_array( $section_type, array( 'form', 'newsletter', 'lead-magnet' ), true ) || 'contact' === $section_id ) {
				$section['title'] = (string) $profile['primaryAction'];
				$section['body']  = $contact_line;
				$section['cta']   = array(
					'label' => (string) $profile['primaryAction'],
					'url'   => 'mailto:' . (string) $profile['email'],
				);
				$section['items'] = array(
					array( 'title' => 'Name', 'body' => 'Your full name', 'label' => 'text' ),
					array( 'title' => 'Email', 'body' => 'Your email address', 'label' => 'email' ),
					array( 'title' => 'Project', 'body' => 'Tell us what you need', 'label' => 'textarea' ),
				);
			}
		}
		unset( $section );

		return $blueprint;
	}

	/**
	 * Build personalized offer cards while preserving fallback images.
	 *
	 * @param array<string,mixed> $profile Business profile.
	 * @param array<int,mixed>    $current_items Current items.
	 * @return array<int,array<string,mixed>>
	 */
	private function profile_offer_items( array $profile, array $current_items ): array {
		$items  = array();
		$images = isset( $profile['offerImages'] ) && is_array( $profile['offerImages'] ) ? $profile['offerImages'] : array();

		foreach ( isset( $profile['offers'] ) && is_array( $profile['offers'] ) ? $profile['offers'] : array() as $index => $offer ) {
			if ( ! is_array( $offer ) ) {
				continue;
			}

			$image = isset( $current_items[ $index ]['image'] ) && is_array( $current_items[ $index ]['image'] ) ? $current_items[ $index ]['image'] : array();
			if ( ! empty( $images[ $index ] ) ) {
				$image = array(
					'id'    => 0,
					'url'   => (string) $images[ $index ],
					'alt'   => (string) ( $offer['title'] ?? '' ),
					'title' => (string) ( $offer['title'] ?? '' ),
				);
			}

			$items[] = array(
				'title' => (string) ( $offer['title'] ?? '' ),
				'body'  => (string) ( $offer['body'] ?? '' ),
				'label' => (string) ( $offer['label'] ?? '' ),
				'image' => $image,
			);
		}

		return $items;
	}

	/**
	 * Build personalized review cards while preserving portrait images.
	 *
	 * @param array<string,mixed> $profile Business profile.
	 * @param array<int,mixed>    $current_items Current items.
	 * @return array<int,array<string,mixed>>
	 */
	private function profile_review_items( array $profile, array $current_items ): array {
		$items  = array();
		$images = isset( $profile['reviewImages'] ) && is_array( $profile['reviewImages'] ) ? $profile['reviewImages'] : array();

		foreach ( isset( $profile['reviews'] ) && is_array( $profile['reviews'] ) ? $profile['reviews'] : array() as $index => $review ) {
			if ( ! is_array( $review ) ) {
				continue;
			}

			$person = (string) ( $review['person'] ?? '' );
			$image  = isset( $current_items[ $index ]['image'] ) && is_array( $current_items[ $index ]['image'] ) ? $current_items[ $index ]['image'] : array();
			if ( ! empty( $images[ $index ] ) ) {
				$image = array(
					'id'    => 0,
					'url'   => (string) $images[ $index ],
					'alt'   => $person,
					'title' => $person,
				);
			}

			$items[] = array(
				'title' => $person,
				'body'  => (string) ( $review['quote'] ?? '' ),
				'label' => (string) ( $review['role'] ?? '' ),
				'image' => $image,
			);
		}

		return $items;
	}

	/**
	 * Create or refresh a normal WordPress menu for the selected kit pages.
	 *
	 * @param array<string,mixed> $profile Business profile.
	 * @param array<int,array<string,mixed>> $pages Imported pages.
	 */
	private function sync_theme_navigation_menu( array $profile, array $pages ): void {
		$menu_name = 'Gusy - ' . (string) $profile['businessName'];
		$menu      = wp_get_nav_menu_object( $menu_name );
		$menu_id   = $menu ? (int) $menu->term_id : (int) wp_create_nav_menu( $menu_name );

		if ( $menu_id <= 0 ) {
			return;
		}

		$existing_items = wp_get_nav_menu_items( $menu_id );
		if ( is_array( $existing_items ) ) {
			foreach ( $existing_items as $item ) {
				wp_delete_post( (int) $item->ID, true );
			}
		}

		$page_ids = array();
		foreach ( $pages as $page ) {
			if ( ! empty( $page['type'] ) && ! empty( $page['id'] ) ) {
				$page_ids[ sanitize_key( (string) $page['type'] ) ] = absint( $page['id'] );
			}
		}

		$order = 1;
		foreach ( isset( $profile['menuPages'] ) && is_array( $profile['menuPages'] ) ? $profile['menuPages'] : array_keys( $page_ids ) as $type ) {
			$type = sanitize_key( (string) $type );
			if ( empty( $page_ids[ $type ] ) ) {
				continue;
			}

			wp_update_nav_menu_item(
				$menu_id,
				0,
				array(
					'menu-item-object-id' => $page_ids[ $type ],
					'menu-item-object'    => 'page',
					'menu-item-type'      => 'post_type',
					'menu-item-status'    => 'publish',
					'menu-item-position'  => $order,
				)
			);
			$order++;
		}

		$locations = get_theme_mod( 'nav_menu_locations', array() );
		$locations = is_array( $locations ) ? $locations : array();
		$locations['primary'] = $menu_id;
		$locations['gusy_primary'] = $menu_id;
		set_theme_mod( 'nav_menu_locations', $locations );
	}

	/**
	 * Build a REST summary for one Gusy theme kit.
	 *
	 * @param array<string,mixed> $template Template data.
	 * @param string              $language Language.
	 * @return array<string,mixed>
	 */
	private function theme_kit_summary( array $template, string $language ): array {
		$slug      = sanitize_title( (string) ( $template['slug'] ?? '' ) );
		$is_locked = ! $this->features->is_theme_kit_available( $slug );
		$pages     = array();
		$image_url = function_exists( 'gusy_base_image_url' ) ? gusy_base_image_url( $slug . '-hero.jpg' ) : '';
		$tokens    = function_exists( 'gusy_base_template_design_tokens' ) ? gusy_base_template_design_tokens( $template ) : array();
		$gallery   = array();

		if ( function_exists( 'gusy_base_image_url' ) ) {
			$gallery_files = array(
				array( $slug . '-hero.jpg', (string) ( $template['brand'] ?? $template['name'] ?? '' ) ),
				array( $slug . '-offer.jpg', (string) ( $template['offersTitle'] ?? $template['name'] ?? '' ) ),
				array( $slug . '-detail.jpg', (string) ( $template['detailTitle'] ?? $template['name'] ?? '' ) ),
				array( $slug . '-testimonial-1.jpg', __( 'Customer portrait', 'gusy-ai-builder' ) . ' 1' ),
				array( $slug . '-testimonial-2.jpg', __( 'Customer portrait', 'gusy-ai-builder' ) . ' 2' ),
				array( $slug . '-testimonial-3.jpg', __( 'Customer portrait', 'gusy-ai-builder' ) . ' 3' ),
			);

			foreach ( $gallery_files as $item ) {
				$gallery[] = array(
					'src'   => gusy_base_image_url( $item[0] ),
					'label' => $item[1],
				);
			}
		}

		$home_slug = function_exists( 'gusy_base_template_page_slug' ) ? gusy_base_template_page_slug( $template ) : $slug;
		$pages[]   = $this->theme_kit_page_summary( 'home', 'Home', $home_slug );

		if ( function_exists( 'gusy_base_secondary_pages' ) ) {
			foreach ( gusy_base_secondary_pages( $template ) as $page ) {
				$page_slug = function_exists( 'gusy_base_template_page_slug' ) ? gusy_base_template_page_slug( $template, (string) $page['slug_suffix'] ) : sanitize_title( $slug . '-' . (string) $page['slug_suffix'] );
				$pages[]   = $this->theme_kit_page_summary( (string) $page['type'], (string) $page['menu_label'], $page_slug );
			}
		}

		return array(
			'id'        => $language . ':' . $slug,
			'slug'      => $slug,
			'language'  => $language,
			'name'      => (string) ( $template['name'] ?? $slug ),
			'brand'     => (string) ( $template['brand'] ?? '' ),
			'title'     => (string) ( $template['title'] ?? '' ),
			'body'      => (string) ( $template['body'] ?? '' ),
			'location'  => (string) ( $template['location'] ?? '' ),
			'primary'   => (string) ( $template['primary'] ?? '' ),
			'secondary' => (string) ( $template['secondary'] ?? '' ),
			'imageUrl'  => $image_url,
			'isPro'     => $is_locked,
			'locked'    => $is_locked,
			'gallery'   => $gallery,
			'imageCount'=> count( $gallery ),
			'pages'     => $pages,
			'profile'   => $this->theme_profile_defaults( $template ),
			'tokens'    => $tokens,
		);
	}

	/**
	 * Build a page summary for one kit page.
	 *
	 * @param string $type Page type.
	 * @param string $label Page label.
	 * @param string $slug Page slug.
	 * @return array<string,mixed>
	 */
	private function theme_kit_page_summary( string $type, string $label, string $slug ): array {
		$page = $this->theme_page_by_slug( $slug );
		$can_read = $page instanceof WP_Post && ( 'publish' === get_post_status( $page ) || current_user_can( 'read_post', $page->ID ) || current_user_can( 'edit_post', $page->ID ) );
		$can_edit = $page instanceof WP_Post && current_user_can( 'edit_post', $page->ID );

		return array(
			'type'     => $type,
			'label'    => $label,
			'slug'     => $slug,
			'id'       => $page instanceof WP_Post ? (int) $page->ID : 0,
			'viewLink' => $can_read ? get_permalink( $page ) : '',
			'editLink' => $can_edit ? get_edit_post_link( $page->ID, 'raw' ) : '',
		);
	}

	/**
	 * Insert or update a WordPress page for a Gusy theme kit.
	 *
	 * @param array<string,mixed> $template Template data.
	 * @param array<string,mixed> $payload Page payload.
	 * @return int|WP_Error
	 */
	private function import_theme_page( array $template, array $payload ) {
		$slug     = sanitize_title( (string) $payload['slug'] );
		$existing = $this->theme_page_by_slug( $slug );
		$post     = array(
			'post_type'    => 'page',
			'post_title'   => sanitize_text_field( (string) $payload['title'] ),
			'post_name'    => $slug,
			'post_content' => (string) $payload['content'],
			'post_status'  => 'publish',
		);

		if ( $existing instanceof WP_Post ) {
			if ( ! current_user_can( 'edit_post', $existing->ID ) ) {
				return new WP_Error( 'gusy_theme_page_forbidden', __( 'You cannot update an existing page with this slug.', 'gusy-ai-builder' ), array( 'status' => 403 ) );
			}
			$post['ID'] = $existing->ID;
		}

		$post_id = wp_insert_post( wp_slash( $post ), true );
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		$tokens    = function_exists( 'gusy_base_template_design_tokens' ) ? gusy_base_template_design_tokens( $template ) : $this->tokens->default_tokens();
		$blueprint = isset( $payload['blueprint'] ) && is_array( $payload['blueprint'] ) ? $payload['blueprint'] : null;
		$seo       = isset( $payload['seo'] ) && is_array( $payload['seo'] ) ? $payload['seo'] : array();

		update_post_meta( $post_id, '_gusy_edit_with_gusy', '1' );
		update_post_meta( $post_id, '_gusy_base_template_slug', sanitize_title( (string) $template['slug'] ) );
		update_post_meta( $post_id, '_gusy_base_template_language', function_exists( 'gusy_base_template_language' ) ? gusy_base_template_language( $template ) : 'en' );
		update_post_meta( $post_id, '_gusy_base_template_page_type', sanitize_key( (string) $payload['type'] ) );
		update_post_meta( $post_id, '_gusy_design_tokens', $tokens );
		update_post_meta( $post_id, '_gusy_seo', $seo );

		if ( $blueprint ) {
			update_post_meta( $post_id, '_gusy_ai_blueprint', $this->sanitize_blueprint( $blueprint ) );
			$this->store_revision( $post_id, $blueprint );
		}

		$this->maybe_apply_gusy_page_template( $post_id );

		return (int) $post_id;
	}

	/**
	 * Find an existing page by exact slug, including drafts owned by previous kit imports.
	 *
	 * @param string $slug Page slug.
	 * @return WP_Post|null
	 */
	private function theme_page_by_slug( string $slug ): ?WP_Post {
		$slug  = sanitize_title( $slug );
		$pages = get_posts(
			array(
				'name'        => $slug,
				'post_type'   => 'page',
				'post_status' => array( 'publish', 'draft', 'pending', 'private', 'future' ),
				'numberposts' => 1,
				'orderby'     => 'ID',
				'order'       => 'ASC',
			)
		);

		return $pages && $pages[0] instanceof WP_Post ? $pages[0] : null;
	}

	/**
	 * Return a short page import summary.
	 *
	 * @param int    $post_id Page ID.
	 * @param string $type Page type.
	 * @return array<string,mixed>
	 */
	private function imported_theme_page_summary( int $post_id, string $type ): array {
		$can_read = 'publish' === get_post_status( $post_id ) || current_user_can( 'read_post', $post_id ) || current_user_can( 'edit_post', $post_id );
		$can_edit = current_user_can( 'edit_post', $post_id );

		return array(
			'id'        => $post_id,
			'type'      => $type,
			'title'     => get_the_title( $post_id ),
			'viewLink'  => $can_read ? get_permalink( $post_id ) : '',
			'editLink'  => $can_edit ? get_edit_post_link( $post_id, 'raw' ) : '',
			'status'    => get_post_status( $post_id ),
		);
	}

	/**
	 * Use the Gusy fullscreen template when it is available.
	 *
	 * @param int $post_id Page ID.
	 */
	private function maybe_apply_gusy_page_template( int $post_id ): void {
		if ( 'page' !== get_post_type( $post_id ) ) {
			return;
		}

		if ( file_exists( get_stylesheet_directory() . '/page-gusy-fullscreen.php' ) || file_exists( get_template_directory() . '/page-gusy-fullscreen.php' ) ) {
			update_post_meta( $post_id, '_wp_page_template', 'page-gusy-fullscreen.php' );
		}
	}

	/**
	 * Get brand kit.
	 *
	 * @return WP_REST_Response
	 */
	public function get_brand_kit(): WP_REST_Response {
		return rest_ensure_response(
			array(
				'brandKit' => get_option( 'gusy_brand_kit', $this->tokens->default_tokens() ),
			)
		);
	}

	/**
	 * Get LLM gateway settings.
	 *
	 * @return WP_REST_Response
	 */
	public function get_llm_settings() {
		$feature = $this->require_feature( 'ai.llm_gateway', __( 'LLM Gateway requires Gusy AI Builder Pro.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		return rest_ensure_response(
			array(
				'settings' => $this->llm->get_public_settings(),
			)
		);
	}

	/**
	 * Save LLM gateway settings.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function save_llm_settings( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'ai.llm_gateway', __( 'LLM Gateway requires Gusy AI Builder Pro.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}

		return rest_ensure_response(
			array(
				'settings' => $this->llm->save_settings( is_array( $params ) ? $params : array() ),
			)
		);
	}

	/**
	 * Test LLM gateway settings.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function test_llm_settings( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'ai.llm_gateway', __( 'LLM Gateway requires Gusy AI Builder Pro.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$result = $this->llm->test_connection( is_array( $params ) ? $params : array() );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Chat with the product agent.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function chat_with_agent( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'ai.product_agent', __( 'The product assistant requires Gusy AI Builder Pro.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$limit = $this->check_rate_limit( 'editor:' . (string) get_current_user_id(), self::EDITOR_RATE_LIMIT, self::EDITOR_RATE_WINDOW );
		if ( is_wp_error( $limit ) ) {
			return $limit;
		}
		$message = $this->bounded_textarea_param( $params['message'] ?? '', self::MAX_PROMPT_CHARS, 'gusy_agent_message_too_long', __( 'Message is too long.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $message ) ) {
			return $message;
		}
		$context = isset( $params['context'] ) && is_array( $params['context'] ) ? $params['context'] : array();
		$result  = $this->agent->chat( $message, $context );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Get project memory.
	 *
	 * @return WP_REST_Response
	 */
	public function get_agent_memory() {
		$feature = $this->require_feature( 'ai.agent_memory', __( 'Project memory requires Gusy AI Builder Pro.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		return rest_ensure_response(
			array(
				'memory' => $this->agent->get_memory(),
			)
		);
	}

	/**
	 * Save project memory.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function save_agent_memory( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'ai.agent_memory', __( 'Project memory requires Gusy AI Builder Pro.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}

		return rest_ensure_response(
			array(
				'memory' => $this->agent->save_memory( is_array( $params ) ? $params : array() ),
			)
		);
	}

	/**
	 * Get active WordPress theme context for Gusy adaptation.
	 *
	 * @return WP_REST_Response
	 */
	public function get_theme_context(): WP_REST_Response {
		return rest_ensure_response(
			array(
				'theme' => $this->agent->theme_context(),
			)
		);
	}

	/**
	 * Set a saved Gusy page as the WordPress homepage.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function set_homepage( WP_REST_Request $request ) {
		$post_id = absint( $request->get_param( 'id' ) );
		$post    = get_post( $post_id );

		if ( ! $post || 'page' !== $post->post_type ) {
			return new WP_Error( 'gusy_homepage_invalid', __( 'Page not found.', 'gusy-ai-builder' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error( 'gusy_homepage_forbidden', __( 'You cannot update homepage settings.', 'gusy-ai-builder' ), array( 'status' => 403 ) );
		}
		if ( '1' !== (string) get_post_meta( $post_id, '_gusy_edit_with_gusy', true ) ) {
			return new WP_Error( 'gusy_homepage_not_gusy', __( 'Only Gusy pages can be set from this endpoint.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $post_id );

		return rest_ensure_response(
			array(
				'postId' => $post_id,
				'status' => 'homepage',
				'viewLink' => get_permalink( $post_id ),
			)
		);
	}

	/**
	 * List pages that look like Elementor pages.
	 *
	 * @return WP_REST_Response
	 */
	public function list_elementor_pages() {
		$feature = $this->require_feature( 'migration.elementor', __( 'Elementor migration requires Gusy AI Builder Pro.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$meta_posts = get_posts(
			array(
				'post_type'      => array( 'page', 'post' ),
				'post_status'    => array( 'draft', 'publish', 'private', 'pending' ),
				'posts_per_page' => 50,
				'meta_key'       => '_elementor_data',
				'orderby'        => 'modified',
				'order'          => 'DESC',
			)
		);

		$site_posts = get_posts(
			array(
				'post_type'      => array( 'page', 'post' ),
				'post_status'    => array( 'draft', 'publish', 'private', 'pending' ),
				'posts_per_page' => 80,
				'orderby'        => 'modified',
				'order'          => 'DESC',
			)
		);

		$seen  = array();
		$pages = array();
		foreach ( array_merge( $meta_posts, $site_posts ) as $post ) {
			if ( isset( $seen[ $post->ID ] ) || ! current_user_can( 'edit_post', $post->ID ) ) {
				continue;
			}
			$seen[ $post->ID ] = true;

			$summary = $this->migration_page_summary( $post );
			if ( $summary ) {
				$pages[] = $summary;
			}
		}

		usort(
			$pages,
			static function ( array $a, array $b ): int {
				if ( (bool) $a['hasElementorData'] !== (bool) $b['hasElementorData'] ) {
					return (bool) $a['hasElementorData'] ? -1 : 1;
				}

				return (int) $b['compatibility'] <=> (int) $a['compatibility'];
			}
		);

		return rest_ensure_response(
			array(
				'pages' => array_slice( $pages, 0, 60 ),
			)
		);
	}

	/**
	 * Build a Gusy blueprint preview from an Elementor page.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function preview_elementor_migration( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'migration.elementor', __( 'Elementor migration requires Gusy AI Builder Pro.', 'gusy-ai-builder' ) );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$post_id = isset( $params['postId'] ) ? absint( $params['postId'] ) : 0;
		$post    = get_post( $post_id );

		if ( ! $post || ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error( 'gusy_elementor_page_not_found', __( 'Elementor page not found.', 'gusy-ai-builder' ), array( 'status' => 404 ) );
		}

		$elementor_data = (string) get_post_meta( $post_id, '_elementor_data', true );
		$has_elementor  = '' !== trim( $elementor_data );
		$widget_count   = $has_elementor ? $this->count_elementor_widgets( $elementor_data ) : 0;
		$texts          = $has_elementor ? $this->extract_elementor_texts( $elementor_data ) : array();
		$images         = $has_elementor ? $this->extract_elementor_images( $elementor_data ) : array();

		if ( empty( $texts ) ) {
			$texts = $this->extract_plain_texts( $post->post_content );
		}

		if ( empty( $texts ) ) {
			$title = trim( get_the_title( $post ) );
			$texts = '' !== $title ? array( $title ) : array();
		}

		$brand_kit = get_option( 'gusy_brand_kit', $this->tokens->default_tokens() );
		$blueprint = $this->build_migrated_blueprint( $post, $texts, is_array( $brand_kit ) ? $brand_kit : array(), $has_elementor, $widget_count, $images );
		$blueprint = $this->sanitize_blueprint( $blueprint );
		if ( ! $blueprint ) {
			return new WP_Error( 'gusy_migration_empty', __( 'This page has no usable content to migrate.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$compatibility = $this->migration_compatibility( count( $texts ), $widget_count, $has_elementor );
		$warnings      = $this->migration_warnings( count( $texts ), $widget_count, $has_elementor );

		return rest_ensure_response(
			array(
				'blueprint'    => $blueprint,
				'audit'        => $this->build_audit( $blueprint ),
				'blockContent' => $this->serializer->serialize_page( $blueprint ),
				'original'     => array(
					'id'       => $post_id,
					'title'    => get_the_title( $post ),
					'editLink' => get_edit_post_link( $post_id, 'raw' ),
					'viewLink' => get_permalink( $post ),
				),
				'metrics'      => array(
					'source'        => $has_elementor ? 'elementor' : 'wordpress',
					'compatibility' => $compatibility,
					'textCount'     => count( $texts ),
					'widgetCount'   => $widget_count,
					'warnings'      => $warnings,
				),
			)
		);
	}

	/**
	 * Save brand kit.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_brand_kit( WP_REST_Request $request ) {
		$params = $this->limited_request_params( $request, self::MAX_JSON_BYTES );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$tokens = isset( $params['brandKit'] ) && is_array( $params['brandKit'] ) ? $params['brandKit'] : null;

		if ( ! $tokens ) {
			return new WP_Error( 'gusy_brand_invalid', __( 'Invalid brand kit.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$tokens = $this->tokens->normalize_tokens( $tokens );
		update_option( 'gusy_brand_kit', $tokens, false );

		return rest_ensure_response(
			array(
				'brandKit'  => $tokens,
				'themeJson' => $this->tokens->theme_json( $tokens ),
			)
		);
	}

	/**
	 * Capture public lead from generated forms.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function capture_lead( WP_REST_Request $request ) {
		$feature = $this->require_feature( 'leads.capture' );
		if ( is_wp_error( $feature ) ) {
			return $feature;
		}

		$params = $this->limited_request_params( $request, 32768 );
		if ( is_wp_error( $params ) ) {
			return $params;
		}
		$company = isset( $params['company'] ) ? trim( (string) $params['company'] ) : '';
		if ( '' !== $company ) {
			return new WP_Error( 'gusy_spam_rejected', __( 'Request rejected.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$name    = $this->limit_text( sanitize_text_field( (string) ( $params['name'] ?? '' ) ), 120 );
		$email   = sanitize_email( $this->limit_text( (string) ( $params['email'] ?? '' ), 254 ) );
		$message = $this->limit_text( sanitize_textarea_field( (string) ( $params['message'] ?? '' ) ), 3000 );
		$consent = isset( $params['privacyConsent'] ) ? rest_sanitize_boolean( $params['privacyConsent'] ) : false;

		if ( '' === $name || '' === $email || ! is_email( $email ) || '' === $message ) {
			return new WP_Error( 'gusy_lead_invalid', __( 'Please fill in the required fields.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		if ( ! $consent ) {
			return new WP_Error( 'gusy_lead_consent_required', __( 'Please accept the privacy notice.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$ip_bucket = $this->lead_rate_bucket();
		$ip_limit  = $this->check_rate_limit( 'lead-ip:' . $ip_bucket, self::LEAD_RATE_LIMIT, self::LEAD_RATE_WINDOW );
		if ( is_wp_error( $ip_limit ) ) {
			return $ip_limit;
		}
		$email_limit = $this->check_rate_limit( 'lead-email:' . wp_hash( strtolower( $email ) ), self::LEAD_RATE_LIMIT, self::LEAD_RATE_WINDOW );
		if ( is_wp_error( $email_limit ) ) {
			return $email_limit;
		}

		$this->delete_expired_leads();
		$source_url_raw = $params['sourceUrl'] ?? wp_get_referer();
		$source_url     = esc_url_raw( (string) ( $source_url_raw ?: home_url( '/' ) ) );
		$source_post_id = $source_url ? absint( url_to_postid( $source_url ) ) : 0;
		$lead_id = wp_insert_post(
			array(
				'post_type'   => 'gusy_lead',
				'post_status' => 'private',
				'post_title'  => $name . ' - ' . gmdate( 'Y-m-d H:i' ),
				'post_parent' => $source_post_id,
				'meta_input'  => array(
					'_gusy_name'              => $name,
					'_gusy_email'             => $email,
					'_gusy_message'           => $message,
					'_gusy_url'               => $source_url,
					'_gusy_privacy_accepted'  => '1',
					'_gusy_retention_expires' => gmdate( 'c', time() + ( $this->lead_retention_days() * DAY_IN_SECONDS ) ),
				),
			),
			true
		);

		if ( is_wp_error( $lead_id ) ) {
			return $lead_id;
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'message' => __( 'Request sent.', 'gusy-ai-builder' ),
			)
		);
	}

	/**
	 * Return JSON or request params only when the payload is bounded.
	 *
	 * @param WP_REST_Request $request Request.
	 * @param int             $max_bytes Max encoded payload size.
	 * @return array<string,mixed>|WP_Error
	 */
	private function limited_request_params( WP_REST_Request $request, int $max_bytes ) {
		$content_length = absint( $request->get_header( 'content-length' ) );
		if ( $content_length > $max_bytes ) {
			return new WP_Error( 'gusy_payload_too_large', __( 'Request payload is too large.', 'gusy-ai-builder' ), array( 'status' => 413 ) );
		}

		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}
		$params = is_array( $params ) ? $params : array();

		$encoded = wp_json_encode( $params );
		if ( is_string( $encoded ) && strlen( $encoded ) > $max_bytes ) {
			return new WP_Error( 'gusy_payload_too_large', __( 'Request payload is too large.', 'gusy-ai-builder' ), array( 'status' => 413 ) );
		}

		return $params;
	}

	/**
	 * Sanitize textarea input and reject values that would create costly requests.
	 *
	 * @param mixed  $value Raw value.
	 * @param int    $limit Character limit.
	 * @param string $code Error code.
	 * @param string $message Error message.
	 * @return string|WP_Error
	 */
	private function bounded_textarea_param( $value, int $limit, string $code, string $message ) {
		$value = sanitize_textarea_field( (string) $value );
		if ( strlen( $value ) > $limit ) {
			return new WP_Error( $code, $message, array( 'status' => 400 ) );
		}

		return $value;
	}

	/**
	 * Increment a simple transient-backed rate limit bucket.
	 *
	 * @param string $bucket Bucket id.
	 * @param int    $limit Max hits.
	 * @param int    $window Window in seconds.
	 * @return true|WP_Error
	 */
	private function check_rate_limit( string $bucket, int $limit, int $window ) {
		$key   = 'gusy_rl_' . md5( $bucket );
		$count = get_transient( $key );
		$count = false === $count ? 0 : absint( $count );

		if ( $count >= $limit ) {
			return new WP_Error( 'gusy_rate_limited', __( 'Too many requests. Please try again later.', 'gusy-ai-builder' ), array( 'status' => 429 ) );
		}

		set_transient( $key, $count + 1, $window );
		return true;
	}

	/**
	 * Hash the remote address for public lead rate limiting.
	 */
	private function lead_rate_bucket(): string {
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
		if ( function_exists( 'wp_privacy_anonymize_ip' ) ) {
			$ip = wp_privacy_anonymize_ip( $ip );
		}

		return wp_hash( $ip );
	}

	/**
	 * Configurable lead retention in days.
	 */
	private function lead_retention_days(): int {
		return max( 30, min( 730, absint( apply_filters( 'gusy_lead_retention_days', 180 ) ) ) );
	}

	/**
	 * Delete expired lead records in small batches.
	 */
	private function delete_expired_leads(): void {
		$cutoff = gmdate( 'Y-m-d H:i:s', time() - ( $this->lead_retention_days() * DAY_IN_SECONDS ) );
		$ids    = get_posts(
			array(
				'post_type'      => 'gusy_lead',
				'post_status'    => 'private',
				'posts_per_page' => 20,
				'fields'         => 'ids',
				'date_query'     => array(
					array(
						'before'    => $cutoff,
						'inclusive' => true,
					),
				),
			)
		);

		foreach ( $ids as $id ) {
			wp_delete_post( absint( $id ), true );
		}
	}

	/**
	 * Keep the internal revision store bounded.
	 *
	 * @param int $post_id Parent page ID.
	 */
	private function prune_revisions( int $post_id ): void {
		$ids = get_posts(
			array(
				'post_type'      => 'gusy_revision',
				'post_status'    => 'private',
				'post_parent'    => $post_id,
				'posts_per_page' => 100,
				'fields'         => 'ids',
				'orderby'        => 'date',
				'order'          => 'DESC',
			)
		);

		foreach ( array_slice( $ids, self::MAX_REVISIONS_PER_PAGE ) as $id ) {
			wp_delete_post( absint( $id ), true );
		}
	}

	/**
	 * Limit text without assuming mbstring is installed.
	 *
	 * @param string $text Text.
	 * @param int    $limit Max chars.
	 */
	private function limit_text( string $text, int $limit ): string {
		$text = trim( $text );
		if ( strlen( $text ) <= $limit ) {
			return $text;
		}

		return function_exists( 'mb_substr' ) ? mb_substr( $text, 0, $limit ) : substr( $text, 0, $limit );
	}

	/**
	 * Store an internal revision snapshot.
	 *
	 * @param int                 $post_id Post ID.
	 * @param array<string,mixed> $blueprint Blueprint.
	 */
	private function store_revision( int $post_id, array $blueprint ): void {
		if ( ! $this->features->is_available( 'pages.revisions' ) ) {
			return;
		}

		wp_insert_post(
			array(
				'post_type'    => 'gusy_revision',
				'post_status'  => 'private',
				'post_parent'  => $post_id,
				'post_title'   => 'Revision page ' . $post_id . ' - ' . current_time( 'mysql' ),
				'post_content' => '',
				'meta_input'   => array(
					'_gusy_ai_blueprint' => $blueprint,
				),
			)
		);

		$this->prune_revisions( $post_id );
	}

	/**
	 * Build a compact page summary.
	 *
	 * @param WP_Post $post Post.
	 * @return array<string,mixed>
	 */
	private function page_summary( WP_Post $post ): array {
		$title = html_entity_decode(
			wp_specialchars_decode( get_the_title( $post ), ENT_QUOTES ),
			ENT_QUOTES | ENT_HTML5,
			get_bloginfo( 'charset' ) ?: 'UTF-8'
		);
		$can_read = 'publish' === get_post_status( $post ) || current_user_can( 'read_post', $post->ID ) || current_user_can( 'edit_post', $post->ID );
		$can_edit = current_user_can( 'edit_post', $post->ID );

		return array(
			'id'          => $post->ID,
			'title'       => $title,
			'status'      => get_post_status( $post ),
			'modifiedAt'  => $this->post_date_atom( $post, true ),
			'editLink'    => $can_edit ? get_edit_post_link( $post->ID, 'raw' ) : '',
			'previewLink' => $can_edit ? get_preview_post_link( $post ) : '',
			'viewLink'    => $can_read ? get_permalink( $post ) : '',
		);
	}

	/**
	 * Return an ISO date for a post using WordPress timestamps safely.
	 *
	 * @param WP_Post $post Post.
	 * @param bool    $modified Use modified time instead of created time.
	 * @return string
	 */
	private function post_date_atom( WP_Post $post, bool $modified ): string {
		$timestamp = $modified ? get_post_modified_time( 'U', true, $post ) : get_post_time( 'U', true, $post );
		if ( ! is_numeric( $timestamp ) || (int) $timestamp <= 0 ) {
			$timestamp = time();
		}

		return gmdate( 'c', (int) $timestamp );
	}

	/**
	 * Build one migration source row from a real WordPress post.
	 *
	 * @param WP_Post $post Post.
	 * @return array<string,mixed>|null
	 */
	private function migration_page_summary( WP_Post $post ): ?array {
		$title          = trim( get_the_title( $post ) );
		$elementor_data = (string) get_post_meta( $post->ID, '_elementor_data', true );
		$has_elementor  = '' !== trim( $elementor_data );
		$gusy_blueprint = get_post_meta( $post->ID, '_gusy_ai_blueprint', true );

		if ( ! $has_elementor && is_array( $gusy_blueprint ) ) {
			return null;
		}

		$texts          = $has_elementor ? $this->extract_elementor_texts( $elementor_data ) : array();

		if ( empty( $texts ) ) {
			$texts = $this->extract_plain_texts( $post->post_content );
		}

		if ( empty( $texts ) && '' !== $title ) {
			$texts = array( $title );
		}

		if ( '' === $title && empty( $texts ) ) {
			return null;
		}

		$widget_count  = $has_elementor ? $this->count_elementor_widgets( $elementor_data ) : 0;
		$text_count    = count( $texts );
		$compatibility = $this->migration_compatibility( $text_count, $widget_count, $has_elementor );

		return array(
			'id'               => $post->ID,
			'title'            => '' !== $title ? $title : __( 'Untitled page', 'gusy-ai-builder' ),
			'type'             => $post->post_type,
			'status'           => $post->post_status,
			'modifiedAt'       => $this->post_date_atom( $post, true ),
			'editLink'         => get_edit_post_link( $post->ID, 'raw' ),
			'viewLink'         => get_permalink( $post ),
			'hasElementorData' => $has_elementor,
			'source'           => $has_elementor ? 'elementor' : 'wordpress',
			'compatibility'    => $compatibility,
			'textCount'        => $text_count,
			'widgetCount'      => $widget_count,
			'warnings'         => $this->migration_warnings( $text_count, $widget_count, $has_elementor ),
		);
	}

	/**
	 * Score how cleanly a source page can become a Gusy blueprint.
	 *
	 * @param int  $text_count Text fragments.
	 * @param int  $widget_count Elementor widgets.
	 * @param bool $has_elementor Whether Elementor JSON exists.
	 * @return int
	 */
	private function migration_compatibility( int $text_count, int $widget_count, bool $has_elementor ): int {
		$score = $has_elementor ? 72 : 64;
		$score += min( 18, $text_count * 3 );
		$score += min( 8, $widget_count );

		if ( $widget_count > 24 ) {
			$score -= 8;
		}

		if ( $has_elementor && $text_count < 6 ) {
			$score -= 8;
		}

		if ( $text_count < 2 ) {
			$score -= 10;
		}

		return max( 42, min( 96, $score ) );
	}

	/**
	 * Return compact migration warnings.
	 *
	 * @param int  $text_count Text fragments.
	 * @param int  $widget_count Elementor widgets.
	 * @param bool $has_elementor Whether Elementor JSON exists.
	 * @return array<int,string>
	 */
	private function migration_warnings( int $text_count, int $widget_count, bool $has_elementor ): array {
		$warnings = array();

		if ( ! $has_elementor ) {
			$warnings[] = __( 'WordPress source', 'gusy-ai-builder' );
		}

		if ( $text_count < 2 ) {
			$warnings[] = __( 'Low content', 'gusy-ai-builder' );
		}

		if ( $has_elementor && $text_count > 1 && $text_count < 6 ) {
			$warnings[] = __( 'Review generated sections', 'gusy-ai-builder' );
		}

		if ( $widget_count > 24 ) {
			$warnings[] = __( 'Complex widgets', 'gusy-ai-builder' );
		}

		return $warnings;
	}

	/**
	 * Build a Gusy blueprint directly from source content without filler copy.
	 *
	 * @param WP_Post             $post Source post.
	 * @param array<int,string>   $texts Extracted text fragments.
	 * @param array<string,mixed> $brand_kit Brand tokens.
	 * @param bool                $has_elementor Whether Elementor JSON exists.
	 * @param int                 $widget_count Elementor widget count.
	 * @return array<string,mixed>
	 */
	private function build_migrated_blueprint( WP_Post $post, array $texts, array $brand_kit, bool $has_elementor, int $widget_count, array $images = array() ): array {
		$source_title = $this->title_from_text( get_the_title( $post ), __( 'Imported page', 'gusy-ai-builder' ) );
		$texts = array_values(
			array_filter(
				array_unique(
					array_map(
						static function ( $text ) {
							return trim( (string) preg_replace( '/\s+/', ' ', wp_strip_all_tags( (string) $text ) ) );
						},
						$texts
					)
				),
				static function ( $text ) {
					return strlen( (string) $text ) > 2;
				}
			)
		);

		$title = $this->migration_title( $source_title, $texts, $has_elementor );
		if ( empty( $texts ) && '' !== $title ) {
			$texts = array( $title );
		}

		$body       = $this->migration_body_text( $post, $texts, $title );
		$tokens     = $this->tokens->normalize_tokens( ! empty( $brand_kit ) ? $brand_kit : $this->tokens->default_tokens() );
		$source     = $has_elementor ? 'Elementor' : 'WordPress';
		$text_count = count( $texts );
		$actions    = $this->migration_action_labels( $texts );
		$primary_action = $actions[0] ?? __( 'Contact us', 'gusy-ai-builder' );
		$secondary_action = $actions[1] ?? __( 'Read more', 'gusy-ai-builder' );
		$action_keys = array_map( 'strtolower', $actions );
		$content_texts = array_values(
			array_filter(
				$texts,
				static function ( $text ) use ( $title, $body, $action_keys ) {
					$clean = strtolower( (string) $text );
					return $clean !== strtolower( $title ) && $clean !== strtolower( $body ) && ! in_array( $clean, $action_keys, true );
				}
			)
		);
		$content_items = $this->migration_items( $content_texts );
		if ( empty( $content_items ) && '' !== $body && strtolower( $body ) !== strtolower( $title ) ) {
			$content_items[] = array(
				'label' => '01',
				'title' => __( 'Page details', 'gusy-ai-builder' ),
				'body'  => $body,
			);
		}
		foreach ( $content_items as $index => $item ) {
			if ( isset( $images[ $index + 1 ] ) ) {
				$content_items[ $index ]['image'] = $images[ $index + 1 ];
			}
		}

		$hero_items    = array_slice( $content_items, 0, 3 );
		$hero_settings = array(
			'background'  => ! empty( $images ) ? 'hero' : 'plain',
			'spacing'     => 'xl',
			'columns'     => 2,
			'mobileStack' => true,
			'interactive' => false,
		);
		if ( ! empty( $images[0] ) ) {
			$hero_settings['backgroundImage'] = $images[0];
		}
		$sections   = array(
			array(
				'id'       => sanitize_key( 'gusy-migrated-hero-' . $post->ID ),
				'type'     => 'hero',
				'variant'  => $has_elementor ? 'elementor-import' : 'wordpress-import',
				'label'    => 'Hero',
				'intent'   => 'Preserve the source page promise.',
				'kicker'   => $source,
				'title'    => $title,
				'body'     => $body,
				'cta'      => array(
					'label'          => $primary_action,
					'url'            => '#content',
					'secondaryLabel' => $secondary_action,
					'secondaryUrl'   => '#content',
				),
				'items'    => $hero_items,
				'settings' => $hero_settings,
				'notes'    => array(),
			),
		);

		if ( ! empty( $content_items ) ) {
			$sections[] = array(
				'id'       => sanitize_key( 'gusy-migrated-content-' . $post->ID ),
				'type'     => 'features',
				'variant'  => 'source-map',
				'label'    => 'Content',
				'intent'   => 'Convert source text into editable blocks.',
				'kicker'   => __( 'Content', 'gusy-ai-builder' ),
				'title'    => $this->title_from_text( $content_items[0]['title'], __( 'Imported content', 'gusy-ai-builder' ) ),
				'body'     => $content_items[0]['body'],
				'cta'      => array(
					'label'          => '',
					'url'            => '#content',
					'secondaryLabel' => '',
					'secondaryUrl'   => '#content',
				),
				'items'    => $content_items,
				'settings' => array(
					'background'  => 'plain',
					'spacing'     => 'lg',
					'columns'     => min( 3, max( 1, count( $content_items ) ) ),
					'mobileStack' => true,
					'interactive' => false,
				),
				'notes'    => array(),
			);
		}

		$sections[] = array(
			'id'       => sanitize_key( 'gusy-migrated-cta-' . $post->ID ),
			'type'     => 'cta',
			'variant'  => 'source-action',
			'label'    => 'Action',
			'intent'   => 'Preserve the source call to action.',
			'kicker'   => $source,
			'title'    => $primary_action,
			'body'     => $this->smart_excerpt( $body, 150 ),
			'cta'      => array(
				'label'          => $primary_action,
				'url'            => '#contact',
				'secondaryLabel' => $secondary_action,
				'secondaryUrl'   => '#content',
			),
			'items'    => array(),
			'settings' => array(
				'background'  => 'brand',
				'spacing'     => 'lg',
				'columns'     => 1,
				'mobileStack' => true,
				'interactive' => false,
			),
			'notes'    => array(),
		);

		$sections[] = array(
			'id'       => sanitize_key( 'gusy-migrated-faq-' . $post->ID ),
			'type'     => 'faq',
			'variant'  => 'migration-review',
			'label'    => 'FAQ',
			'intent'   => 'Expose migration assumptions for quick editing.',
			'kicker'   => __( 'Before publishing', 'gusy-ai-builder' ),
			'title'    => __( 'Check these details.', 'gusy-ai-builder' ),
			'body'     => '',
			'cta'      => array(
				'label'          => '',
				'url'            => '#contact',
				'secondaryLabel' => '',
				'secondaryUrl'   => '#content',
			),
			'items'    => $this->migration_faq_items( $title, $body, $primary_action, $content_items ),
			'settings' => array(
				'background'  => 'muted',
				'spacing'     => 'lg',
				'columns'     => 2,
				'mobileStack' => true,
				'interactive' => true,
			),
			'notes'    => array(),
		);

		$sections[] = array(
			'id'       => sanitize_key( 'gusy-migrated-form-' . $post->ID ),
			'type'     => 'form',
			'variant'  => 'source-contact',
			'label'    => 'Contact',
			'intent'   => 'Give the converted page a working lead path.',
			'kicker'   => __( 'Contact', 'gusy-ai-builder' ),
			'title'    => $primary_action,
			'body'     => __( 'Send a request from this page and keep the original context attached.', 'gusy-ai-builder' ),
			'cta'      => array(
				'label'          => $primary_action,
				'url'            => '#contact',
				'secondaryLabel' => '',
				'secondaryUrl'   => '#content',
			),
			'items'    => array(),
			'settings' => array(
				'background'  => 'plain',
				'spacing'     => 'lg',
				'columns'     => 2,
				'mobileStack' => true,
				'interactive' => true,
			),
			'notes'    => array(),
		);

		return array(
			'schemaVersion' => '1.0',
			'page'          => array(
				'title'        => 'Gusy - ' . $title,
				'slug'         => sanitize_title( $title . '-gusy' ),
				'language'     => 'en',
				'seo'          => array(
					'metaTitle'       => $title,
					'metaDescription' => $this->smart_excerpt( $body, 155 ),
				),
				'designSystem' => $tokens,
				'sections'     => $sections,
			),
		);
	}

	/**
	 * Choose the main body text from imported content.
	 *
	 * @param WP_Post           $post Source post.
	 * @param array<int,string> $texts Texts.
	 * @param string            $title Title.
	 * @return string
	 */
	private function migration_body_text( WP_Post $post, array $texts, string $title ): string {
		foreach ( $texts as $text ) {
			if ( strtolower( $text ) !== strtolower( $title ) && strlen( $text ) > 20 ) {
				return $this->smart_excerpt( $text, 190 );
			}
		}

		$source = $post->post_excerpt ?: $post->post_content;
		$body   = $this->smart_excerpt( $source, 190 );

		return '' !== $body ? $body : $title;
	}

	/**
	 * Convert imported text fragments into editable section items.
	 *
	 * @param array<int,string> $texts Texts.
	 * @return array<int,array<string,string>>
	 */
	private function migration_items( array $texts ): array {
		$items = array();
		$texts = array_slice( array_values( $texts ), 0, 8 );

		for ( $index = 0; $index < count( $texts ); $index += 2 ) {
			$title = $this->title_from_text( $texts[ $index ], sprintf( 'Content %d', (int) ( $index / 2 ) + 1 ) );
			$body  = isset( $texts[ $index + 1 ] ) ? $texts[ $index + 1 ] : $texts[ $index ];

			$items[] = array(
				'label' => sprintf( '%02d', count( $items ) + 1 ),
				'title' => $title,
				'body'  => $this->smart_excerpt( $body, 170 ),
			);
		}

		return $items;
	}

	/**
	 * Prefer the first imported Elementor heading over a generic WordPress page title.
	 *
	 * @param string            $source_title Source title.
	 * @param array<int,string> $texts Imported texts.
	 * @param bool              $has_elementor Whether the source is Elementor.
	 * @return string
	 */
	private function migration_title( string $source_title, array $texts, bool $has_elementor ): string {
		if ( $has_elementor && ! empty( $texts[0] ) ) {
			$first = $this->title_from_text( (string) $texts[0], $source_title );
			if ( '' !== $first ) {
				return $first;
			}
		}

		return $source_title;
	}

	/**
	 * Extract likely button labels from imported text.
	 *
	 * @param array<int,string> $texts Imported texts.
	 * @return array<int,string>
	 */
	private function migration_action_labels( array $texts ): array {
		$actions = array();
		foreach ( $texts as $text ) {
			$text = $this->title_from_text( (string) $text, '' );
			if ( '' === $text || strlen( $text ) > 42 ) {
				continue;
			}

			if ( 1 !== preg_match( '/\b(book|reserve|contact|call|buy|order|start|get|read|learn|download|join|sign|try|request)\b/i', $text ) ) {
				continue;
			}

			$actions[] = $text;
		}

		$actions = array_values( array_unique( $actions ) );
		if ( empty( $actions ) ) {
			$actions[] = __( 'Contact us', 'gusy-ai-builder' );
		}

		if ( 1 === count( $actions ) ) {
			$actions[] = __( 'Read more', 'gusy-ai-builder' );
		}

		return array_slice( $actions, 0, 2 );
	}

	/**
	 * Build factual review questions from the migrated source.
	 *
	 * @param string                         $title Page title.
	 * @param string                         $body Body copy.
	 * @param string                         $primary_action Primary CTA.
	 * @param array<int,array<string,mixed>> $content_items Content items.
	 * @return array<int,array<string,string>>
	 */
	private function migration_faq_items( string $title, string $body, string $primary_action, array $content_items ): array {
		$first_item = $content_items[0] ?? array();
		$detail_title = isset( $first_item['title'] ) ? (string) $first_item['title'] : $title;
		$detail_body  = isset( $first_item['body'] ) ? (string) $first_item['body'] : $body;

		return array(
			array(
				'label' => '01',
				'title' => sprintf( __( 'Is "%s" the right page title?', 'gusy-ai-builder' ), $title ),
				'body'  => __( 'Edit the hero title if the original Elementor page used a placeholder or campaign headline.', 'gusy-ai-builder' ),
			),
			array(
				'label' => '02',
				'title' => sprintf( __( 'Should "%s" be the main action?', 'gusy-ai-builder' ), $primary_action ),
				'body'  => __( 'Connect this button to the final booking, contact or checkout destination.', 'gusy-ai-builder' ),
			),
			array(
				'label' => '03',
				'title' => $this->title_from_text( $detail_title, __( 'Imported detail', 'gusy-ai-builder' ) ),
				'body'  => $this->smart_excerpt( $detail_body, 150 ),
			),
		);
	}

	/**
	 * Load and sanitize a stored page blueprint.
	 *
	 * @param int $post_id Post ID.
	 * @return array<string,mixed>|null
	 */
	private function blueprint_from_post( int $post_id ): ?array {
		$blueprint = get_post_meta( $post_id, '_gusy_ai_blueprint', true );
		if ( ! is_array( $blueprint ) ) {
			return null;
		}

		return $this->sanitize_blueprint( $blueprint );
	}

	/**
	 * Build a richer product audit for the editor.
	 *
	 * @param array<string,mixed> $blueprint Blueprint.
	 * @return array<string,mixed>
	 */
	private function build_audit( array $blueprint ): array {
		$page     = isset( $blueprint['page'] ) && is_array( $blueprint['page'] ) ? $blueprint['page'] : array();
		$sections = isset( $page['sections'] ) && is_array( $page['sections'] ) ? $page['sections'] : array();
		$base     = $this->generator->audit_blueprint( $sections );
		$types    = array_map(
			static function ( $section ) {
				return is_array( $section ) ? (string) ( $section['type'] ?? '' ) : '';
			},
			$sections
		);

		$issues = array();
		if ( count( $sections ) < 5 ) {
			$issues[] = 'Add at least five sections before publishing a complete landing page.';
		}
		if ( empty( $page['seo']['metaTitle'] ) || empty( $page['seo']['metaDescription'] ) ) {
			$issues[] = 'Complete the SEO title and description.';
		}
		if ( ! in_array( 'faq', $types, true ) ) {
			$issues[] = 'Add an FAQ to address objections.';
		}
		if ( ! in_array( 'form', $types, true ) && ! in_array( 'audit', $types, true ) ) {
			$issues[] = 'Add a lead capture section.';
		}

		return array(
			'summary'      => $base,
			'issues'       => $issues,
			'sectionCount' => count( $sections ),
			'types'        => array_values( array_filter( array_unique( $types ) ) ),
			'score'        => max( 58, min( 98, 70 + ( count( $sections ) * 3 ) - ( count( $issues ) * 6 ) ) ),
		);
	}

	/**
	 * Extract meaningful texts from Elementor JSON.
	 *
	 * @param string $json Elementor JSON.
	 * @return array<int,string>
	 */
	private function extract_elementor_texts( string $json ): array {
		$decoded = json_decode( $json, true );
		if ( ! is_array( $decoded ) ) {
			return array();
		}

		$texts = array();
		$this->walk_elementor_nodes( $decoded, $texts );

		return array_values( array_unique( array_filter( $texts ) ) );
	}

	/**
	 * Extract image references from Elementor JSON.
	 *
	 * @param string $json Elementor JSON.
	 * @return array<int,array<string,mixed>>
	 */
	private function extract_elementor_images( string $json ): array {
		$decoded = json_decode( $json, true );
		if ( ! is_array( $decoded ) ) {
			return array();
		}

		$images = array();
		$this->walk_elementor_images( $decoded, $images );

		return array_values( $images );
	}

	/**
	 * Walk Elementor nodes recursively and collect image objects.
	 *
	 * @param mixed                         $node Node.
	 * @param array<string,array<string,mixed>> $images Images indexed by URL.
	 */
	private function walk_elementor_images( $node, array &$images ): void {
		if ( ! is_array( $node ) ) {
			return;
		}

		if ( isset( $node['url'] ) && is_string( $node['url'] ) && $this->is_elementor_image_url( $node['url'] ) ) {
			$url = esc_url_raw( (string) $node['url'] );
			if ( '' !== $url && ! isset( $images[ $url ] ) ) {
				$images[ $url ] = array(
					'id'    => absint( $node['id'] ?? 0 ),
					'url'   => $url,
					'alt'   => sanitize_text_field( (string) ( $node['alt'] ?? '' ) ),
					'title' => sanitize_text_field( (string) ( $node['title'] ?? '' ) ),
				);
			}
		}

		foreach ( $node as $value ) {
			$this->walk_elementor_images( $value, $images );
		}
	}

	/**
	 * Check whether a URL looks like a real image reference from Elementor.
	 *
	 * @param string $url URL.
	 * @return bool
	 */
	private function is_elementor_image_url( string $url ): bool {
		$url = trim( $url );
		if ( '' === $url ) {
			return false;
		}

		return 1 === preg_match( '/\.(?:jpe?g|png|webp|gif|avif)(?:\?.*)?$/i', $url );
	}

	/**
	 * Walk Elementor nodes recursively.
	 *
	 * @param mixed             $node Node.
	 * @param array<int,string> $texts Texts.
	 */
	private function walk_elementor_nodes( $node, array &$texts ): void {
		if ( is_array( $node ) ) {
			foreach ( $node as $key => $value ) {
				if ( is_string( $value ) && in_array( (string) $key, array( 'title', 'editor', 'text', 'description', 'button_text', 'heading' ), true ) ) {
					$text = trim( wp_strip_all_tags( $value ) );
					if ( strlen( $text ) > 2 ) {
						$texts[] = sanitize_text_field( $text );
					}
				}
				$this->walk_elementor_nodes( $value, $texts );
			}
		}
	}

	/**
	 * Count Elementor widgets in the stored JSON.
	 *
	 * @param string $json Elementor JSON.
	 * @return int
	 */
	private function count_elementor_widgets( string $json ): int {
		$decoded = json_decode( $json, true );
		if ( ! is_array( $decoded ) ) {
			return 0;
		}

		$count = 0;
		$this->walk_elementor_widget_count( $decoded, $count );

		return $count;
	}

	/**
	 * Walk Elementor JSON and count widget nodes.
	 *
	 * @param mixed $node Node.
	 * @param int   $count Count.
	 */
	private function walk_elementor_widget_count( $node, int &$count ): void {
		if ( ! is_array( $node ) ) {
			return;
		}

		if ( isset( $node['widgetType'] ) || ( isset( $node['elType'] ) && 'widget' === $node['elType'] ) ) {
			$count++;
		}

		foreach ( $node as $value ) {
			$this->walk_elementor_widget_count( $value, $count );
		}
	}

	/**
	 * Extract readable lines from post content.
	 *
	 * @param string $content Content.
	 * @return array<int,string>
	 */
	private function extract_plain_texts( string $content ): array {
		$content = wp_strip_all_tags( $content );
		$parts   = preg_split( '/[\r\n.]+/', $content ) ?: array();
		$texts   = array();

		foreach ( $parts as $part ) {
			$text = trim( preg_replace( '/\s+/', ' ', (string) $part ) );
			if ( strlen( $text ) > 10 ) {
				$texts[] = sanitize_text_field( $text );
			}
		}

		return array_slice( array_values( array_unique( $texts ) ), 0, 24 );
	}

	/**
	 * Create a title from imported or prompted text.
	 *
	 * @param string $text Text.
	 * @param string $fallback Fallback.
	 * @return string
	 */
	private function title_from_text( string $text, string $fallback ): string {
		$text = trim( wp_strip_all_tags( $text ) );
		if ( '' === $text ) {
			return $fallback;
		}

		if ( strlen( $text ) <= 82 ) {
			return sanitize_text_field( $text );
		}

		return $this->smart_excerpt( $text, 82 );
	}

	/**
	 * Trim text at a readable word boundary.
	 *
	 * @param string $text Text.
	 * @param int    $limit Character limit.
	 * @return string
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
	 * Sanitize a blueprint received from the editor.
	 *
	 * @param array<string,mixed> $blueprint Raw blueprint.
	 * @return array<string,mixed>|null
	 */
	private function sanitize_blueprint( array $blueprint ): ?array {
		if ( ! isset( $blueprint['page'] ) || ! is_array( $blueprint['page'] ) ) {
			return null;
		}

		$page     = $blueprint['page'];
		$sections = isset( $page['sections'] ) && is_array( $page['sections'] ) ? array_slice( $page['sections'], 0, self::MAX_SECTIONS ) : array();
		$tokens   = isset( $page['designSystem'] ) && is_array( $page['designSystem'] ) ? $page['designSystem'] : array();

		$clean_sections = array();
		foreach ( $sections as $section ) {
			if ( is_array( $section ) ) {
				$clean_sections[] = $this->sanitize_section( $section );
			}
		}

		return array(
			'schemaVersion' => '1.0',
			'page'          => array(
				'title'        => sanitize_text_field( (string) ( $page['title'] ?? 'Page Gusy' ) ),
				'slug'         => sanitize_title( (string) ( $page['slug'] ?? 'page-gusy' ) ),
				'language'     => $this->limit_text( sanitize_key( (string) ( $page['language'] ?? 'en' ) ), 12 ),
				'seo'          => array(
					'metaTitle'       => $this->limit_text( sanitize_text_field( (string) ( $page['seo']['metaTitle'] ?? '' ) ), 180 ),
					'metaDescription' => $this->limit_text( sanitize_textarea_field( (string) ( $page['seo']['metaDescription'] ?? '' ) ), 320 ),
					'schemaJsonLd'    => isset( $page['seo']['schemaJsonLd'] ) && is_array( $page['seo']['schemaJsonLd'] ) ? $this->sanitize_schema_json_ld( $page['seo']['schemaJsonLd'] ) : array(),
				),
				'designSystem' => $this->tokens->normalize_tokens( $tokens ),
				'sections'     => $clean_sections,
			),
		);
	}

	/**
	 * Sanitize a section received from the editor.
	 *
	 * @param array<string,mixed> $section Raw section.
	 * @return array<string,mixed>
	 */
	private function sanitize_section( array $section ): array {
		$items = array();
		if ( isset( $section['items'] ) && is_array( $section['items'] ) ) {
			foreach ( array_slice( $section['items'], 0, self::MAX_ITEMS_PER_SECTION ) as $item ) {
				if ( is_array( $item ) ) {
					$image = array();
					if ( isset( $item['image'] ) && is_array( $item['image'] ) ) {
						$image_url = esc_url_raw( (string) ( $item['image']['url'] ?? '' ) );
						if ( '' !== $image_url ) {
							$image = array(
								'id'    => absint( $item['image']['id'] ?? 0 ),
								'url'   => $image_url,
								'alt'   => sanitize_text_field( (string) ( $item['image']['alt'] ?? '' ) ),
								'title' => sanitize_text_field( (string) ( $item['image']['title'] ?? '' ) ),
							);
						}
					}

					$items[] = array(
						'title' => $this->limit_text( sanitize_text_field( (string) ( $item['title'] ?? '' ) ), self::MAX_TEXT_CHARS ),
						'body'  => $this->limit_text( sanitize_textarea_field( (string) ( $item['body'] ?? '' ) ), self::MAX_TEXTAREA_CHARS ),
						'label' => $this->limit_text( sanitize_text_field( (string) ( $item['label'] ?? '' ) ), self::MAX_TEXT_CHARS ),
						'image' => $image,
					);
				}
			}
		}

		$notes = array();
		if ( isset( $section['notes'] ) && is_array( $section['notes'] ) ) {
			foreach ( array_slice( $section['notes'], 0, self::MAX_NOTES_PER_SECTION ) as $note ) {
				$note = sanitize_text_field( (string) $note );
				if ( '' !== $note ) {
					$notes[] = $note;
				}
			}
		}

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

		$motion_entrance = sanitize_key( (string) ( $section['settings']['motionEntrance'] ?? 'fade-up' ) );
		if ( ! in_array( $motion_entrance, array( 'fade-up', 'scale-in', 'slide-in' ), true ) ) {
			$motion_entrance = 'fade-up';
		}
		$columns = max( 1, min( 4, absint( $section['settings']['columns'] ?? 3 ) ) );
		$tablet_columns = max( 1, min( 3, absint( $section['settings']['tabletColumns'] ?? min( $columns, 2 ) ) ) );
		$mobile_columns = max( 1, min( 2, absint( $section['settings']['mobileColumns'] ?? 1 ) ) );
		$text_align = sanitize_key( (string) ( $section['settings']['textAlign'] ?? 'left' ) );
		$heading_scale = sanitize_key( (string) ( $section['settings']['headingScale'] ?? 'standard' ) );
		$text_width = sanitize_key( (string) ( $section['settings']['textWidth'] ?? 'standard' ) );
		$body_scale = sanitize_key( (string) ( $section['settings']['bodyScale'] ?? 'standard' ) );
		$button_style = sanitize_key( (string) ( $section['settings']['buttonStyle'] ?? 'solid' ) );
		$button_size = sanitize_key( (string) ( $section['settings']['buttonSize'] ?? 'md' ) );
		$button_shape = sanitize_key( (string) ( $section['settings']['buttonShape'] ?? 'pill' ) );
		$image_aspect = sanitize_key( (string) ( $section['settings']['imageAspect'] ?? 'landscape' ) );
		$image_position = sanitize_key( (string) ( $section['settings']['imagePosition'] ?? 'center' ) );
		$image_shape = sanitize_key( (string) ( $section['settings']['imageShape'] ?? 'rounded' ) );
		$video_mode = sanitize_key( (string) ( $section['settings']['videoMode'] ?? 'inline' ) );
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
			'id'       => sanitize_key( (string) ( $section['id'] ?? wp_unique_id( 'gusy-section-' ) ) ),
			'type'     => sanitize_key( (string) ( $section['type'] ?? 'section' ) ),
			'variant'  => sanitize_key( (string) ( $section['variant'] ?? 'default' ) ),
			'label'    => $this->limit_text( sanitize_text_field( (string) ( $section['label'] ?? 'Section' ) ), self::MAX_TEXT_CHARS ),
			'intent'   => $this->limit_text( sanitize_text_field( (string) ( $section['intent'] ?? '' ) ), self::MAX_TEXT_CHARS ),
			'kicker'   => $this->limit_text( sanitize_text_field( (string) ( $section['kicker'] ?? '' ) ), self::MAX_TEXT_CHARS ),
			'title'    => $this->limit_text( sanitize_text_field( (string) ( $section['title'] ?? '' ) ), self::MAX_TEXT_CHARS ),
			'body'     => $this->limit_text( sanitize_textarea_field( (string) ( $section['body'] ?? '' ) ), self::MAX_TEXTAREA_CHARS ),
			'cta'      => array(
				'label'          => $this->limit_text( sanitize_text_field( (string) ( $section['cta']['label'] ?? '' ) ), self::MAX_TEXT_CHARS ),
				'url'            => esc_url_raw( (string) ( $section['cta']['url'] ?? '#contact' ) ),
				'secondaryLabel' => $this->limit_text( sanitize_text_field( (string) ( $section['cta']['secondaryLabel'] ?? '' ) ), self::MAX_TEXT_CHARS ),
				'secondaryUrl'   => esc_url_raw( (string) ( $section['cta']['secondaryUrl'] ?? '#proof' ) ),
			),
			'items'    => $items,
			'settings' => array(
				'background'  => sanitize_key( (string) ( $section['settings']['background'] ?? 'plain' ) ),
				'spacing'     => sanitize_key( (string) ( $section['settings']['spacing'] ?? 'lg' ) ),
				'columns'     => $columns,
				'tabletColumns' => $tablet_columns,
				'mobileColumns' => $mobile_columns,
				'accent'      => sanitize_key( (string) ( $section['settings']['accent'] ?? 'accent' ) ),
				'width'       => sanitize_key( (string) ( $section['settings']['width'] ?? 'wide' ) ),
				'textAlign'   => $text_align,
				'headingScale' => $heading_scale,
				'textWidth' => $text_width,
				'bodyScale' => $body_scale,
				'buttonStyle' => $button_style,
				'buttonSize'  => $button_size,
				'buttonShape' => $button_shape,
				'imageAspect' => $image_aspect,
				'imagePosition' => $image_position,
				'imageShape' => $image_shape,
				'backgroundImage' => $background_image,
				'backgroundVideo' => $background_video,
				'videoMode' => $video_mode,
				'mobileStack' => (bool) ( $section['settings']['mobileStack'] ?? true ),
				'interactive' => (bool) ( $section['settings']['interactive'] ?? false ),
				'motionEnabled' => (bool) ( $section['settings']['motionEnabled'] ?? false ),
				'motionEntrance' => $motion_entrance,
				'motionDuration' => max( 100, min( 1200, absint( $section['settings']['motionDuration'] ?? 600 ) ) ),
			),
			'notes'    => $notes,
		);
	}

	/**
	 * Sanitize JSON-LD data.
	 *
	 * @param array<string,mixed> $schema Raw schema.
	 * @return array<string,mixed>
	 */
	private function sanitize_schema_json_ld( array $schema ): array {
		$encoded = wp_json_encode( $schema );
		if ( ! is_string( $encoded ) ) {
			return array();
		}
		if ( strlen( $encoded ) > self::MAX_SCHEMA_BYTES ) {
			return array();
		}

		$decoded = json_decode( $encoded, true );
		if ( ! is_array( $decoded ) ) {
			return array();
		}

		$clean = $this->sanitize_schema_value( $decoded );
		return is_array( $clean ) ? $clean : array();
	}

	/**
	 * Recursively sanitize JSON-LD primitives while bounding depth and fan-out.
	 *
	 * @param mixed $value Schema value.
	 * @param int   $depth Current depth.
	 * @return mixed
	 */
	private function sanitize_schema_value( $value, int $depth = 0 ) {
		if ( $depth > 6 ) {
			return null;
		}

		if ( is_array( $value ) ) {
			$clean = array();
			$count = 0;
			foreach ( $value as $key => $item ) {
				if ( $count >= 40 ) {
					break;
				}
				$clean_key = is_int( $key ) ? $key : $this->limit_text( preg_replace( '/[^A-Za-z0-9_@:#.\-]/', '', (string) $key ) ?: '', 80 );
				if ( '' === $clean_key && ! is_int( $key ) ) {
					continue;
				}
				$clean[ $clean_key ] = $this->sanitize_schema_value( $item, $depth + 1 );
				$count++;
			}

			return $clean;
		}

		if ( is_string( $value ) ) {
			return $this->limit_text( sanitize_text_field( $value ), 500 );
		}

		if ( is_bool( $value ) || is_int( $value ) || is_float( $value ) || null === $value ) {
			return $value;
		}

		return null;
	}
}
