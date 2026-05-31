<?php
/**
 * Plugin Name: Gusy AI Builder
 * Plugin URI: https://example.com/gusy-ai-builder
 * Description: AI-first WordPress builder for creating, editing and publishing premium landing pages with clean blocks.
 * Version: 0.2.0
 * Requires at least: 6.4
 * Requires PHP: 8.1
 * Author: Gusy
 * Text Domain: gusy-ai-builder
 * Domain Path: /languages
 *
 * @package Gusy_AI_Builder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GUSY_AI_BUILDER_VERSION', '0.2.0' );
define( 'GUSY_AI_BUILDER_FILE', __FILE__ );
define( 'GUSY_AI_BUILDER_PATH', plugin_dir_path( __FILE__ ) );
define( 'GUSY_AI_BUILDER_URL', plugin_dir_url( __FILE__ ) );

require_once GUSY_AI_BUILDER_PATH . 'includes/class-gusy-design-token-service.php';
require_once GUSY_AI_BUILDER_PATH . 'includes/class-gusy-feature-manager.php';
require_once GUSY_AI_BUILDER_PATH . 'includes/class-gusy-template-repository.php';
require_once GUSY_AI_BUILDER_PATH . 'includes/class-gusy-llm-gateway.php';
require_once GUSY_AI_BUILDER_PATH . 'includes/class-gusy-product-agent.php';
require_once GUSY_AI_BUILDER_PATH . 'includes/class-gusy-page-generator.php';
require_once GUSY_AI_BUILDER_PATH . 'includes/class-gusy-block-serializer.php';
require_once GUSY_AI_BUILDER_PATH . 'includes/class-gusy-rest-controller.php';
require_once GUSY_AI_BUILDER_PATH . 'includes/class-gusy-plugin.php';

register_activation_hook( __FILE__, array( 'Gusy_AI_Builder_Plugin', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Gusy_AI_Builder_Plugin', 'deactivate' ) );

add_action( 'plugins_loaded', array( 'Gusy_AI_Builder_Plugin', 'boot' ) );
