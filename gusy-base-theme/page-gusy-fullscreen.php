<?php
/**
 * Template Name: Gusy Fullscreen
 * Template Post Type: page
 *
 * @package Gusy_Base
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'gusy-fullscreen-template' ); ?>>
<?php wp_body_open(); ?>
<main id="wp--skip-link--target" class="gusy-fullscreen-main">
	<?php
	while ( have_posts() ) :
		the_post();
		the_content();
	endwhile;
	?>
</main>
<?php wp_footer(); ?>
</body>
</html>
