<?php
/**
 * Local visual preview for the Gusy Base theme.
 *
 * This file is only a standalone preview helper. WordPress does not need it.
 *
 * @package Gusy_Base
 */

define( 'ABSPATH', __DIR__ );

if ( ! function_exists( 'add_action' ) ) {
	function add_action( $hook, $callback, $priority = 10, $accepted_args = 1 ): void {}
	function add_theme_support( $feature ): void {}
	function add_editor_style( $stylesheet ): void {}
	function wp_enqueue_style( $handle, $src = '', $deps = array(), $ver = false, $media = 'all' ): void {}
	function get_stylesheet_uri(): string {
		return 'style.css';
	}
	function wp_get_theme(): object {
		return new class() {
			public function get( string $key ): string {
				return '1.0.0';
			}
		};
	}
	function __( string $text, string $domain = 'default' ): string {
		return $text;
	}
	function esc_html__( string $text, string $domain = 'default' ): string {
		return htmlspecialchars( $text, ENT_QUOTES, 'UTF-8' );
	}
	function esc_attr__( string $text, string $domain = 'default' ): string {
		return htmlspecialchars( $text, ENT_QUOTES, 'UTF-8' );
	}
	function esc_html( $text ): string {
		return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
	}
	function esc_attr( $text ): string {
		return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
	}
	function esc_url( $text ): string {
		return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
	}
	function sanitize_html_class( $class ): string {
		return preg_replace( '/[^A-Za-z0-9_-]/', '', (string) $class );
	}
}

require __DIR__ . '/functions.php';

$templates = gusy_base_template_catalog();
?>
<!doctype html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Gusy Base Preview</title>
	<link rel="stylesheet" href="style.css">
	<style>
		body {
			margin: 0;
		}

		.gusy-preview-toolbar {
			position: sticky;
			z-index: 10;
			top: 0;
			display: flex;
			align-items: center;
			gap: 12px;
			overflow-x: auto;
			border-bottom: 1px solid rgba(29, 23, 20, .12);
			background: rgba(251, 247, 239, .92);
			backdrop-filter: blur(16px);
			padding: 12px;
		}

		.gusy-preview-toolbar strong {
			flex: 0 0 auto;
			font-family: Georgia, "Times New Roman", serif;
			font-size: 22px;
			font-weight: 500;
		}

		.gusy-preview-toolbar button {
			flex: 0 0 auto;
			min-height: 38px;
			border: 1px solid rgba(29, 23, 20, .16);
			border-radius: 999px;
			background: #fffaf2;
			color: #1d1714;
			cursor: pointer;
			font: 700 13px/1 Inter, ui-sans-serif, system-ui, sans-serif;
			padding: 0 14px;
		}

		.gusy-preview-toolbar button[aria-pressed="true"] {
			background: #1d1714;
			color: #fff;
		}

		.gusy-preview-panel {
			display: none;
		}

		.gusy-preview-panel.is-active {
			display: block;
		}
	</style>
</head>
<body>
	<nav class="gusy-preview-toolbar" aria-label="Choisir un template">
		<strong>Gusy</strong>
		<?php foreach ( $templates as $index => $template ) : ?>
			<button type="button" data-preview-target="<?php echo esc_attr( $template['slug'] ); ?>" aria-pressed="<?php echo 0 === $index ? 'true' : 'false'; ?>">
				<?php echo esc_html( $template['name'] ); ?>
			</button>
		<?php endforeach; ?>
	</nav>

	<?php foreach ( $templates as $index => $template ) : ?>
		<section id="<?php echo esc_attr( $template['slug'] ); ?>" class="gusy-preview-panel<?php echo 0 === $index ? ' is-active' : ''; ?>">
			<?php echo gusy_base_render_template_pattern( $template ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		</section>
	<?php endforeach; ?>

	<script>
		const buttons = [...document.querySelectorAll('[data-preview-target]')];
		const panels = [...document.querySelectorAll('.gusy-preview-panel')];

		for (const button of buttons) {
			button.addEventListener('click', () => {
				for (const item of buttons) item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
				for (const panel of panels) panel.classList.toggle('is-active', panel.id === button.dataset.previewTarget);
				window.scrollTo({ top: 0, behavior: 'smooth' });
			});
		}
	</script>
</body>
</html>
