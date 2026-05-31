<?php
/**
 * Create local WordPress preview pages for the Gusy Base templates.
 *
 * Run with: wp eval-file tools-create-preview-pages.php
 *
 * @package Gusy_Base
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	fwrite( STDERR, "This preview generator can only run through WP-CLI.\n" );
	exit( 1 );
}

if (
	! function_exists( 'gusy_base_template_catalog' )
	|| ! function_exists( 'gusy_base_render_template_pattern' )
	|| ! function_exists( 'gusy_base_template_blueprint' )
	|| ! function_exists( 'gusy_base_secondary_pages' )
	|| ! function_exists( 'gusy_base_render_secondary_page' )
	|| ! function_exists( 'gusy_base_secondary_page_blueprint' )
	|| ! function_exists( 'gusy_base_template_page_slug' )
) {
	fwrite( STDERR, "Gusy Base theme functions are not loaded.\n" );
	exit( 1 );
}

$locale_groups = array(
	'en' => array(
		'prefix'  => 'Gusy',
		'heading' => 'English base themes',
	),
	'fr' => array(
		'prefix'  => 'Gusy FR',
		'heading' => 'Versions françaises',
	),
);

$created_by_locale = array();

foreach ( $locale_groups as $locale => $group ) {
	$created_by_locale[ $locale ] = array();

	foreach ( gusy_base_template_catalog( $locale ) as $template ) {
		$slug    = gusy_base_template_page_slug( $template );
		$content = gusy_base_render_template_pattern( $template );
		$page    = get_page_by_path( $slug, OBJECT, 'page' );
		$title   = $group['prefix'] . ' - ' . $template['name'];
		$args    = array(
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_content' => $content,
		);

		if ( $page instanceof WP_Post ) {
			$args['ID'] = $page->ID;
			$page_id    = wp_update_post( wp_slash( $args ), true );
		} else {
			$page_id = wp_insert_post( wp_slash( $args ), true );
		}

		if ( is_wp_error( $page_id ) ) {
			fwrite( STDERR, $page_id->get_error_message() . "\n" );
			exit( 1 );
		}

		update_post_meta( $page_id, '_wp_page_template', 'page-gusy-fullscreen.php' );
		update_post_meta( $page_id, '_gusy_base_template_slug', $template['slug'] );
		update_post_meta( $page_id, '_gusy_base_template_language', $locale );
		update_post_meta( $page_id, '_gusy_edit_with_gusy', '1' );
		update_post_meta( $page_id, '_gusy_ai_blueprint', gusy_base_template_blueprint( $template ) );
		update_post_meta( $page_id, '_gusy_design_tokens', gusy_base_template_design_tokens( $template ) );
		update_post_meta(
			$page_id,
			'_gusy_seo',
			array(
				'metaTitle'       => $template['brand'] . ' - ' . $template['name'],
				'metaDescription' => $template['body'],
			)
		);

		$created_by_locale[ $locale ][] = array(
			'title' => $title,
			'url'   => get_permalink( $page_id ),
		);

		foreach ( gusy_base_secondary_pages( $template ) as $secondary_page ) {
			$secondary_slug    = gusy_base_template_page_slug( $template, $secondary_page['slug_suffix'] );
			$secondary_content = gusy_base_render_secondary_page( $template, $secondary_page['type'] );
			$secondary         = get_page_by_path( $secondary_slug, OBJECT, 'page' );
			$secondary_title   = $group['prefix'] . ' - ' . $template['name'] . ' - ' . $secondary_page['menu_label'];
			$secondary_args    = array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_title'   => $secondary_title,
				'post_name'    => $secondary_slug,
				'post_content' => $secondary_content,
			);

			if ( $secondary instanceof WP_Post ) {
				$secondary_args['ID'] = $secondary->ID;
				$secondary_id         = wp_update_post( wp_slash( $secondary_args ), true );
			} else {
				$secondary_id = wp_insert_post( wp_slash( $secondary_args ), true );
			}

			if ( is_wp_error( $secondary_id ) ) {
				fwrite( STDERR, $secondary_id->get_error_message() . "\n" );
				exit( 1 );
			}

			update_post_meta( $secondary_id, '_wp_page_template', 'page-gusy-fullscreen.php' );
			update_post_meta( $secondary_id, '_gusy_base_template_slug', $template['slug'] );
			update_post_meta( $secondary_id, '_gusy_base_template_language', $locale );
			update_post_meta( $secondary_id, '_gusy_base_secondary_type', $secondary_page['type'] );
			update_post_meta( $secondary_id, '_gusy_edit_with_gusy', '1' );
			update_post_meta( $secondary_id, '_gusy_ai_blueprint', gusy_base_secondary_page_blueprint( $template, $secondary_page ) );
			update_post_meta( $secondary_id, '_gusy_design_tokens', gusy_base_template_design_tokens( $template ) );
			update_post_meta(
				$secondary_id,
				'_gusy_seo',
				array(
					'metaTitle'       => $secondary_page['title'] . ' - ' . $template['brand'],
					'metaDescription' => $secondary_page['metaDescription'],
				)
			);

			$created_by_locale[ $locale ][] = array(
				'title' => $secondary_title,
				'url'   => get_permalink( $secondary_id ),
			);
		}
	}
}

$links = '<div style="max-width:1120px;margin:60px auto;padding:0 20px;font-family:Inter,system-ui,sans-serif">'
	. '<h1 style="font-family:Georgia,serif;font-size:54px;font-weight:500;margin:0 0 12px">Gusy Base</h1>'
	. '<p style="margin:0 0 30px;color:#51615b;font-size:17px">English is the main theme language. French versions are generated separately.</p>';

foreach ( $locale_groups as $locale => $group ) {
	$links .= '<section style="margin:0 0 36px">'
		. '<h2 style="font-family:Georgia,serif;font-size:32px;font-weight:500;margin:0 0 14px">' . esc_html( $group['heading'] ) . '</h2>'
		. '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">';

	foreach ( $created_by_locale[ $locale ] as $page ) {
		$links .= '<a style="display:block;border:1px solid rgba(29,23,20,.16);border-radius:8px;padding:18px 20px;color:#1d1714;text-decoration:none;background:#fffaf2" href="'
			. esc_url( $page['url'] )
			. '">'
			. esc_html( $page['title'] )
			. '</a>';
	}

	$links .= '</div></section>';
}

$links .= '</div>';

$hub = get_page_by_path( 'gusy-themes', OBJECT, 'page' );
$hub_args = array(
	'post_type'    => 'page',
	'post_status'  => 'publish',
	'post_title'   => 'Gusy - Themes',
	'post_name'    => 'gusy-themes',
	'post_content' => $links,
);

if ( $hub instanceof WP_Post ) {
	$hub_args['ID'] = $hub->ID;
	$hub_id         = wp_update_post( wp_slash( $hub_args ), true );
} else {
	$hub_id = wp_insert_post( wp_slash( $hub_args ), true );
}

if ( is_wp_error( $hub_id ) ) {
	fwrite( STDERR, $hub_id->get_error_message() . "\n" );
	exit( 1 );
}

echo "Hub: " . get_permalink( $hub_id ) . "\n";
foreach ( $created_by_locale as $pages ) {
	foreach ( $pages as $page ) {
		echo $page['title'] . ': ' . $page['url'] . "\n";
	}
}
