<?php
/**
 * WooCommerce template shell.
 *
 * @package Gusy_Base
 */

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'gusy-commerce-body' ); ?>>
<?php wp_body_open(); ?>
<div class="wp-site-blocks gusy-commerce-template">
	<?php echo do_blocks( '<!-- wp:template-part {"slug":"header","tagName":"header"} /-->' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	<main class="gusy-system-main gusy-commerce-main">
		<section class="gusy-commerce-intro">
			<div>
				<h1><?php echo esc_html__( 'Products ready to browse.', 'gusy-base' ); ?></h1>
			</div>
			<div class="gusy-system-visuals" aria-label="<?php echo esc_attr__( 'Shop images', 'gusy-base' ); ?>">
				<img src="<?php echo esc_url( function_exists( 'gusy_base_image_url' ) ? gusy_base_image_url( 'boutique-luxe-offer.jpg' ) : get_theme_file_uri( 'assets/images/themes/boutique-luxe-offer.jpg' ) ); ?>" alt="">
				<img src="<?php echo esc_url( function_exists( 'gusy_base_image_url' ) ? gusy_base_image_url( 'marche-local-offer.jpg' ) : get_theme_file_uri( 'assets/images/themes/marche-local-offer.jpg' ) ); ?>" alt="">
				<img src="<?php echo esc_url( function_exists( 'gusy_base_image_url' ) ? gusy_base_image_url( 'atelier-artisan-detail.jpg' ) : get_theme_file_uri( 'assets/images/themes/atelier-artisan-detail.jpg' ) ); ?>" alt="">
			</div>
		</section>
		<section class="gusy-commerce-shell">
			<?php
			if ( function_exists( 'woocommerce_breadcrumb' ) ) {
				woocommerce_breadcrumb();
			}

			if ( function_exists( 'woocommerce_content' ) ) {
				woocommerce_content();
			} else {
				echo '<h1>' . esc_html__( 'Shop', 'gusy-base' ) . '</h1>';
				echo '<p>' . esc_html__( 'WooCommerce is not active.', 'gusy-base' ) . '</p>';
			}
			?>
		</section>
	</main>
	<?php echo do_blocks( '<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
</div>
<?php wp_footer(); ?>
</body>
</html>
