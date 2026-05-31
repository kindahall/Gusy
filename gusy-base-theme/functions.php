<?php
/**
 * Gusy Base theme setup.
 *
 * @package Gusy_Base
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register theme supports.
 */
function gusy_base_setup(): void {
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'style.css' );
	register_nav_menus(
		array(
			'primary'      => __( 'Primary navigation', 'gusy-base' ),
			'gusy_primary' => __( 'Gusy theme navigation', 'gusy-base' ),
		)
	);
}
add_action( 'after_setup_theme', 'gusy_base_setup' );

/**
 * Load the public stylesheet with cache busting.
 */
function gusy_base_enqueue_styles(): void {
	wp_enqueue_style(
		'gusy-base-style',
		get_stylesheet_uri(),
		array(),
		wp_get_theme()->get( 'Version' )
	);
}
add_action( 'wp_enqueue_scripts', 'gusy_base_enqueue_styles' );

/**
 * Return global Gusy theme settings saved by the builder.
 *
 * @return array<string,string|bool>
 */
function gusy_base_theme_settings(): array {
	$defaults = array(
		'activeKit'       => '',
		'language'        => 'en',
		'styleVariation'  => 'editorial',
		'density'         => 'comfortable',
		'buttonStyle'     => 'solid',
		'imageTone'       => 'natural',
		'setHomeOnImport' => true,
	);
	$settings = get_option( 'gusy_theme_settings', array() );
	$settings = is_array( $settings ) ? array_merge( $defaults, $settings ) : $defaults;

	return array(
		'activeKit'       => sanitize_title( (string) $settings['activeKit'] ),
		'language'        => 'fr' === (string) $settings['language'] ? 'fr' : 'en',
		'styleVariation'  => sanitize_html_class( (string) $settings['styleVariation'] ),
		'density'         => sanitize_html_class( (string) $settings['density'] ),
		'buttonStyle'     => sanitize_html_class( (string) $settings['buttonStyle'] ),
		'imageTone'       => sanitize_html_class( (string) $settings['imageTone'] ),
		'setHomeOnImport' => (bool) $settings['setHomeOnImport'],
	);
}

/**
 * Add global Gusy setting classes to the front end.
 *
 * @param array<int,string> $classes Body classes.
 * @return array<int,string>
 */
function gusy_base_body_classes( array $classes ): array {
	$settings = gusy_base_theme_settings();

	$classes[] = 'gusy-style-' . $settings['styleVariation'];
	$classes[] = 'gusy-density-' . $settings['density'];
	$classes[] = 'gusy-buttons-' . $settings['buttonStyle'];
	$classes[] = 'gusy-images-' . $settings['imageTone'];

	if ( '' !== $settings['activeKit'] ) {
		$classes[] = 'gusy-active-kit-' . $settings['activeKit'];
	}

	return $classes;
}
add_filter( 'body_class', 'gusy_base_body_classes' );

/**
 * Image URL helper.
 *
 * @param string $file Image filename.
 * @return string
 */
function gusy_base_image_url( string $file ): string {
	$path = 'assets/images/themes/' . $file;

	if ( function_exists( 'get_theme_file_uri' ) ) {
		return get_theme_file_uri( $path );
	}

	return $path;
}

/**
 * Return the language used by a template.
 *
 * @param array<string,mixed> $template Template data.
 * @return string
 */
function gusy_base_template_language( array $template ): string {
	return 'fr' === (string) ( $template['language'] ?? '' ) ? 'fr' : 'en';
}

/**
 * Return a public page slug for one Gusy template.
 *
 * @param array<string,mixed> $template Template data.
 * @param string             $secondary Optional secondary page suffix.
 * @return string
 */
function gusy_base_template_page_slug( array $template, string $secondary = '' ): string {
	$slug = 'fr' === gusy_base_template_language( $template )
		? 'gusy-fr-' . sanitize_title( (string) $template['slug'] )
		: 'gusy-' . sanitize_title( (string) $template['slug'] );

	if ( '' !== $secondary ) {
		$slug .= '-' . sanitize_title( $secondary );
	}

	return $slug;
}

/**
 * Return a public page URL for one Gusy template.
 *
 * @param array<string,mixed> $template Template data.
 * @param string             $secondary Optional secondary page suffix.
 * @return string
 */
function gusy_base_template_page_url( array $template, string $secondary = '' ): string {
	return home_url( '/' . gusy_base_template_page_slug( $template, $secondary ) . '/' );
}

/**
 * Small language dictionary for reusable labels.
 *
 * @param string              $key Text key.
 * @param array<string,mixed> $template Template data.
 * @return string
 */
function gusy_base_text( string $key, array $template ): string {
	$en = array(
		'navHome'       => 'Home',
		'navOffers'     => 'Offers',
		'navWork'       => 'Work',
		'navAbout'      => 'About',
		'navContact'    => 'Contact',
		'navLabel'      => 'Site navigation',
		'footerLabel'   => 'Footer navigation',
		'backHome'      => 'Back home',
		'quickProof'    => 'Quick proof',
		'clientPath'    => 'Customer path',
		'reviews'       => 'Customer reviews',
		'reviewsTitle'  => 'What customers appreciate.',
		'usefulInfo'    => 'Useful information',
		'compareTitle'  => 'Compare the options.',
		'compareBody'   => 'Each offer shows what is included, the price or quote model, and the next step.',
		'methodTitle'   => 'A clear method.',
		'aboutReviews'  => 'Customer reviews.',
		'requestTitle'  => 'Send a request.',
		'name'          => 'Name',
		'email'         => 'Email',
		'need'          => 'Need',
		'send'          => 'Send',
		'directInfo'    => 'Direct information.',
		'imagesLabel'   => 'Business and offer images',
		'prepareTitle'  => 'Prepare your request.',
		'prepareBody'   => 'The expected information is visible before sending, for a more precise first exchange.',
		'yourRequest'   => 'Your request.',
		'rightTiming'   => 'The right timing.',
		'usefulDetails' => 'Useful details.',
		'address'       => 'Address',
		'hours'         => 'Hours',
		'phone'         => 'Phone',
		'local'         => 'Local',
		'opening'       => 'Opening',
		'call'          => 'Call',
			'reviewLabel'   => 'Review',
			'reviewBody'    => 'Three contextual customer reviews to reassure before contact.',
			'faqLabel'      => 'Questions',
			'faqTitle'      => 'Before taking action.',
			'faqBody'       => 'Answers to the questions customers usually check before contacting the business.',
			'faqTiming'     => 'How quickly can I get an answer?',
			'faqPrepare'    => 'What should I prepare?',
			'faqAdapt'      => 'Can the offer be adapted?',
		);
	$fr = array(
		'navHome'       => 'Accueil',
		'navOffers'     => 'Offres',
		'navWork'       => 'Réalisations',
		'navAbout'      => 'À propos',
		'navContact'    => 'Contact',
		'navLabel'      => 'Navigation du site',
		'footerLabel'   => 'Navigation de pied de page',
		'backHome'      => 'Retour accueil',
		'quickProof'    => 'Preuves rapides',
		'clientPath'    => 'Parcours client',
		'reviews'       => 'Avis clients',
		'reviewsTitle'  => 'Ce que les clients apprécient.',
		'usefulInfo'    => 'Informations utiles',
		'compareTitle'  => 'Comparer les options.',
		'compareBody'   => 'Chaque offre présente le contenu, le prix ou le mode de devis, puis mène directement au contact.',
		'methodTitle'   => 'Une méthode claire.',
		'aboutReviews'  => 'Avis clients.',
		'requestTitle'  => 'Envoyer une demande.',
		'name'          => 'Nom',
		'email'         => 'Email',
		'need'          => 'Besoin',
		'send'          => 'Envoyer',
		'directInfo'    => 'Informations directes.',
		'imagesLabel'   => 'Images du lieu et des offres',
		'prepareTitle'  => 'Préparer votre demande.',
		'prepareBody'   => 'Les informations attendues sont visibles avant l’envoi, pour un premier échange plus précis.',
		'yourRequest'   => 'Votre demande.',
		'rightTiming'   => 'Le bon délai.',
		'usefulDetails' => 'Les détails utiles.',
		'address'       => 'Adresse',
		'hours'         => 'Horaires',
		'phone'         => 'Téléphone',
		'local'         => 'Local',
		'opening'       => 'Ouverture',
		'call'          => 'Appel',
			'reviewLabel'   => 'Avis',
			'reviewBody'    => 'Trois avis clients contextualisés pour rassurer avant la prise de contact.',
			'faqLabel'      => 'Questions',
			'faqTitle'      => 'Avant de passer à l’action.',
			'faqBody'       => 'Les réponses aux questions que les clients vérifient avant de contacter l’entreprise.',
			'faqTiming'     => 'Sous quel délai puis-je avoir une réponse ?',
			'faqPrepare'    => 'Que faut-il préparer ?',
			'faqAdapt'      => 'L’offre peut-elle être adaptée ?',
		);
	$dict = 'fr' === gusy_base_template_language( $template ) ? $fr : $en;

	return $dict[ $key ] ?? $key;
}

/**
 * Return the secondary page suffix used by a given language.
 *
 * @param array<string,mixed> $template Template data.
 * @param string             $type Stable secondary page type.
 * @return string
 */
function gusy_base_secondary_slug_suffix( array $template, string $type ): string {
	$is_fr = 'fr' === gusy_base_template_language( $template );
	$map   = $is_fr
		? array( 'offers' => 'offres', 'work' => 'realisations', 'about' => 'a-propos', 'contact' => 'contact' )
		: array( 'offers' => 'offers', 'work' => 'work', 'about' => 'about', 'contact' => 'contact' );

	return $map[ $type ] ?? sanitize_title( $type );
}

/**
 * Return domain-specific labels for the portfolio/work page.
 *
 * @param array<string,mixed> $template Template data.
 * @return array<string,string>
 */
function gusy_base_template_work_copy( array $template ): array {
	$slug  = (string) ( $template['slug'] ?? '' );
	$is_fr = 'fr' === gusy_base_template_language( $template );
	$copy  = $is_fr
		? array(
			'boutique-luxe'        => array( 'label' => 'Collections', 'title' => 'Collections en boutique.', 'intro' => 'Les produits, photos et détails utiles donnent envie de choisir avant de passer commande.' ),
			'atelier-artisan'      => array( 'label' => 'Réalisations', 'title' => 'Pièces réalisées.', 'intro' => 'Les matières, finitions et usages concrets montrent le niveau de l’atelier avant la demande de devis.' ),
			'independant-conseil'  => array( 'label' => 'Cas clients', 'title' => 'Cas clients concrets.', 'intro' => 'Les formats, livrables et résultats attendus rendent l’accompagnement plus facile à comprendre.' ),
			'salon-beaute'         => array( 'label' => 'Résultats', 'title' => 'Soins et résultats.', 'intro' => 'Les soins, durées et ambiances aident à choisir le bon rendez-vous sans hésitation.' ),
			'restaurant-table'     => array( 'label' => 'Salle & plats', 'title' => 'Salle, carte et assiettes.', 'intro' => 'Les plats, l’ambiance et les informations pratiques donnent une vraie idée du restaurant avant de réserver.' ),
			'fleuriste-poetique'   => array( 'label' => 'Créations', 'title' => 'Bouquets et décors floraux.', 'intro' => 'Les compositions, budgets et occasions aident à formuler une commande précise.' ),
			'coach-wellness'       => array( 'label' => 'Programmes', 'title' => 'Formats d’accompagnement.', 'intro' => 'Les cadres, durées et objectifs sont visibles avant le premier échange.' ),
			'architecte-interieur' => array( 'label' => 'Projets', 'title' => 'Projets intérieurs.', 'intro' => 'Les images, étapes et matières aident à imaginer le niveau de mission avant le contact.' ),
			'marche-local'         => array( 'label' => 'Arrivages', 'title' => 'Arrivages et paniers.', 'intro' => 'Les produits du jour, paniers et horaires rendent le passage en boutique plus simple.' ),
			'studio-createur'      => array( 'label' => 'Portfolio', 'title' => 'Campagnes et portraits.', 'intro' => 'Les images, packs et livrables donnent le niveau visuel avant de réserver un shooting.' ),
		)
		: array(
			'boutique-luxe'        => array( 'label' => 'Collections', 'title' => 'In-store collections.', 'intro' => 'Products, photos and useful details make it easier to choose before ordering.' ),
			'atelier-artisan'      => array( 'label' => 'Portfolio', 'title' => 'Finished custom pieces.', 'intro' => 'Materials, finishes and real uses show the workshop level before a quote request.' ),
			'independant-conseil'  => array( 'label' => 'Cases', 'title' => 'Concrete client cases.', 'intro' => 'Formats, deliverables and expected outcomes make the consulting offer easier to understand.' ),
			'salon-beaute'         => array( 'label' => 'Results', 'title' => 'Treatments and results.', 'intro' => 'Treatments, durations and atmosphere help clients choose the right appointment.' ),
			'restaurant-table'     => array( 'label' => 'Dining', 'title' => 'Dining room, menu and plates.', 'intro' => 'Dishes, atmosphere and practical details give a real sense of the restaurant before booking.' ),
			'fleuriste-poetique'   => array( 'label' => 'Florals', 'title' => 'Bouquets and floral settings.', 'intro' => 'Arrangements, budgets and occasions help customers send a precise request.' ),
			'coach-wellness'       => array( 'label' => 'Programs', 'title' => 'Coaching formats.', 'intro' => 'Frameworks, durations and goals are visible before the first conversation.' ),
			'architecte-interieur' => array( 'label' => 'Projects', 'title' => 'Interior projects.', 'intro' => 'Images, steps and materials help customers imagine the mission level before contact.' ),
			'marche-local'         => array( 'label' => 'Arrivals', 'title' => 'Arrivals and baskets.', 'intro' => 'Products of the day, baskets and hours make the store visit simpler.' ),
			'studio-createur'      => array( 'label' => 'Portfolio', 'title' => 'Campaigns and portraits.', 'intro' => 'Images, packages and deliverables show the visual level before booking a shoot.' ),
		);

	return $copy[ $slug ] ?? array(
		'label' => gusy_base_text( 'navWork', $template ),
		'title' => $is_fr ? 'Réalisations récentes.' : 'Recent work.',
		'intro' => $is_fr ? 'Les images montrent le style, les détails et le niveau attendu.' : 'Images show style, details and expected level.',
	);
}

/**
 * Return the theme navigation links for a business template.
 *
 * @param array<string,mixed> $template Template data.
 * @return array<int,array<string,string>>
 */
function gusy_base_template_nav_links( array $template ): array {
	return array(
		array(
			'key'   => 'home',
			'label' => gusy_base_text( 'navHome', $template ),
			'url'   => gusy_base_template_page_url( $template ),
		),
		array(
			'key'   => 'offers',
			'label' => gusy_base_text( 'navOffers', $template ),
			'url'   => gusy_base_template_page_url( $template, gusy_base_secondary_slug_suffix( $template, 'offers' ) ),
		),
		array(
			'key'   => 'work',
			'label' => gusy_base_template_work_copy( $template )['label'],
			'url'   => gusy_base_template_page_url( $template, gusy_base_secondary_slug_suffix( $template, 'work' ) ),
		),
		array(
			'key'   => 'about',
			'label' => gusy_base_text( 'navAbout', $template ),
			'url'   => gusy_base_template_page_url( $template, gusy_base_secondary_slug_suffix( $template, 'about' ) ),
		),
		array(
			'key'   => 'contact',
			'label' => gusy_base_text( 'navContact', $template ),
			'url'   => gusy_base_template_page_url( $template, 'contact' ),
		),
	);
}

/**
 * Render a professional template navigation.
 *
 * @param array<string,mixed> $template Template data.
 * @param string             $active Active page key.
 * @return string
 */
function gusy_base_render_template_nav( array $template, string $active = 'home' ): string {
	$links = '';
	foreach ( gusy_base_template_nav_links( $template ) as $link ) {
		$is_active = $active === $link['key'];
		$links    .= '<a href="' . esc_url( $link['url'] ) . '"'
			. ( $is_active ? ' class="is-active" aria-current="page"' : '' )
			. '>' . esc_html( $link['label'] ) . '</a>';
	}

	return '<header class="gusy-template-nav">'
		. '<a class="gusy-template-brand" href="' . esc_url( gusy_base_template_page_url( $template ) ) . '">' . esc_html( $template['brand'] ) . '</a>'
		. '<nav class="gusy-template-menu" aria-label="' . esc_attr( gusy_base_text( 'navLabel', $template ) ) . '">'
		. $links
		. '<a class="gusy-button" href="' . esc_url( gusy_base_template_page_url( $template, 'contact' ) ) . '">' . esc_html( $template['primary'] ) . '</a>'
		. '</nav>'
		. '</header>';
}

/**
 * Render a compact template footer.
 *
 * @param array<string,mixed> $template Template data.
 * @param string             $active Active page key.
 * @return string
 */
function gusy_base_render_template_footer( array $template, string $active = 'home' ): string {
	$links = '';
	foreach ( gusy_base_template_nav_links( $template ) as $link ) {
		$is_active = $active === $link['key'];
		$links    .= '<a href="' . esc_url( $link['url'] ) . '"'
			. ( $is_active ? ' class="is-active" aria-current="page"' : '' )
			. '>' . esc_html( $link['label'] ) . '</a>';
	}

	return '<footer class="gusy-footer">'
		. '<a class="gusy-template-brand" href="' . esc_url( gusy_base_template_page_url( $template ) ) . '">' . esc_html( $template['brand'] ) . '</a>'
		. '<nav aria-label="' . esc_attr( gusy_base_text( 'footerLabel', $template ) ) . '">' . $links . '</nav>'
		. '</footer>';
}

/**
 * Return the ten French Gusy template proposals.
 *
 * @return array<int,array<string,mixed>>
 */
function gusy_base_template_catalog_fr(): array {
	return array(
		array(
			'slug'       => 'boutique-luxe',
			'class'      => 'boutique-luxe',
			'brand'      => 'Maison Aveline',
			'name'       => __( 'Boutique', 'gusy-base' ),
			'location'   => 'Boutique indépendante à Lyon',
			'title'      => 'Sélection élégante, achat simple.',
			'body'       => 'Produits choisis, cadeaux prêts et commande rapide.',
			'primary'    => 'Commander',
			'secondary'  => 'Voir la sélection',
			'badge'      => 'Click & collect aujourd’hui',
			'proof'      => array(
				array( 'value' => '24h', 'label' => 'préparation boutique' ),
				array( 'value' => '65€', 'label' => 'panier cadeau moyen' ),
				array( 'value' => '4,9/5', 'label' => 'avis clients' ),
				array( 'value' => '30 j', 'label' => 'retours simples' ),
			),
			'offersTitle' => 'Les essentiels boutique',
			'offersIntro' => 'Tout est prêt à comparer et commander.',
			'offers'     => array(
				array( 'title' => 'Sacs & petite maroquinerie', 'body' => 'Pièces durables, photos larges, fiche courte et bouton d’achat direct.', 'meta' => 'Nouvelle collection', 'price' => 'dès 89€' ),
				array( 'title' => 'Cadeaux prêts à offrir', 'body' => 'Sélection par budget avec emballage, message et retrait en boutique.', 'meta' => 'Retrait 2h', 'price' => 'dès 35€' ),
				array( 'title' => 'Objets de maison', 'body' => 'Céramique, senteurs et accessoires présentés comme une vitrine éditoriale.', 'meta' => 'Petites séries', 'price' => 'dès 24€' ),
			),
			'detailTitle' => 'Vendre sans perdre l’élégance.',
			'detailBody'  => 'Style, délais et conditions d’achat sont visibles avant la commande.',
			'detailList'  => array( 'Photos produits premium', 'Prix et disponibilité visibles', 'Retrait, livraison et retours rassurants' ),
			'process'    => array( 'Choisir une pièce', 'Ajouter un message cadeau', 'Retirer ou recevoir la commande' ),
			'review'     => 'On retrouve l’accueil de la boutique en ligne: choix clair, belle présentation et commande rapide.',
			'reviewer'   => 'Claire M., cliente régulière',
			'contact'    => array( 'address' => '18 rue Mercière, 69002 Lyon', 'hours' => 'Mar-sam 10:00-19:00', 'phone' => '04 72 00 18 45', 'email' => 'bonjour@maison-aveline.fr' ),
		),
		array(
			'slug'       => 'atelier-artisan',
			'class'      => 'atelier-artisan',
			'brand'      => 'Atelier Moreau',
			'name'       => __( 'Artisan', 'gusy-base' ),
			'location'   => 'Ébéniste sur mesure à Nantes',
			'title'      => 'Sur mesure, atelier local.',
			'body'       => 'Réalisations, matières et devis clairs dès la première visite.',
			'primary'    => 'Demander un devis',
			'secondary'  => 'Voir les réalisations',
			'badge'      => 'Premier croquis offert',
			'proof'      => array(
				array( 'value' => '14 ans', 'label' => 'd’expérience atelier' ),
				array( 'value' => '6 sem.', 'label' => 'délai moyen' ),
				array( 'value' => '120+', 'label' => 'projets livrés' ),
				array( 'value' => '3', 'label' => 'bois sélectionnés' ),
			),
			'offersTitle' => 'Des demandes mieux cadrées',
			'offersIntro' => 'Chaque prestation précise le format et le démarrage.',
			'offers'     => array(
				array( 'title' => 'Table sur mesure', 'body' => 'Dimensions, essence de bois, finition et livraison cadrées avant fabrication.', 'meta' => 'Devis sous 72h', 'price' => 'dès 1 200€' ),
				array( 'title' => 'Bibliothèque intégrée', 'body' => 'Conception, prise de cotes, fabrication et pose dans une même page.', 'meta' => 'Pose incluse', 'price' => 'sur devis' ),
				array( 'title' => 'Restauration de meuble', 'body' => 'Diagnostic photo, réparation, ponçage et finition adaptée à la pièce.', 'meta' => 'Atelier local', 'price' => 'dès 290€' ),
			),
			'detailTitle' => 'Inspirer confiance avant l’appel.',
			'detailBody'  => 'Matières, réalisations et étapes cadrent les demandes.',
			'detailList'  => array( 'Portfolio de réalisations', 'Process de commande visible', 'Informations matériaux et délais' ),
			'process'    => array( 'Brief et mesures', 'Croquis et choix matières', 'Fabrication puis pose' ),
			'review'     => 'Nous avions une idée vague; la page explique exactement comment l’atelier travaille.',
			'reviewer'   => 'Hélène et Marc, projet bibliothèque',
			'contact'    => array( 'address' => 'Atelier sur rendez-vous, Nantes Nord', 'hours' => 'Lun-ven 8:30-18:00', 'phone' => '02 40 00 82 16', 'email' => 'contact@atelier-moreau.fr' ),
		),
		array(
			'slug'       => 'independant-conseil',
			'class'      => 'independant-conseil',
			'brand'      => 'Clarté Conseil',
			'name'       => __( 'Indépendant', 'gusy-base' ),
			'location'   => 'Consultante organisation à Bordeaux',
			'title'      => 'Structurez votre activité.',
			'body'       => 'Offres lisibles, méthode claire et premier appel facile.',
			'primary'    => 'Planifier un appel',
			'secondary'  => 'Comparer les offres',
			'badge'      => 'Audit de 30 minutes offert',
			'proof'      => array(
				array( 'value' => '30 min', 'label' => 'appel découverte' ),
				array( 'value' => '3 offres', 'label' => 'selon maturité' ),
				array( 'value' => '48h', 'label' => 'compte rendu' ),
				array( 'value' => '4,8/5', 'label' => 'satisfaction' ),
			),
			'offersTitle' => 'Des services lisibles',
			'offersIntro' => 'Le problème, le format et le résultat sont clairs.',
			'offers'     => array(
				array( 'title' => 'Diagnostic organisation', 'body' => 'Entretien, analyse des blocages, priorités et plan d’action en 48h.', 'meta' => 'Session unique', 'price' => '490€' ),
				array( 'title' => 'Accompagnement dirigeant', 'body' => 'Suivi hebdomadaire pour structurer les décisions et les rituels d’équipe.', 'meta' => '4 semaines', 'price' => '1 800€' ),
				array( 'title' => 'Atelier équipe', 'body' => 'Une demi-journée pour clarifier rôles, priorités et indicateurs.', 'meta' => 'Sur site ou visio', 'price' => 'sur devis' ),
			),
			'detailTitle' => 'Vendre une méthode claire.',
			'detailBody'  => 'Le contexte, les livrables et la suite sont expliqués simplement.',
			'detailList'  => array( 'Offres comparables', 'Livrables concrets', 'Preuves et avis orientés résultat' ),
			'process'    => array( 'Appel découverte', 'Diagnostic et priorités', 'Plan d’action suivi' ),
			'review'     => 'La proposition est devenue claire dès le premier échange, avec des priorités faciles à partager.',
			'reviewer'   => 'Nadia R., fondatrice d’agence',
			'contact'    => array( 'address' => 'Bordeaux et visio France', 'hours' => 'Lun-jeu 9:00-18:00', 'phone' => '06 14 00 72 31', 'email' => 'contact@clarte-conseil.fr' ),
		),
		array(
			'slug'       => 'salon-beaute',
			'class'      => 'salon-beaute',
			'brand'      => 'Écrin Studio',
			'name'       => __( 'Salon', 'gusy-base' ),
			'location'   => 'Institut beauté à Annecy',
			'title'      => 'Soins premium, réservation simple.',
			'body'       => 'Tarifs, durées et créneaux visibles pour réserver sans hésiter.',
			'primary'    => 'Réserver un soin',
			'secondary'  => 'Voir les tarifs',
			'badge'      => 'Créneaux cette semaine',
			'proof'      => array(
				array( 'value' => '60 min', 'label' => 'soin signature' ),
				array( 'value' => '4 cabines', 'label' => 'calmes et privées' ),
				array( 'value' => '4,9/5', 'label' => 'avis Google' ),
				array( 'value' => '8', 'label' => 'rituels proposés' ),
			),
			'offersTitle' => 'Soins prêts à réserver',
			'offersIntro' => 'Durée, prix et bénéfice restent visibles.',
			'offers'     => array(
				array( 'title' => 'Soin visage éclat', 'body' => 'Nettoyage profond, massage et masque adapté au type de peau.', 'meta' => '60 minutes', 'price' => '85€' ),
				array( 'title' => 'Rituel corps relaxant', 'body' => 'Gommage, modelage et hydratation pour une expérience complète.', 'meta' => '90 minutes', 'price' => '125€' ),
				array( 'title' => 'Diagnostic peau', 'body' => 'Analyse, routine conseillée et sélection produits à emporter.', 'meta' => '30 minutes', 'price' => '45€' ),
			),
			'detailTitle' => 'Rassurer avant la réservation.',
			'detailBody'  => 'Cabine, produits, avis et horaires répondent aux questions clés.',
			'detailList'  => array( 'Tarifs et durées visibles', 'Avis clients intégrés', 'Horaires et réservation rapides' ),
			'process'    => array( 'Choisir un soin', 'Réserver un créneau', 'Recevoir le rappel SMS' ),
			'review'     => 'Tout est clair: les soins, les prix, l’ambiance et le bouton pour réserver.',
			'reviewer'   => 'Camille P., cliente soin visage',
			'contact'    => array( 'address' => '7 avenue du Lac, 74000 Annecy', 'hours' => 'Mar-sam 9:30-19:00', 'phone' => '04 50 00 25 41', 'email' => 'reservation@ecrin-studio.fr' ),
		),
		array(
			'slug'       => 'restaurant-table',
			'class'      => 'restaurant-table',
			'brand'      => 'La Table Rivage',
			'name'       => __( 'Restaurant', 'gusy-base' ),
			'location'   => 'Restaurant de saison à Marseille',
			'title'      => 'Carte courte, réservation rapide.',
			'body'       => 'Menus, horaires et ambiance réunis pour réserver en confiance.',
			'primary'    => 'Réserver une table',
			'secondary'  => 'Voir la carte',
			'badge'      => 'Menu midi à partir de 24€',
			'proof'      => array(
				array( 'value' => '32', 'label' => 'couverts' ),
				array( 'value' => '2', 'label' => 'menus chaque jour' ),
				array( 'value' => '19:30', 'label' => 'premier service soir' ),
				array( 'value' => '4,7/5', 'label' => 'avis clients' ),
			),
			'offersTitle' => 'Réserver sans chercher',
			'offersIntro' => 'Carte, adresse et horaires restent au bon endroit.',
			'offers'     => array(
				array( 'title' => 'Menu du midi', 'body' => 'Entrée, plat ou dessert selon arrivages, service en moins d’une heure.', 'meta' => 'Mar-ven', 'price' => '24€' ),
				array( 'title' => 'Dîner signature', 'body' => 'Carte courte, produits de saison et accord conseillé en salle.', 'meta' => 'Soir', 'price' => '39€' ),
				array( 'title' => 'Privatisation', 'body' => 'Déjeuner d’équipe, anniversaire ou dîner client sur demande.', 'meta' => 'Jusqu’à 32 pers.', 'price' => 'sur devis' ),
			),
			'detailTitle' => 'Faire sentir le lieu.',
			'detailBody'  => 'Plats, salle, horaires et réservation forment une page complète.',
			'detailList'  => array( 'Menus et prix rapides à lire', 'Photos de salle et de plats', 'Infos pratiques complètes' ),
			'process'    => array( 'Choisir service', 'Réserver en ligne', 'Recevoir confirmation' ),
			'review'     => 'On comprend tout de suite le style du restaurant et on réserve sans chercher.',
			'reviewer'   => 'Julien S., déjeuner client',
			'contact'    => array( 'address' => '12 rue Sainte, 13001 Marseille', 'hours' => 'Mar-sam 12:00-14:00 / 19:30-22:30', 'phone' => '04 91 00 64 20', 'email' => 'bonjour@latablerivage.fr' ),
		),
		array(
			'slug'       => 'fleuriste-poetique',
			'class'      => 'fleuriste-poetique',
			'brand'      => 'Maison Florale',
			'name'       => __( 'Fleuriste', 'gusy-base' ),
			'location'   => 'Fleuriste événementiel à Paris 11',
			'title'      => 'Bouquets de saison, livraison locale.',
			'body'       => 'Compositions, budgets et livraison visibles pour commander vite.',
			'primary'    => 'Commander un bouquet',
			'secondary'  => 'Voir les compositions',
			'badge'      => 'Livraison Paris le jour même',
			'proof'      => array(
				array( 'value' => '35€', 'label' => 'bouquet du jour' ),
				array( 'value' => '3h', 'label' => 'préparation express' ),
				array( 'value' => '120+', 'label' => 'mariages fleuris' ),
				array( 'value' => '4,9/5', 'label' => 'avis clients' ),
			),
			'offersTitle' => 'Pour chaque occasion',
			'offersIntro' => 'Bouquet, abonnement et événement se choisissent vite.',
			'offers'     => array(
				array( 'title' => 'Bouquet de saison', 'body' => 'Composition fraîche selon arrivage, carte message et livraison locale.', 'meta' => 'Chaque jour', 'price' => 'dès 35€' ),
				array( 'title' => 'Abonnement floral', 'body' => 'Un bouquet régulier pour maison, bureau ou commerce.', 'meta' => 'Hebdo ou mensuel', 'price' => 'dès 95€' ),
				array( 'title' => 'Événement & mariage', 'body' => 'Décor de table, arche, bouquet mariée et installation sur lieu.', 'meta' => 'Sur mesure', 'price' => 'sur devis' ),
			),
			'detailTitle' => 'Montrer style et fraîcheur.',
			'detailBody'  => 'Photos, budget et livraison rassurent au moment de commander.',
			'detailList'  => array( 'Bouquets classés par occasion', 'Livraison et retrait visibles', 'Demande mariage qualifiée' ),
			'process'    => array( 'Choisir budget', 'Ajouter l’adresse', 'Recevoir ou retirer' ),
			'review'     => 'J’ai commandé en deux minutes et le bouquet ressemblait vraiment au style montré.',
			'reviewer'   => 'Élodie B., commande anniversaire',
			'contact'    => array( 'address' => '44 rue Oberkampf, 75011 Paris', 'hours' => 'Lun-sam 9:30-20:00', 'phone' => '01 43 00 76 22', 'email' => 'commande@maisonflorale.fr' ),
		),
		array(
			'slug'       => 'coach-wellness',
			'class'      => 'coach-wellness',
			'brand'      => 'Respire Coaching',
			'name'       => __( 'Coach', 'gusy-base' ),
			'location'   => 'Coach bien-être à Toulouse',
			'title'      => 'Retrouver un rythme durable.',
			'body'       => 'Formats, tarifs et première séance expliqués simplement.',
			'primary'    => 'Réserver un échange',
			'secondary'  => 'Voir les programmes',
			'badge'      => 'Premier échange gratuit',
			'proof'      => array(
				array( 'value' => '45 min', 'label' => 'appel découverte' ),
				array( 'value' => '6 sem.', 'label' => 'programme court' ),
				array( 'value' => '2', 'label' => 'formats en visio' ),
				array( 'value' => '4,8/5', 'label' => 'avis accompagnés' ),
			),
			'offersTitle' => 'Choisir sans pression',
			'offersIntro' => 'Durée, cadre et prochaine étape sont clairs.',
			'offers'     => array(
				array( 'title' => 'Séance individuelle', 'body' => 'Un point précis pour identifier blocages, priorités et premier plan.', 'meta' => '75 minutes', 'price' => '95€' ),
				array( 'title' => 'Programme 6 semaines', 'body' => 'Suivi hebdomadaire, exercices simples et points d’ajustement.', 'meta' => '6 rendez-vous', 'price' => '540€' ),
				array( 'title' => 'Atelier collectif', 'body' => 'Format groupe pour respiration, organisation et reprise d’énergie.', 'meta' => '8 personnes max', 'price' => '45€' ),
			),
			'detailTitle' => 'Construire la confiance.',
			'detailBody'  => 'Le lieu, les supports et les formats rendent l’offre concrète.',
			'detailList'  => array( 'Cadre de séance expliqué', 'Formats et tarifs lisibles', 'Contact humain et rassurant' ),
			'process'    => array( 'Échange gratuit', 'Objectifs mesurables', 'Suivi semaine après semaine' ),
			'review'     => 'J’ai compris avant l’appel comment se passait l’accompagnement et ce que je pouvais attendre.',
			'reviewer'   => 'Manon L., programme 6 semaines',
			'contact'    => array( 'address' => 'Toulouse centre et visio', 'hours' => 'Lun-ven 8:00-19:00', 'phone' => '06 22 00 41 87', 'email' => 'hello@respire-coaching.fr' ),
		),
		array(
			'slug'       => 'architecte-interieur',
			'class'      => 'architecte-interieur',
			'brand'      => 'Studio Ligne',
			'name'       => __( 'Architecte', 'gusy-base' ),
			'location'   => 'Architecte d’intérieur à Lille',
			'title'      => 'Des espaces beaux et pratiques.',
			'body'       => 'Portfolio, prestations et budget cadrés pour lancer un projet.',
			'primary'    => 'Présenter un projet',
			'secondary'  => 'Voir le portfolio',
			'badge'      => 'Rendez-vous conseil 90 minutes',
			'proof'      => array(
				array( 'value' => '18', 'label' => 'chantiers par an' ),
				array( 'value' => '90 min', 'label' => 'rendez-vous conseil' ),
				array( 'value' => '3D', 'label' => 'projection incluse' ),
				array( 'value' => '4,9/5', 'label' => 'avis clients' ),
			),
			'offersTitle' => 'Qualifier les bons projets',
			'offersIntro' => 'Interventions, livrables et budget deviennent lisibles.',
			'offers'     => array(
				array( 'title' => 'Conseil déco', 'body' => 'Visite, orientations matériaux, couleurs et plan d’achat priorisé.', 'meta' => '90 minutes', 'price' => '240€' ),
				array( 'title' => 'Projet complet', 'body' => 'Plans, 3D, sélection fournisseurs et suivi esthétique du chantier.', 'meta' => 'Appartement ou maison', 'price' => 'sur devis' ),
				array( 'title' => 'Commerce', 'body' => 'Parcours client, mobilier, éclairage et cohérence de marque.', 'meta' => 'Boutique ou bureau', 'price' => 'sur devis' ),
			),
			'detailTitle' => 'Montrer le niveau.',
			'detailBody'  => 'Portfolio, matières et étapes filtrent les demandes utiles.',
			'detailList'  => array( 'Portfolio haut de gamme', 'Prestations et livrables clairs', 'Formulaire projet plus qualifié' ),
			'process'    => array( 'Rendez-vous conseil', 'Plan et matières', 'Suivi jusqu’à livraison' ),
			'review'     => 'La démarche est claire: on sait quelles informations préparer avant de demander un devis.',
			'reviewer'   => 'Sophie D., rénovation appartement',
			'contact'    => array( 'address' => 'Lille, Croix et métropole', 'hours' => 'Lun-ven 9:00-18:30', 'phone' => '03 20 00 14 39', 'email' => 'projets@studioligne.fr' ),
		),
		array(
			'slug'       => 'marche-local',
			'class'      => 'marche-local',
			'brand'      => 'Comptoir des Halles',
			'name'       => __( 'Marché local', 'gusy-base' ),
			'location'   => 'Épicerie fine et paniers locaux à Rennes',
			'title'      => 'Produits du jour, retrait facile.',
			'body'       => 'Arrivages, paniers et horaires prêts pour la commande locale.',
			'primary'    => 'Commander un panier',
			'secondary'  => 'Voir les arrivages',
			'badge'      => 'Retrait boutique dès 17h',
			'proof'      => array(
				array( 'value' => '18', 'label' => 'producteurs locaux' ),
				array( 'value' => '17h', 'label' => 'retrait du jour' ),
				array( 'value' => '3', 'label' => 'formats panier' ),
				array( 'value' => '4,8/5', 'label' => 'avis quartier' ),
			),
			'offersTitle' => 'Commander près de chez soi',
			'offersIntro' => 'Disponibilités, prix et retrait restent visibles.',
			'offers'     => array(
				array( 'title' => 'Panier semaine', 'body' => 'Fruits, légumes, pain et une surprise d’épicerie selon arrivage.', 'meta' => '2 à 3 personnes', 'price' => '29€' ),
				array( 'title' => 'Apéro local', 'body' => 'Tartinables, fromage, pain, boisson artisanale et fiche dégustation.', 'meta' => '4 personnes', 'price' => '42€' ),
				array( 'title' => 'Cave & épicerie', 'body' => 'Sélection fine pour cadeau, dîner ou table de week-end.', 'meta' => 'Sur mesure', 'price' => 'dès 25€' ),
			),
			'detailTitle' => 'Utile au quotidien.',
			'detailBody'  => 'Arrivages, paniers et retrait deviennent faciles à comprendre.',
			'detailList'  => array( 'Arrivages mis à jour', 'Paniers prêts à commander', 'Adresse et retrait visibles' ),
			'process'    => array( 'Choisir panier', 'Commander avant 14h', 'Retirer en boutique' ),
			'review'     => 'Je regarde les paniers le matin et je passe récupérer en sortant du travail.',
			'reviewer'   => 'Thomas V., client du quartier',
			'contact'    => array( 'address' => '5 place des Lices, 35000 Rennes', 'hours' => 'Mar-dim 8:30-13:00 / 16:00-19:30', 'phone' => '02 99 00 37 18', 'email' => 'commande@comptoirdeshalles.fr' ),
		),
		array(
			'slug'       => 'studio-createur',
			'class'      => 'studio-createur',
			'brand'      => 'Studio Nacre',
			'name'       => __( 'Studio', 'gusy-base' ),
			'location'   => 'Photographe et direction créative à Montpellier',
			'title'      => 'Images de marque prêtes à publier.',
			'body'       => 'Portfolio, packs et délais clairs pour envoyer un brief.',
			'primary'    => 'Envoyer un brief',
			'secondary'  => 'Voir le portfolio',
			'badge'      => 'Mini-session portrait le vendredi',
			'proof'      => array(
				array( 'value' => '48h', 'label' => 'pré-sélection livrée' ),
				array( 'value' => '3', 'label' => 'packs photo' ),
				array( 'value' => '12', 'label' => 'marques suivies' ),
				array( 'value' => '4,9/5', 'label' => 'avis clients' ),
			),
			'offersTitle' => 'Des offres créatives claires',
			'offersIntro' => 'Chaque pack relie prestation, délai et livrable.',
			'offers'     => array(
				array( 'title' => 'Portrait pro', 'body' => 'Séance courte, direction, retouche naturelle et galerie prête à utiliser.', 'meta' => '45 minutes', 'price' => '190€' ),
				array( 'title' => 'Campagne marque', 'body' => 'Moodboard, shooting, sélection et livraison web/réseaux.', 'meta' => '1 journée', 'price' => 'dès 1 200€' ),
				array( 'title' => 'Pack e-commerce', 'body' => 'Photos produits, détails, mises en scène et formats boutique.', 'meta' => '20 visuels', 'price' => '690€' ),
			),
			'detailTitle' => 'Vendre aussi la méthode.',
			'detailBody'  => 'Style, packs et délais guident un brief plus précis.',
			'detailList'  => array( 'Portfolio visuel fort', 'Packs et livrables explicites', 'Brief client guidé' ),
			'process'    => array( 'Brief et moodboard', 'Shooting guidé', 'Galerie prête à publier' ),
			'review'     => 'La page donne tout de suite le niveau visuel et les infos pour réserver un shooting.',
			'reviewer'   => 'Lina C., fondatrice de marque',
			'contact'    => array( 'address' => 'Montpellier centre et studio mobile', 'hours' => 'Lun-ven 9:30-18:00', 'phone' => '06 31 00 58 94', 'email' => 'brief@studionacre.fr' ),
		),
	);
}

/**
 * Return one template translated for the English primary theme.
 *
 * @param array<string,mixed> $template French template data.
 * @return array<string,mixed>
 */
function gusy_base_translate_template_en( array $template ): array {
	$translations = array(
		'boutique-luxe' => array(
			'name'        => 'Boutique',
			'location'    => 'Independent boutique in Lyon',
			'title'       => 'Elegant selection, simple purchase.',
			'body'        => 'Curated products, ready-to-gift pieces and fast ordering.',
			'primary'     => 'Order',
			'secondary'   => 'View selection',
			'badge'       => 'Click and collect today',
			'proof'       => array(
				array( 'value' => '24h', 'label' => 'boutique preparation' ),
				array( 'value' => '65€', 'label' => 'average gift basket' ),
				array( 'value' => '4.9/5', 'label' => 'customer rating' ),
				array( 'value' => '30 days', 'label' => 'simple returns' ),
			),
			'offersTitle' => 'Boutique essentials',
			'offersIntro' => 'Everything is ready to compare and order.',
			'offers'      => array(
				array( 'title' => 'Bags & small leather goods', 'body' => 'Durable pieces, generous photography, short product copy and direct purchase.', 'meta' => 'New collection', 'price' => 'from 89€' ),
				array( 'title' => 'Ready-to-gift sets', 'body' => 'Selections by budget with wrapping, message and in-store pickup.', 'meta' => '2h pickup', 'price' => 'from 35€' ),
				array( 'title' => 'Home objects', 'body' => 'Ceramics, scents and accessories presented like an editorial shop window.', 'meta' => 'Small batches', 'price' => 'from 24€' ),
			),
			'detailTitle' => 'Sell without losing elegance.',
			'detailBody'  => 'Style, timing and purchase conditions are visible before checkout.',
			'detailList'  => array( 'Premium product photography', 'Visible prices and availability', 'Reassuring pickup, delivery and returns' ),
			'process'     => array( 'Choose a piece', 'Add a gift message', 'Pick up or receive the order' ),
			'review'      => 'The online store feels like the boutique: clear choice, refined presentation and quick ordering.',
			'reviewer'    => 'Claire M., regular customer',
			'contact'     => array( 'address' => '18 rue Mercière, 69002 Lyon', 'hours' => 'Tue-Sat 10:00-19:00', 'phone' => '04 72 00 18 45', 'email' => 'bonjour@maison-aveline.fr' ),
		),
		'atelier-artisan' => array(
			'name'        => 'Craft',
			'location'    => 'Custom cabinetmaker in Nantes',
			'title'       => 'Made to measure, built locally.',
			'body'        => 'Work examples, materials and quote details are clear from the first visit.',
			'primary'     => 'Request a quote',
			'secondary'   => 'View work',
			'badge'       => 'First sketch included',
			'proof'       => array(
				array( 'value' => '14 yrs', 'label' => 'workshop experience' ),
				array( 'value' => '6 wks', 'label' => 'average lead time' ),
				array( 'value' => '120+', 'label' => 'projects delivered' ),
				array( 'value' => '3', 'label' => 'selected woods' ),
			),
			'offersTitle' => 'Better framed requests',
			'offersIntro' => 'Each service explains the format and starting point.',
			'offers'      => array(
				array( 'title' => 'Custom table', 'body' => 'Dimensions, wood species, finish and delivery are defined before production.', 'meta' => 'Quote in 72h', 'price' => 'from 1,200€' ),
				array( 'title' => 'Built-in bookcase', 'body' => 'Design, measurements, fabrication and installation presented in one clear page.', 'meta' => 'Install included', 'price' => 'by quote' ),
				array( 'title' => 'Furniture restoration', 'body' => 'Photo diagnosis, repair, sanding and finish adapted to the piece.', 'meta' => 'Local workshop', 'price' => 'from 290€' ),
			),
			'detailTitle' => 'Build trust before the call.',
			'detailBody'  => 'Materials, finished work and project steps help qualify requests.',
			'detailList'  => array( 'Portfolio of completed work', 'Visible ordering process', 'Material and timeline information' ),
			'process'     => array( 'Brief and measurements', 'Sketch and material choice', 'Fabrication and installation' ),
			'review'      => 'We had a vague idea; the page explains exactly how the workshop operates.',
			'reviewer'    => 'Hélène and Marc, bookcase project',
			'contact'     => array( 'address' => 'Workshop by appointment, North Nantes', 'hours' => 'Mon-Fri 8:30-18:00', 'phone' => '02 40 00 82 16', 'email' => 'contact@atelier-moreau.fr' ),
		),
		'independant-conseil' => array(
			'name'        => 'Consultant',
			'location'    => 'Operations consultant in Bordeaux',
			'title'       => 'Structure your business.',
			'body'        => 'Readable offers, a clear method and an easy first call.',
			'primary'     => 'Book a call',
			'secondary'   => 'Compare offers',
			'badge'       => 'Free 30-minute audit',
			'proof'       => array(
				array( 'value' => '30 min', 'label' => 'discovery call' ),
				array( 'value' => '3 offers', 'label' => 'by maturity level' ),
				array( 'value' => '48h', 'label' => 'summary delivered' ),
				array( 'value' => '4.8/5', 'label' => 'satisfaction' ),
			),
			'offersTitle' => 'Readable services',
			'offersIntro' => 'The problem, format and result are easy to understand.',
			'offers'      => array(
				array( 'title' => 'Operations diagnosis', 'body' => 'Interview, bottleneck analysis, priorities and action plan within 48h.', 'meta' => 'Single session', 'price' => '490€' ),
				array( 'title' => 'Founder support', 'body' => 'Weekly support to structure decisions and team rituals.', 'meta' => '4 weeks', 'price' => '1,800€' ),
				array( 'title' => 'Team workshop', 'body' => 'A half-day to clarify roles, priorities and indicators.', 'meta' => 'On-site or remote', 'price' => 'by quote' ),
			),
			'detailTitle' => 'Sell a clear method.',
			'detailBody'  => 'Context, deliverables and next steps are explained simply.',
			'detailList'  => array( 'Comparable offers', 'Concrete deliverables', 'Proof and reviews focused on outcomes' ),
			'process'     => array( 'Discovery call', 'Diagnosis and priorities', 'Followed action plan' ),
			'review'      => 'The proposal became clear from the first call, with priorities easy to share.',
			'reviewer'    => 'Nadia R., agency founder',
			'contact'     => array( 'address' => 'Bordeaux and remote across France', 'hours' => 'Mon-Thu 9:00-18:00', 'phone' => '06 14 00 72 31', 'email' => 'contact@clarte-conseil.fr' ),
		),
		'salon-beaute' => array(
			'name'        => 'Beauty Salon',
			'location'    => 'Beauty studio in Annecy',
			'title'       => 'Premium treatments, simple booking.',
			'body'        => 'Prices, durations and available slots are visible before booking.',
			'primary'     => 'Book a treatment',
			'secondary'   => 'View prices',
			'badge'       => 'Appointments this week',
			'proof'       => array(
				array( 'value' => '60 min', 'label' => 'signature treatment' ),
				array( 'value' => '4 rooms', 'label' => 'quiet private rooms' ),
				array( 'value' => '4.9/5', 'label' => 'Google reviews' ),
				array( 'value' => '8', 'label' => 'rituals available' ),
			),
			'offersTitle' => 'Treatments ready to book',
			'offersIntro' => 'Duration, price and benefit stay visible.',
			'offers'      => array(
				array( 'title' => 'Glow facial', 'body' => 'Deep cleansing, massage and mask adapted to the skin type.', 'meta' => '60 minutes', 'price' => '85€' ),
				array( 'title' => 'Relaxing body ritual', 'body' => 'Scrub, massage and hydration for a complete experience.', 'meta' => '90 minutes', 'price' => '125€' ),
				array( 'title' => 'Skin diagnosis', 'body' => 'Analysis, recommended routine and product selection to take home.', 'meta' => '30 minutes', 'price' => '45€' ),
			),
			'detailTitle' => 'Reassure before booking.',
			'detailBody'  => 'Room, products, reviews and opening hours answer the key questions.',
			'detailList'  => array( 'Visible prices and durations', 'Integrated client reviews', 'Fast hours and booking path' ),
			'process'     => array( 'Choose a treatment', 'Book a slot', 'Receive the SMS reminder' ),
			'review'      => 'Everything is clear: treatments, prices, atmosphere and the button to book.',
			'reviewer'    => 'Camille P., facial client',
			'contact'     => array( 'address' => '7 avenue du Lac, 74000 Annecy', 'hours' => 'Tue-Sat 9:30-19:00', 'phone' => '04 50 00 25 41', 'email' => 'reservation@ecrin-studio.fr' ),
		),
		'restaurant-table' => array(
			'name'        => 'Restaurant',
			'location'    => 'Seasonal restaurant in Marseille',
			'title'       => 'Short menu, quick reservation.',
			'body'        => 'Menus, hours and atmosphere are grouped to make booking easy.',
			'primary'     => 'Book a table',
			'secondary'   => 'View menu',
			'badge'       => 'Lunch menu from 24€',
			'proof'       => array(
				array( 'value' => '32', 'label' => 'seats' ),
				array( 'value' => '2', 'label' => 'menus daily' ),
				array( 'value' => '19:30', 'label' => 'first dinner service' ),
				array( 'value' => '4.7/5', 'label' => 'customer rating' ),
			),
			'offersTitle' => 'Book without searching',
			'offersIntro' => 'Menu, address and hours stay in the right place.',
			'offers'      => array(
				array( 'title' => 'Lunch menu', 'body' => 'Starter, main or dessert depending on arrivals, served in under one hour.', 'meta' => 'Tue-Fri', 'price' => '24€' ),
				array( 'title' => 'Signature dinner', 'body' => 'Short menu, seasonal produce and suggested pairing in the dining room.', 'meta' => 'Evening', 'price' => '39€' ),
				array( 'title' => 'Private booking', 'body' => 'Team lunch, birthday or client dinner on request.', 'meta' => 'Up to 32 guests', 'price' => 'by quote' ),
			),
			'detailTitle' => 'Make the place tangible.',
			'detailBody'  => 'Dishes, dining room, hours and booking form a complete page.',
			'detailList'  => array( 'Fast-reading menus and prices', 'Room and food photography', 'Complete practical details' ),
			'process'     => array( 'Choose service', 'Book online', 'Receive confirmation' ),
			'review'      => 'You immediately understand the restaurant style and can reserve without searching elsewhere.',
			'reviewer'    => 'Julien S., client lunch',
			'contact'     => array( 'address' => '12 rue Sainte, 13001 Marseille', 'hours' => 'Tue-Sat 12:00-14:00 / 19:30-22:30', 'phone' => '04 91 00 64 20', 'email' => 'bonjour@latablerivage.fr' ),
		),
		'fleuriste-poetique' => array(
			'name'        => 'Florist',
			'location'    => 'Event florist in Paris 11',
			'title'       => 'Seasonal bouquets, local delivery.',
			'body'        => 'Compositions, budgets and delivery details are visible for fast ordering.',
			'primary'     => 'Order a bouquet',
			'secondary'   => 'View compositions',
			'badge'       => 'Same-day delivery in Paris',
			'proof'       => array(
				array( 'value' => '35€', 'label' => 'bouquet of the day' ),
				array( 'value' => '3h', 'label' => 'express preparation' ),
				array( 'value' => '120+', 'label' => 'weddings decorated' ),
				array( 'value' => '4.9/5', 'label' => 'customer rating' ),
			),
			'offersTitle' => 'For every occasion',
			'offersIntro' => 'Bouquet, subscription and event requests are easy to choose.',
			'offers'      => array(
				array( 'title' => 'Seasonal bouquet', 'body' => 'Fresh composition based on arrivals, message card and local delivery.', 'meta' => 'Every day', 'price' => 'from 35€' ),
				array( 'title' => 'Floral subscription', 'body' => 'A regular bouquet for home, office or shop.', 'meta' => 'Weekly or monthly', 'price' => 'from 95€' ),
				array( 'title' => 'Events & weddings', 'body' => 'Table decor, arch, bridal bouquet and on-site installation.', 'meta' => 'Custom', 'price' => 'by quote' ),
			),
			'detailTitle' => 'Show style and freshness.',
			'detailBody'  => 'Photos, budget and delivery details reassure at order time.',
			'detailList'  => array( 'Bouquets by occasion', 'Delivery and pickup visible', 'Qualified wedding requests' ),
			'process'     => array( 'Choose a budget', 'Add the address', 'Receive or pick up' ),
			'review'      => 'I ordered in two minutes and the bouquet really matched the style shown.',
			'reviewer'    => 'Élodie B., birthday order',
			'contact'     => array( 'address' => '44 rue Oberkampf, 75011 Paris', 'hours' => 'Mon-Sat 9:30-20:00', 'phone' => '01 43 00 76 22', 'email' => 'commande@maisonflorale.fr' ),
		),
		'coach-wellness' => array(
			'name'        => 'Coach',
			'location'    => 'Wellness coach in Toulouse',
			'title'       => 'Find a sustainable rhythm.',
			'body'        => 'Formats, prices and the first session are explained simply.',
			'primary'     => 'Book a call',
			'secondary'   => 'View programs',
			'badge'       => 'Free first exchange',
			'proof'       => array(
				array( 'value' => '45 min', 'label' => 'discovery call' ),
				array( 'value' => '6 wks', 'label' => 'short program' ),
				array( 'value' => '2', 'label' => 'remote formats' ),
				array( 'value' => '4.8/5', 'label' => 'client rating' ),
			),
			'offersTitle' => 'Choose without pressure',
			'offersIntro' => 'Duration, framework and next step are clear.',
			'offers'      => array(
				array( 'title' => 'Individual session', 'body' => 'A focused point to identify blockers, priorities and a first plan.', 'meta' => '75 minutes', 'price' => '95€' ),
				array( 'title' => '6-week program', 'body' => 'Weekly follow-up, simple exercises and adjustment points.', 'meta' => '6 meetings', 'price' => '540€' ),
				array( 'title' => 'Group workshop', 'body' => 'Group format for breathing, organization and renewed energy.', 'meta' => '8 people max', 'price' => '45€' ),
			),
			'detailTitle' => 'Build confidence.',
			'detailBody'  => 'The place, support materials and formats make the offer concrete.',
			'detailList'  => array( 'Session framework explained', 'Readable formats and prices', 'Human and reassuring contact' ),
			'process'     => array( 'Free exchange', 'Measurable goals', 'Weekly follow-up' ),
			'review'      => 'Before the call, I understood how the program worked and what to expect.',
			'reviewer'    => 'Manon L., 6-week program',
			'contact'     => array( 'address' => 'Central Toulouse and remote', 'hours' => 'Mon-Fri 8:00-19:00', 'phone' => '06 22 00 41 87', 'email' => 'hello@respire-coaching.fr' ),
		),
		'architecte-interieur' => array(
			'name'        => 'Interior Architect',
			'location'    => 'Interior architect in Lille',
			'title'       => 'Beautiful, practical spaces.',
			'body'        => 'Portfolio, services and budget framing help launch a project.',
			'primary'     => 'Share a project',
			'secondary'   => 'View portfolio',
			'badge'       => '90-minute design consultation',
			'proof'       => array(
				array( 'value' => '18', 'label' => 'projects per year' ),
				array( 'value' => '90 min', 'label' => 'consultation' ),
				array( 'value' => '3D', 'label' => 'projection included' ),
				array( 'value' => '4.9/5', 'label' => 'customer rating' ),
			),
			'offersTitle' => 'Qualify the right projects',
			'offersIntro' => 'Interventions, deliverables and budget become readable.',
			'offers'      => array(
				array( 'title' => 'Decoration consultation', 'body' => 'Visit, material guidance, color direction and prioritized shopping plan.', 'meta' => '90 minutes', 'price' => '240€' ),
				array( 'title' => 'Full project', 'body' => 'Plans, 3D, supplier selection and aesthetic site follow-up.', 'meta' => 'Apartment or house', 'price' => 'by quote' ),
				array( 'title' => 'Commercial space', 'body' => 'Customer journey, furniture, lighting and brand consistency.', 'meta' => 'Shop or office', 'price' => 'by quote' ),
			),
			'detailTitle' => 'Show the level.',
			'detailBody'  => 'Portfolio, materials and steps filter useful requests.',
			'detailList'  => array( 'High-end portfolio', 'Clear services and deliverables', 'Better qualified project form' ),
			'process'     => array( 'Design consultation', 'Plan and materials', 'Follow-up to delivery' ),
			'review'      => 'The approach is clear: you know what information to prepare before asking for a quote.',
			'reviewer'    => 'Sophie D., apartment renovation',
			'contact'     => array( 'address' => 'Lille, Croix and metro area', 'hours' => 'Mon-Fri 9:00-18:30', 'phone' => '03 20 00 14 39', 'email' => 'projets@studioligne.fr' ),
		),
		'marche-local' => array(
			'name'        => 'Local Market',
			'location'    => 'Fine grocery and local baskets in Rennes',
			'title'       => 'Products of the day, easy pickup.',
			'body'        => 'Arrivals, baskets and hours are ready for local ordering.',
			'primary'     => 'Order a basket',
			'secondary'   => 'View arrivals',
			'badge'       => 'In-store pickup from 5pm',
			'proof'       => array(
				array( 'value' => '18', 'label' => 'local producers' ),
				array( 'value' => '5pm', 'label' => 'same-day pickup' ),
				array( 'value' => '3', 'label' => 'basket formats' ),
				array( 'value' => '4.8/5', 'label' => 'neighborhood rating' ),
			),
			'offersTitle' => 'Order close to home',
			'offersIntro' => 'Availability, prices and pickup stay visible.',
			'offers'      => array(
				array( 'title' => 'Weekly basket', 'body' => 'Fruit, vegetables, bread and one grocery surprise based on arrivals.', 'meta' => '2 to 3 people', 'price' => '29€' ),
				array( 'title' => 'Local aperitif', 'body' => 'Spreads, cheese, bread, craft drink and tasting card.', 'meta' => '4 people', 'price' => '42€' ),
				array( 'title' => 'Cellar & grocery', 'body' => 'Fine selection for gifts, dinner or weekend table.', 'meta' => 'Custom', 'price' => 'from 25€' ),
			),
			'detailTitle' => 'Useful every day.',
			'detailBody'  => 'Arrivals, baskets and pickup become easy to understand.',
			'detailList'  => array( 'Updated arrivals', 'Baskets ready to order', 'Visible address and pickup' ),
			'process'     => array( 'Choose basket', 'Order before 2pm', 'Pick up in store' ),
			'review'      => 'I check the baskets in the morning and pick up after work.',
			'reviewer'    => 'Thomas V., neighborhood customer',
			'contact'     => array( 'address' => '5 place des Lices, 35000 Rennes', 'hours' => 'Tue-Sun 8:30-13:00 / 16:00-19:30', 'phone' => '02 99 00 37 18', 'email' => 'commande@comptoirdeshalles.fr' ),
		),
		'studio-createur' => array(
			'name'        => 'Creative Studio',
			'location'    => 'Photographer and creative direction in Montpellier',
			'title'       => 'Brand images ready to publish.',
			'body'        => 'Portfolio, packages and timelines are clear before sending a brief.',
			'primary'     => 'Send a brief',
			'secondary'   => 'View portfolio',
			'badge'       => 'Mini portrait session on Fridays',
			'proof'       => array(
				array( 'value' => '48h', 'label' => 'preselection delivered' ),
				array( 'value' => '3', 'label' => 'photo packages' ),
				array( 'value' => '12', 'label' => 'brands followed' ),
				array( 'value' => '4.9/5', 'label' => 'customer rating' ),
			),
			'offersTitle' => 'Clear creative offers',
			'offersIntro' => 'Each package links service, timeline and deliverable.',
			'offers'      => array(
				array( 'title' => 'Professional portrait', 'body' => 'Short session, direction, natural retouching and ready-to-use gallery.', 'meta' => '45 minutes', 'price' => '190€' ),
				array( 'title' => 'Brand campaign', 'body' => 'Moodboard, shooting, selection and web/social delivery.', 'meta' => '1 day', 'price' => 'from 1,200€' ),
				array( 'title' => 'E-commerce pack', 'body' => 'Product shots, details, scenes and shop-ready formats.', 'meta' => '20 visuals', 'price' => '690€' ),
			),
			'detailTitle' => 'Sell the method too.',
			'detailBody'  => 'Style, packages and timing guide a more precise brief.',
			'detailList'  => array( 'Strong visual portfolio', 'Explicit packages and deliverables', 'Guided client brief' ),
			'process'     => array( 'Brief and moodboard', 'Directed shooting', 'Gallery ready to publish' ),
			'review'      => 'The page immediately shows the visual level and what to send to book a shoot.',
			'reviewer'    => 'Lina C., brand founder',
			'contact'     => array( 'address' => 'Central Montpellier and mobile studio', 'hours' => 'Mon-Fri 9:30-18:00', 'phone' => '06 31 00 58 94', 'email' => 'brief@studionacre.fr' ),
		),
	);

	$slug = (string) ( $template['slug'] ?? '' );
	$translated = isset( $translations[ $slug ] ) ? array_replace_recursive( $template, $translations[ $slug ] ) : $template;
	$translated['language'] = 'en';

	return $translated;
}

/**
 * Return the ten Gusy template proposals.
 *
 * @param string $locale Locale code. English is the default theme language.
 * @return array<int,array<string,mixed>>
 */
function gusy_base_template_catalog( string $locale = 'en' ): array {
	$french = array_map(
		static function ( array $template ): array {
			$template['language'] = 'fr';
			return $template;
		},
		gusy_base_template_catalog_fr()
	);

	if ( 0 === strpos( strtolower( $locale ), 'fr' ) ) {
		return $french;
	}

	return array_map( 'gusy_base_translate_template_en', $french );
}

/**
 * Register the ten templates as block patterns.
 */
function gusy_base_register_patterns(): void {
	if ( ! function_exists( 'register_block_pattern_category' ) || ! function_exists( 'register_block_pattern' ) ) {
		return;
	}

	register_block_pattern_category(
		'gusy-base',
		array(
			'label' => __( 'Gusy Base', 'gusy-base' ),
		)
	);

	foreach ( gusy_base_template_catalog() as $template ) {
		register_block_pattern(
			'gusy-base/' . $template['slug'],
			array(
				'title'       => sprintf(
					/* translators: %s: template name. */
					__( 'Gusy - %s', 'gusy-base' ),
					$template['name']
				),
				'description' => sprintf(
					/* translators: %s: template name. */
					__( 'Complete Gusy homepage template for %s businesses.', 'gusy-base' ),
					$template['name']
				),
				'categories'  => array( 'gusy-base' ),
				'content'     => gusy_base_render_template_pattern( $template ),
			)
		);
	}
}
add_action( 'init', 'gusy_base_register_patterns' );

/**
 * Return polished section copy that should be visible to final customers.
 *
 * @param array<string,mixed> $template Template data.
 * @return array<string,string>
 */
function gusy_base_template_section_copy( array $template ): array {
	$slug = (string) ( $template['slug'] ?? '' );

	if ( 'en' === gusy_base_template_language( $template ) ) {
		$copy = array(
			'boutique-luxe' => array(
				'offersEyebrow' => 'Shop selection',
				'detailEyebrow' => 'Shopping experience',
				'processTitle'  => 'From choice to pickup, everything is simple.',
				'contactTitle'  => 'Contact Maison Aveline.',
				'contactBody'   => 'Address, hours, phone and email are gathered to order or plan a store visit.',
			),
			'atelier-artisan' => array(
				'offersEyebrow' => 'Workshop services',
				'detailEyebrow' => 'Craft',
				'processTitle'  => 'A clear request, from idea to installation.',
				'contactTitle'  => 'Tell the workshop about your project.',
				'contactBody'   => 'Contact details, hours and appointments help start a request with the right information.',
			),
			'independant-conseil' => array(
				'offersEyebrow' => 'Consulting formats',
				'detailEyebrow' => 'Method',
				'processTitle'  => 'A framed engagement from the first call.',
				'contactTitle'  => 'Book a first conversation.',
				'contactBody'   => 'Formats, contact details and useful slots are gathered to prepare a practical exchange.',
			),
			'salon-beaute' => array(
				'offersEyebrow' => 'Treatments and prices',
				'detailEyebrow' => 'Salon atmosphere',
				'processTitle'  => 'Book the right treatment without hesitation.',
				'contactTitle'  => 'Book your moment at the salon.',
				'contactBody'   => 'Address, hours, phone and booking details are visible so customers can choose a slot easily.',
			),
			'restaurant-table' => array(
				'offersEyebrow' => 'Menu and services',
				'detailEyebrow' => 'Dining room',
				'processTitle'  => 'From menu to booking, everything is readable.',
				'contactTitle'  => 'Book at La Table Rivage.',
				'contactBody'   => 'Address, services, hours and contact details are gathered for reservations and group requests.',
			),
			'fleuriste-poetique' => array(
				'offersEyebrow' => 'Arrangements',
				'detailEyebrow' => 'Floral style',
				'processTitle'  => 'Order a bouquet in a few clear steps.',
				'contactTitle'  => 'Contact Maison Florale.',
				'contactBody'   => 'Orders, delivery, hours and contact details are gathered to choose the right arrangement.',
			),
			'coach-wellness' => array(
				'offersEyebrow' => 'Programs',
				'detailEyebrow' => 'Coaching framework',
				'processTitle'  => 'A clear path before committing.',
				'contactTitle'  => 'Book a first conversation.',
				'contactBody'   => 'Formats, hours and contact details are visible to choose the right support.',
			),
			'architecte-interieur' => array(
				'offersEyebrow' => 'Missions',
				'detailEyebrow' => 'Project approach',
				'processTitle'  => 'From intention to site work, every step is framed.',
				'contactTitle'  => 'Introduce your project.',
				'contactBody'   => 'Contact details, hours and mission types help prepare a clear first request.',
			),
			'marche-local' => array(
				'offersEyebrow' => 'Baskets and arrivals',
				'detailEyebrow' => 'Market life',
				'processTitle'  => 'Choose, order and pick up simply.',
				'contactTitle'  => 'Contact the market.',
				'contactBody'   => 'Hours, address, phone and email are gathered to order or plan a visit.',
			),
			'studio-createur' => array(
				'offersEyebrow' => 'Creative packages',
				'detailEyebrow' => 'Visual direction',
				'processTitle'  => 'A clear brief, a smooth production.',
				'contactTitle'  => 'Tell us about your next shoot.',
				'contactBody'   => 'Packages, contact details and practical information help prepare a usable brief.',
			),
		);

		return $copy[ $slug ] ?? array(
			'offersEyebrow' => 'Offers',
			'detailEyebrow' => 'Method',
			'processTitle'  => 'A clear customer path, step by step.',
			'contactTitle'  => 'Contact us.',
			'contactBody'   => 'Address, hours, phone and email are gathered so customers can take action easily.',
		);
	}

	$copy = array(
		'boutique-luxe' => array(
			'offersEyebrow' => 'Sélection boutique',
			'detailEyebrow' => 'Expérience d’achat',
			'processTitle'  => 'Du choix au retrait, tout est simple.',
			'contactTitle'  => 'Contactez Maison Aveline.',
			'contactBody'   => 'Adresse, horaires, téléphone et email sont regroupés pour commander ou préparer votre passage en boutique.',
		),
		'atelier-artisan' => array(
			'offersEyebrow' => 'Prestations atelier',
			'detailEyebrow' => 'Savoir-faire',
			'processTitle'  => 'Une demande claire, de l’idée à la pose.',
			'contactTitle'  => 'Parlez de votre projet à l’atelier.',
			'contactBody'   => 'Coordonnées, horaires et rendez-vous permettent de lancer une demande avec les bonnes informations.',
		),
		'independant-conseil' => array(
			'offersEyebrow' => 'Accompagnements',
			'detailEyebrow' => 'Méthode',
			'processTitle'  => 'Un accompagnement cadré dès le premier appel.',
			'contactTitle'  => 'Planifiez un premier échange.',
			'contactBody'   => 'Les formats, coordonnées et créneaux utiles sont réunis pour préparer un échange concret.',
		),
		'salon-beaute' => array(
			'offersEyebrow' => 'Soins et tarifs',
			'detailEyebrow' => 'Ambiance salon',
			'processTitle'  => 'Réserver le bon soin sans hésiter.',
			'contactTitle'  => 'Réservez votre moment au salon.',
			'contactBody'   => 'Adresse, horaires, téléphone et réservation sont visibles pour choisir un créneau facilement.',
		),
		'restaurant-table' => array(
			'offersEyebrow' => 'Carte et services',
			'detailEyebrow' => 'En salle',
			'processTitle'  => 'De la carte à la réservation, tout est lisible.',
			'contactTitle'  => 'Réservez à La Table Rivage.',
			'contactBody'   => 'Adresse, services, horaires et contact sont réunis pour réserver ou organiser une demande de groupe.',
		),
		'fleuriste-poetique' => array(
			'offersEyebrow' => 'Compositions',
			'detailEyebrow' => 'Style floral',
			'processTitle'  => 'Commander un bouquet en quelques étapes.',
			'contactTitle'  => 'Contactez Maison Florale.',
			'contactBody'   => 'Commande, livraison, horaires et coordonnées sont regroupés pour choisir la bonne composition.',
		),
		'coach-wellness' => array(
			'offersEyebrow' => 'Programmes',
			'detailEyebrow' => 'Cadre d’accompagnement',
			'processTitle'  => 'Un parcours clair avant de s’engager.',
			'contactTitle'  => 'Réservez un premier échange.',
			'contactBody'   => 'Formats, horaires et coordonnées sont visibles pour choisir l’accompagnement adapté.',
		),
		'architecte-interieur' => array(
			'offersEyebrow' => 'Missions',
			'detailEyebrow' => 'Approche projet',
			'processTitle'  => 'De l’intention au chantier, chaque étape est cadrée.',
			'contactTitle'  => 'Présentez votre projet.',
			'contactBody'   => 'Coordonnées, horaires et type de mission aident à préparer une demande claire dès le premier contact.',
		),
		'marche-local' => array(
			'offersEyebrow' => 'Paniers et arrivages',
			'detailEyebrow' => 'Vie du marché',
			'processTitle'  => 'Choisir, commander, récupérer simplement.',
			'contactTitle'  => 'Contactez le marché.',
			'contactBody'   => 'Horaires, adresse, téléphone et email sont réunis pour commander ou organiser votre passage.',
		),
		'studio-createur' => array(
			'offersEyebrow' => 'Packs créatifs',
			'detailEyebrow' => 'Direction visuelle',
			'processTitle'  => 'Un brief clair, une production fluide.',
			'contactTitle'  => 'Parlez de votre prochain shooting.',
			'contactBody'   => 'Packs, coordonnées et informations pratiques aident à préparer un brief exploitable.',
		),
	);

	return $copy[ $slug ] ?? array(
		'offersEyebrow' => 'Offres',
		'detailEyebrow' => 'Méthode',
		'processTitle'  => 'Un parcours clair, étape par étape.',
		'contactTitle'  => 'Contactez-nous.',
		'contactBody'   => 'Adresse, horaires, téléphone et email sont regroupés pour passer à l’action facilement.',
	);
}

	/**
	 * Return useful FAQ items for a business template.
	 *
	 * @param array<string,mixed> $template Template data.
	 * @return array<int,array<string,string>>
	 */
	function gusy_base_template_faq_items( array $template ): array {
		$is_fr   = 'fr' === gusy_base_template_language( $template );
		$contact = is_array( $template['contact'] ?? null ) ? $template['contact'] : array();
		$hours   = (string) ( $contact['hours'] ?? '' );
		$phone   = (string) ( $contact['phone'] ?? '' );
		$email   = (string) ( $contact['email'] ?? '' );
		$primary = (string) ( $template['primary'] ?? '' );

		if ( $is_fr ) {
			return array(
				array(
					'title' => gusy_base_text( 'faqTiming', $template ),
					'body'  => trim( 'Les horaires utiles sont indiqués sur la page. Pour une demande urgente, utilisez le téléphone ' . $phone . ' ou l’email ' . $email . '.' ),
					'label' => $hours,
				),
				array(
					'title' => gusy_base_text( 'faqPrepare', $template ),
					'body'  => 'Indiquez l’option souhaitée, la date ou le délai, le budget si nécessaire et les détails qui aideront à répondre précisément.',
					'label' => (string) ( $template['offersTitle'] ?? '' ),
				),
				array(
					'title' => gusy_base_text( 'faqAdapt', $template ),
					'body'  => 'Oui, le contenu de base sert de repère. Le premier échange permet ensuite d’ajuster le format selon le besoin réel.',
					'label' => $primary,
				),
			);
		}

		return array(
			array(
				'title' => gusy_base_text( 'faqTiming', $template ),
				'body'  => trim( 'Opening hours are shown on the page. For urgent requests, use the phone number ' . $phone . ' or email ' . $email . '.' ),
				'label' => $hours,
			),
			array(
				'title' => gusy_base_text( 'faqPrepare', $template ),
				'body'  => 'Share the option you are interested in, preferred date or timing, budget if useful, and any detail that helps answer precisely.',
				'label' => (string) ( $template['offersTitle'] ?? '' ),
			),
			array(
				'title' => gusy_base_text( 'faqAdapt', $template ),
				'body'  => 'Yes. The standard offer gives a clear reference point, then the first exchange adapts the format to the real need.',
				'label' => $primary,
			),
		);
	}

	/**
	 * Return three domain-specific reviews for one template.
	 *
	 * @param array<string,mixed> $template Template data.
	 * @return array<int,array<string,string>>
	 */
	function gusy_base_template_reviews( array $template ): array {
		$slug = (string) ( $template['slug'] ?? '' );

		if ( 'en' === gusy_base_template_language( $template ) ) {
			$reviews = array(
			'boutique-luxe' => array(
				array( 'quote' => 'I found the gift in five minutes: photos, prices and store pickup were clear.', 'person' => 'Claire M.', 'role' => 'regular customer' ),
				array( 'quote' => 'The product cards give enough detail to choose without calling, while keeping the shop feeling.', 'person' => 'Antoine R.', 'role' => 'gift purchase' ),
				array( 'quote' => 'Click and collect is visible, reassuring, and the selection makes you want to see what is new.', 'person' => 'Sofia L.', 'role' => 'neighborhood customer' ),
			),
			'atelier-artisan' => array(
				array( 'quote' => 'The page explains the steps, materials and timelines. We arrived at the appointment with a clear brief.', 'person' => 'Helene R.', 'role' => 'custom bookcase' ),
				array( 'quote' => 'Seeing the work in large photos changes everything: you understand the finish level before asking for a quote.', 'person' => 'Paul D.', 'role' => 'family table' ),
				array( 'quote' => 'The form prepares the right dimensions and photos. The first exchange is much more concrete.', 'person' => 'Nora B.', 'role' => 'furniture renovation' ),
			),
			'independant-conseil' => array(
				array( 'quote' => 'The offers are easy to compare. I understood which support to choose before the first call.', 'person' => 'Laurent P.', 'role' => 'SMB owner' ),
				array( 'quote' => 'The method and deliverables are visible. It gives confidence to discuss budget and goals.', 'person' => 'Nadia R.', 'role' => 'agency founder' ),
				array( 'quote' => 'The diagnostic feels serious without being heavy. You know what to prepare and what you will receive.', 'person' => 'Marc C.', 'role' => 'independent consultant' ),
			),
			'salon-beaute' => array(
				array( 'quote' => 'I saw the durations, prices and salon atmosphere before booking. That is exactly what customers need.', 'person' => 'Camille P.', 'role' => 'facial treatment' ),
				array( 'quote' => 'The photos are attractive and the rituals are clearly explained. Booking becomes simple.', 'person' => 'Nicolas V.', 'role' => 'body ritual' ),
				array( 'quote' => 'You understand the difference between diagnostic, treatment and program. I arrived reassured.', 'person' => 'Marine T.', 'role' => 'new customer' ),
			),
			'restaurant-table' => array(
				array( 'quote' => 'The menu, hours and atmosphere are in one place. I booked without looking anywhere else.', 'person' => 'Sarah N.', 'role' => 'evening booking' ),
				array( 'quote' => 'The dining room and dish photos give a real sense of the restaurant before dinner.', 'person' => 'Julien S.', 'role' => 'client lunch' ),
				array( 'quote' => 'For a private event, the information is precise enough to send a serious request.', 'person' => 'Laura M.', 'role' => 'team event' ),
			),
			'fleuriste-poetique' => array(
				array( 'quote' => 'I ordered in two minutes and the bouquet really matched the style shown in the photos.', 'person' => 'Elodie B.', 'role' => 'birthday order' ),
				array( 'quote' => 'Budgets and occasions are clear. You know what to choose depending on the message to send.', 'person' => 'Hugo A.', 'role' => 'Paris delivery' ),
				array( 'quote' => 'For our wedding, the visual examples helped us make a precise request.', 'person' => 'Clara B.', 'role' => 'floral decor' ),
			),
			'coach-wellness' => array(
				array( 'quote' => 'I understood the framework, duration and price before the call. It removes a lot of hesitation.', 'person' => 'Manon L.', 'role' => '6-week program' ),
				array( 'quote' => 'The page explains the process without vague promises. You know whether the support fits.', 'person' => 'David R.', 'role' => 'individual session' ),
				array( 'quote' => 'Remote and group formats are clear. I booked the right slot on the first visit.', 'person' => 'Anais G.', 'role' => 'group workshop' ),
			),
			'architecte-interieur' => array(
				array( 'quote' => 'Images, steps and packages help prepare a realistic request from the start.', 'person' => 'Karim B.', 'role' => 'apartment renovation' ),
				array( 'quote' => 'You see the studio style and understand how the project moves from sketch to site work.', 'person' => 'Sophie D.', 'role' => 'family home' ),
				array( 'quote' => 'The material board and examples provide useful context before the first appointment.', 'person' => 'Marc P.', 'role' => 'living room layout' ),
			),
			'marche-local' => array(
				array( 'quote' => 'I check the baskets in the morning and pick up after work. Everything is clear.', 'person' => 'Amandine F.', 'role' => 'weekly basket' ),
				array( 'quote' => 'Arrivals, hours and baskets are visible. I know exactly when to order.', 'person' => 'Thomas V.', 'role' => 'neighborhood customer' ),
				array( 'quote' => 'Local products are well presented and prices remain easy to read on mobile.', 'person' => 'Claudine C.', 'role' => 'family shopping' ),
			),
			'studio-createur' => array(
				array( 'quote' => 'The page immediately shows the visual level and the information needed to book a shoot.', 'person' => 'Lina C.', 'role' => 'brand founder' ),
				array( 'quote' => 'The packages are concrete: duration, deliverables and usage. You know what you are buying.', 'person' => 'Adrien T.', 'role' => 'brand campaign' ),
				array( 'quote' => 'The portfolio and brief make the request simpler, especially for a campaign that needs to launch quickly.', 'person' => 'Melissa J.', 'role' => 'e-commerce photos' ),
			),
		);

		return $reviews[ $slug ] ?? array(
			array( 'quote' => (string) $template['review'], 'person' => (string) $template['reviewer'], 'role' => 'customer' ),
			array( 'quote' => 'The important information is visible from the first read.', 'person' => 'Verified customer', 'role' => 'recent request' ),
			array( 'quote' => 'The page makes you want to contact the business with a precise request already prepared.', 'person' => 'Local customer', 'role' => 'first contact' ),
		);
	}

		$reviews = array(
		'boutique-luxe' => array(
			array( 'quote' => 'J’ai trouvé le cadeau en cinq minutes: les photos, les prix et le retrait boutique étaient clairs.', 'person' => 'Claire M.', 'role' => 'cliente régulière' ),
			array( 'quote' => 'Les fiches donnent assez de détails pour choisir sans appeler, tout en gardant l’esprit de la boutique.', 'person' => 'Antoine R.', 'role' => 'achat cadeau' ),
			array( 'quote' => 'Le click & collect est visible, rassurant, et la sélection donne envie de passer voir les nouveautés.', 'person' => 'Sofia L.', 'role' => 'cliente quartier' ),
		),
		'atelier-artisan' => array(
			array( 'quote' => 'La page explique les étapes, les matières et les délais. On arrive au rendez-vous avec un brief clair.', 'person' => 'Hélène R.', 'role' => 'bibliothèque sur mesure' ),
			array( 'quote' => 'Voir les réalisations en grand change tout: on comprend le niveau de finition avant de demander un devis.', 'person' => 'Paul D.', 'role' => 'table familiale' ),
			array( 'quote' => 'Le formulaire prépare les bonnes dimensions et photos. Le premier échange est plus concret.', 'person' => 'Nora B.', 'role' => 'rénovation meuble' ),
		),
		'independant-conseil' => array(
			array( 'quote' => 'Les offres sont faciles à comparer. J’ai compris quel accompagnement choisir avant le premier appel.', 'person' => 'Laurent P.', 'role' => 'dirigeant PME' ),
			array( 'quote' => 'La méthode est visible, avec les livrables. Ça donne confiance pour parler budget et objectifs.', 'person' => 'Nadia R.', 'role' => 'fondatrice d’agence' ),
			array( 'quote' => 'Le diagnostic paraît sérieux sans être lourd. On sait quoi préparer et ce qu’on va recevoir.', 'person' => 'Marc C.', 'role' => 'indépendant accompagné' ),
		),
		'salon-beaute' => array(
			array( 'quote' => 'J’ai vu les durées, les prix et l’ambiance du salon avant de réserver. C’est exactement ce qu’il faut.', 'person' => 'Camille P.', 'role' => 'soin visage' ),
			array( 'quote' => 'Les photos donnent envie et les rituels sont bien expliqués. La réservation devient simple.', 'person' => 'Nicolas V.', 'role' => 'rituel corps' ),
			array( 'quote' => 'On comprend la différence entre diagnostic, soin et programme. Je suis arrivée rassurée.', 'person' => 'Marine T.', 'role' => 'nouvelle cliente' ),
		),
		'restaurant-table' => array(
			array( 'quote' => 'La carte, les horaires et l’ambiance sont au même endroit. J’ai réservé sans chercher ailleurs.', 'person' => 'Sarah N.', 'role' => 'réservation soir' ),
			array( 'quote' => 'Les photos de salle et de plats donnent une vraie idée du restaurant avant le dîner.', 'person' => 'Julien S.', 'role' => 'déjeuner client' ),
			array( 'quote' => 'Pour une privatisation, les informations sont assez précises pour envoyer une demande sérieuse.', 'person' => 'Laura M.', 'role' => 'événement équipe' ),
		),
		'fleuriste-poetique' => array(
			array( 'quote' => 'J’ai commandé en deux minutes et le bouquet ressemblait vraiment au style montré en photo.', 'person' => 'Élodie B.', 'role' => 'anniversaire' ),
			array( 'quote' => 'Les budgets et les occasions sont clairs. On sait quoi choisir selon le message à envoyer.', 'person' => 'Hugo A.', 'role' => 'livraison Paris' ),
			array( 'quote' => 'Pour notre mariage, les exemples visuels nous ont aidés à formuler une demande précise.', 'person' => 'Clara B.', 'role' => 'décor floral' ),
		),
		'coach-wellness' => array(
			array( 'quote' => 'J’ai compris le cadre, la durée et le prix avant l’appel. Ça enlève beaucoup d’hésitation.', 'person' => 'Manon L.', 'role' => 'programme 6 semaines' ),
			array( 'quote' => 'La page explique le déroulé sans promesses floues. On sait si l’accompagnement est adapté.', 'person' => 'David R.', 'role' => 'séance individuelle' ),
			array( 'quote' => 'Les formats en visio et en groupe sont clairs. J’ai réservé le bon créneau dès la première visite.', 'person' => 'Anaïs G.', 'role' => 'atelier collectif' ),
		),
		'architecte-interieur' => array(
			array( 'quote' => 'Les images, les étapes et les forfaits aident à préparer une demande réaliste dès le départ.', 'person' => 'Karim B.', 'role' => 'rénovation appartement' ),
			array( 'quote' => 'On voit le style du studio et on comprend comment le projet va avancer, de l’esquisse au chantier.', 'person' => 'Sophie D.', 'role' => 'maison familiale' ),
			array( 'quote' => 'Le carnet matières et les exemples donnent de la matière avant même le premier rendez-vous.', 'person' => 'Marc P.', 'role' => 'agencement salon' ),
		),
		'marche-local' => array(
			array( 'quote' => 'Je regarde les paniers le matin et je passe récupérer en sortant du travail. Tout est clair.', 'person' => 'Amandine F.', 'role' => 'panier hebdo' ),
			array( 'quote' => 'Les arrivages, les horaires et les paniers sont visibles. Je sais exactement quand commander.', 'person' => 'Thomas V.', 'role' => 'client du quartier' ),
			array( 'quote' => 'Les produits locaux sont bien présentés et les prix restent faciles à lire sur mobile.', 'person' => 'Claudine C.', 'role' => 'courses famille' ),
		),
		'studio-createur' => array(
			array( 'quote' => 'La page donne tout de suite le niveau visuel et les infos pour réserver un shooting.', 'person' => 'Lina C.', 'role' => 'fondatrice de marque' ),
			array( 'quote' => 'Les packs sont concrets: durée, livrables, usages. On sait ce qu’on achète.', 'person' => 'Adrien T.', 'role' => 'campagne marque' ),
			array( 'quote' => 'Le portfolio et le brief rendent la demande plus simple, surtout pour une campagne à lancer vite.', 'person' => 'Mélissa J.', 'role' => 'photos e-commerce' ),
		),
	);

	return $reviews[ $slug ] ?? array(
		array( 'quote' => (string) $template['review'], 'person' => (string) $template['reviewer'], 'role' => 'client' ),
		array( 'quote' => 'Les informations importantes sont visibles dès la première lecture.', 'person' => 'Client vérifié', 'role' => 'demande récente' ),
		array( 'quote' => 'La page donne envie de contacter avec une demande déjà précise.', 'person' => 'Client local', 'role' => 'prise de contact' ),
	);
}

/**
 * Render one complete Gusy template pattern.
 *
 * @param array<string,mixed> $template Template data.
 * @return string
 */
function gusy_base_render_template_pattern( array $template ): string {
	$slug       = sanitize_html_class( (string) $template['slug'] );
	$class_name = 'gusy-theme gusy-theme--' . sanitize_html_class( (string) $template['class'] );
	$hero_url   = gusy_base_image_url( $slug . '-hero.jpg' );
	$offer_url  = gusy_base_image_url( $slug . '-offer.jpg' );
	$detail_url = gusy_base_image_url( $slug . '-detail.jpg' );
	$section_copy = gusy_base_template_section_copy( $template );
	$offer_images = array( $offer_url, $detail_url, $hero_url );
	$review_images = array(
		gusy_base_image_url( $slug . '-testimonial-1.jpg' ),
		gusy_base_image_url( $slug . '-testimonial-2.jpg' ),
		gusy_base_image_url( $slug . '-testimonial-3.jpg' ),
	);

	$proof = '';
	foreach ( $template['proof'] as $proof_item ) {
		$proof .= '<article><strong>' . esc_html( $proof_item['value'] ) . '</strong><span>' . esc_html( $proof_item['label'] ) . '</span></article>';
	}

	$offers = '';
	foreach ( $template['offers'] as $index => $offer ) {
		$offer_image = $offer_images[ $index % count( $offer_images ) ];
		$offers     .= '<article class="gusy-offer-card">'
			. '<img src="' . esc_url( $offer_image ) . '" alt="' . esc_attr( $offer['title'] ) . '" loading="lazy">'
			. '<div>'
			. '<span>' . esc_html( $offer['meta'] ) . '</span>'
			. '<h3>' . esc_html( $offer['title'] ) . '</h3>'
			. '<p>' . esc_html( $offer['body'] ) . '</p>'
			. '<strong>' . esc_html( $offer['price'] ) . '</strong>'
			. '</div>'
			. '</article>';
	}

	$detail_list = '';
	foreach ( $template['detailList'] as $item ) {
		$detail_list .= '<li>' . esc_html( $item ) . '</li>';
	}

	$steps = '';
	foreach ( $template['process'] as $index => $step ) {
		$steps .= '<article><span>' . esc_html( '0' . ( $index + 1 ) ) . '</span><strong>' . esc_html( $step ) . '</strong></article>';
	}

	$reviews = '';
		foreach ( gusy_base_template_reviews( $template ) as $index => $review ) {
			$review_image = $review_images[ $index % count( $review_images ) ];
			$reviews     .= '<article class="gusy-review-card">'
			. '<img src="' . esc_url( $review_image ) . '" alt="' . esc_attr( $review['person'] ) . '" loading="lazy">'
			. '<div>'
			. '<blockquote>“' . esc_html( $review['quote'] ) . '”</blockquote>'
			. '<cite><strong>' . esc_html( $review['person'] ) . '</strong><span>' . esc_html( $review['role'] ) . '</span></cite>'
			. '</div>'
				. '</article>';
		}

		$faqs = '';
		foreach ( gusy_base_template_faq_items( $template ) as $faq ) {
			$faqs .= '<details class="gusy-faq-item">'
				. '<summary><span>' . esc_html( $faq['title'] ) . '</span><small>' . esc_html( $faq['label'] ) . '</small></summary>'
				. '<p>' . esc_html( $faq['body'] ) . '</p>'
				. '</details>';
		}

		return '<!-- wp:group {"align":"full","className":"' . esc_attr( $class_name ) . '","layout":{"type":"default"}} -->'
		. '<div class="wp-block-group alignfull ' . esc_attr( $class_name ) . '">'
		. '<div class="gusy-shell">'
		. gusy_base_render_template_nav( $template, 'home' )
		. '<main>'
		. '<section class="gusy-hero">'
		. '<div class="gusy-hero-copy">'
		. '<span class="gusy-eyebrow">' . esc_html( $template['location'] ) . '</span>'
		. '<h1>' . esc_html( $template['title'] ) . '</h1>'
		. '<p>' . esc_html( $template['body'] ) . '</p>'
		. '<div class="gusy-actions">'
		. '<a class="gusy-button" href="' . esc_url( gusy_base_template_page_url( $template, 'contact' ) ) . '">' . esc_html( $template['primary'] ) . '</a>'
		. '<a class="gusy-button gusy-button--light" href="' . esc_url( gusy_base_template_page_url( $template, gusy_base_secondary_slug_suffix( $template, 'offers' ) ) ) . '">' . esc_html( $template['secondary'] ) . '</a>'
		. '</div>'
		. '<small>' . esc_html( $template['badge'] ) . '</small>'
		. '</div>'
		. '<figure class="gusy-hero-media">'
		. '<img src="' . esc_url( $hero_url ) . '" alt="' . esc_attr( $template['brand'] ) . '" loading="eager">'
		. '<figcaption><strong>' . esc_html( $template['brand'] ) . '</strong><span>' . esc_html( $template['contact']['hours'] ) . '</span></figcaption>'
		. '</figure>'
		. '</section>'
		. '<section class="gusy-proof" aria-label="' . esc_attr( gusy_base_text( 'quickProof', $template ) ) . '">' . $proof . '</section>'
		. '<section id="offres" class="gusy-section">'
		. '<div class="gusy-section-head">'
		. '<span class="gusy-eyebrow">' . esc_html( $section_copy['offersEyebrow'] ) . '</span>'
		. '<h2>' . esc_html( $template['offersTitle'] ) . '</h2>'
		. '<p class="gusy-section-intro">' . esc_html( $template['offersIntro'] ) . '</p>'
		. '</div>'
		. '<div class="gusy-offer-grid">' . $offers . '</div>'
		. '</section>'
		. '<section class="gusy-detail-band">'
		. '<figure><img src="' . esc_url( $detail_url ) . '" alt="" loading="lazy"></figure>'
		. '<div>'
		. '<span class="gusy-eyebrow">' . esc_html( $section_copy['detailEyebrow'] ) . '</span>'
		. '<h2>' . esc_html( $template['detailTitle'] ) . '</h2>'
		. '<p>' . esc_html( $template['detailBody'] ) . '</p>'
		. '<ul>' . $detail_list . '</ul>'
		. '</div>'
		. '</section>'
		. '<section id="methode" class="gusy-process">'
		. '<div>'
		. '<span class="gusy-eyebrow">' . esc_html( gusy_base_text( 'clientPath', $template ) ) . '</span>'
		. '<h2>' . esc_html( $section_copy['processTitle'] ) . '</h2>'
		. '</div>'
		. '<div class="gusy-step-grid">' . $steps . '</div>'
		. '</section>'
		. '<section class="gusy-review">'
		. '<div class="gusy-review-head">'
		. '<span class="gusy-eyebrow">' . esc_html( gusy_base_text( 'reviews', $template ) ) . '</span>'
		. '<h2>' . esc_html( gusy_base_text( 'reviewsTitle', $template ) ) . '</h2>'
		. '</div>'
			. '<div class="gusy-review-grid">' . $reviews . '</div>'
			. '</section>'
			. '<section class="gusy-faq">'
			. '<div class="gusy-faq-head">'
			. '<span class="gusy-eyebrow">' . esc_html( gusy_base_text( 'faqLabel', $template ) ) . '</span>'
			. '<h2>' . esc_html( gusy_base_text( 'faqTitle', $template ) ) . '</h2>'
			. '<p>' . esc_html( gusy_base_text( 'faqBody', $template ) ) . '</p>'
			. '</div>'
			. '<div class="gusy-faq-list">' . $faqs . '</div>'
			. '</section>'
			. '<section id="contact" class="gusy-contact">'
		. '<div>'
		. '<span class="gusy-eyebrow">' . esc_html( gusy_base_text( 'usefulInfo', $template ) ) . '</span>'
		. '<h2>' . esc_html( $section_copy['contactTitle'] ) . '</h2>'
		. '<p>' . esc_html( $section_copy['contactBody'] ) . '</p>'
		. '</div>'
		. '<address>'
		. '<strong>' . esc_html( $template['brand'] ) . '</strong>'
		. '<span>' . esc_html( $template['contact']['address'] ) . '</span>'
		. '<span>' . esc_html( $template['contact']['hours'] ) . '</span>'
		. '<a href="tel:' . esc_attr( preg_replace( '/[^0-9+]/', '', (string) $template['contact']['phone'] ) ) . '">' . esc_html( $template['contact']['phone'] ) . '</a>'
		. '<a href="mailto:' . esc_attr( $template['contact']['email'] ) . '">' . esc_html( $template['contact']['email'] ) . '</a>'
		. '<a class="gusy-button" href="mailto:' . esc_attr( $template['contact']['email'] ) . '">' . esc_html( $template['primary'] ) . '</a>'
		. '</address>'
		. '</section>'
		. '</main>'
		. gusy_base_render_template_footer( $template, 'home' )
		. '</div>'
		. '</div>'
		. '<!-- /wp:group -->';
}

/**
 * Return secondary pages for one business template.
 *
 * @param array<string,mixed> $template Template data.
 * @return array<int,array<string,string>>
 */
function gusy_base_secondary_pages( array $template ): array {
	$section_copy = gusy_base_template_section_copy( $template );
	$is_fr        = 'fr' === gusy_base_template_language( $template );
	$work_copy    = gusy_base_template_work_copy( $template );

	return array(
		array(
			'type'            => 'offers',
			'slug_suffix'     => gusy_base_secondary_slug_suffix( $template, 'offers' ),
			'menu_label'      => gusy_base_text( 'navOffers', $template ),
			'title'           => (string) $template['offersTitle'],
			'intro'           => (string) $template['offersIntro'] . ( $is_fr ? ' Les prix, les formats et la prochaine action restent visibles.' : ' Prices, formats and the next action stay visible.' ),
			'image'           => (string) $template['slug'] . '-offer.jpg',
			'metaDescription' => (string) $template['offersIntro'],
		),
		array(
			'type'            => 'work',
			'slug_suffix'     => gusy_base_secondary_slug_suffix( $template, 'work' ),
			'menu_label'      => $work_copy['label'],
			'title'           => $work_copy['title'],
			'intro'           => (string) $work_copy['intro'],
			'image'           => (string) $template['slug'] . '-detail.jpg',
			'metaDescription' => (string) $template['detailBody'],
		),
		array(
			'type'            => 'about',
			'slug_suffix'     => gusy_base_secondary_slug_suffix( $template, 'about' ),
			'menu_label'      => gusy_base_text( 'navAbout', $template ),
			'title'           => $is_fr ? 'À propos de ' . (string) $template['brand'] . '.' : 'About ' . (string) $template['brand'] . '.',
			'intro'           => (string) $template['body'] . ( $is_fr ? ' Le lieu, la méthode et les preuves sont réunis pour prendre contact avec confiance.' : ' The place, method and proof are gathered to make contact easier.' ),
			'image'           => (string) $template['slug'] . '-hero.jpg',
			'metaDescription' => (string) $template['body'],
		),
		array(
			'type'            => 'contact',
			'slug_suffix'     => gusy_base_secondary_slug_suffix( $template, 'contact' ),
			'menu_label'      => gusy_base_text( 'navContact', $template ),
			'title'           => $is_fr ? 'Contact et horaires.' : 'Contact and hours.',
			'intro'           => (string) $section_copy['contactBody'],
			'image'           => (string) $template['slug'] . '-hero.jpg',
			'metaDescription' => (string) $section_copy['contactBody'],
		),
	);
}

/**
 * Return one secondary page definition.
 *
 * @param array<string,mixed> $template Template data.
 * @param string             $type Page type.
 * @return array<string,string>
 */
function gusy_base_secondary_page( array $template, string $type ): array {
	foreach ( gusy_base_secondary_pages( $template ) as $page ) {
		if ( $type === $page['type'] ) {
			return $page;
		}
	}

	$pages = gusy_base_secondary_pages( $template );

	return $pages[0];
}

/**
 * Render the four proof cells reused by secondary pages.
 *
 * @param array<string,mixed> $template Template data.
 * @return string
 */
function gusy_base_render_proof_cells( array $template ): string {
	$proof = '';
	foreach ( $template['proof'] as $proof_item ) {
		$proof .= '<article><strong>' . esc_html( $proof_item['value'] ) . '</strong><span>' . esc_html( $proof_item['label'] ) . '</span></article>';
	}

	return $proof;
}

/**
 * Render review cards with portrait photos.
 *
 * @param array<string,mixed> $template Template data.
 * @return string
 */
function gusy_base_render_review_cards( array $template ): string {
	$slug          = sanitize_title( (string) $template['slug'] );
	$review_images = array(
		gusy_base_image_url( $slug . '-testimonial-1.jpg' ),
		gusy_base_image_url( $slug . '-testimonial-2.jpg' ),
		gusy_base_image_url( $slug . '-testimonial-3.jpg' ),
	);
	$cards = '';

	foreach ( gusy_base_template_reviews( $template ) as $index => $review ) {
		$cards .= '<article class="gusy-review-card">'
			. '<img src="' . esc_url( $review_images[ $index % count( $review_images ) ] ) . '" alt="' . esc_attr( $review['person'] ) . '" loading="lazy">'
			. '<div>'
			. '<blockquote>“' . esc_html( $review['quote'] ) . '”</blockquote>'
			. '<cite><strong>' . esc_html( $review['person'] ) . '</strong><span>' . esc_html( $review['role'] ) . '</span></cite>'
			. '</div>'
			. '</article>';
	}

	return $cards;
}

/**
 * Render the common secondary-page hero.
 *
 * @param array<string,mixed>  $template Template data.
 * @param array<string,string> $page Secondary page definition.
 * @return string
 */
function gusy_base_render_secondary_hero( array $template, array $page ): string {
	return '<section class="gusy-secondary-hero">'
		. '<div class="gusy-secondary-hero-copy">'
		. '<h1>' . esc_html( $page['title'] ) . '</h1>'
		. '<p>' . esc_html( $page['intro'] ) . '</p>'
		. '<div class="gusy-actions">'
		. '<a class="gusy-button" href="' . esc_url( gusy_base_template_page_url( $template, 'contact' ) ) . '">' . esc_html( $template['primary'] ) . '</a>'
		. '<a class="gusy-button gusy-button--light" href="' . esc_url( gusy_base_template_page_url( $template ) ) . '">' . esc_html( gusy_base_text( 'backHome', $template ) ) . '</a>'
		. '</div>'
		. '</div>'
		. '<figure class="gusy-secondary-hero-media">'
		. '<img src="' . esc_url( gusy_base_image_url( $page['image'] ) ) . '" alt="' . esc_attr( $page['title'] ) . '" loading="eager">'
		. '</figure>'
		. '</section>';
}

/**
 * Render the secondary offers page body.
 *
 * @param array<string,mixed> $template Template data.
 * @return string
 */
function gusy_base_render_secondary_offers( array $template ): string {
	$slug   = sanitize_title( (string) $template['slug'] );
	$images = array(
		gusy_base_image_url( $slug . '-offer.jpg' ),
		gusy_base_image_url( $slug . '-detail.jpg' ),
		gusy_base_image_url( $slug . '-hero.jpg' ),
	);
	$cards  = '';

	foreach ( $template['offers'] as $index => $offer ) {
		$cards .= '<article class="gusy-secondary-card">'
			. '<img src="' . esc_url( $images[ $index % count( $images ) ] ) . '" alt="' . esc_attr( $offer['title'] ) . '" loading="lazy">'
			. '<div>'
			. '<h2>' . esc_html( $offer['title'] ) . '</h2>'
			. '<p>' . esc_html( $offer['body'] ) . '</p>'
			. '<strong>' . esc_html( $offer['price'] ) . '</strong>'
			. '<a class="gusy-button gusy-button--light" href="' . esc_url( gusy_base_template_page_url( $template, 'contact' ) ) . '">' . esc_html( $template['primary'] ) . '</a>'
			. '</div>'
			. '</article>';
	}

	return '<section class="gusy-secondary-section">'
		. '<div class="gusy-secondary-section-head">'
		. '<h2>' . esc_html( gusy_base_text( 'compareTitle', $template ) ) . '</h2>'
		. '<p>' . esc_html( gusy_base_text( 'compareBody', $template ) ) . '</p>'
		. '</div>'
		. '<div class="gusy-secondary-card-grid">' . $cards . '</div>'
		. '</section>';
}

/**
 * Render the secondary portfolio page body.
 *
 * @param array<string,mixed> $template Template data.
 * @return string
 */
function gusy_base_render_secondary_realisations( array $template ): string {
	$slug        = sanitize_title( (string) $template['slug'] );
	$images      = array(
		gusy_base_image_url( $slug . '-detail.jpg' ),
		gusy_base_image_url( $slug . '-offer.jpg' ),
		gusy_base_image_url( $slug . '-hero.jpg' ),
	);
	$gallery     = '';
	$detail_list = '';

	foreach ( $template['offers'] as $index => $offer ) {
		$gallery .= '<article class="gusy-gallery-card">'
			. '<img src="' . esc_url( $images[ $index % count( $images ) ] ) . '" alt="' . esc_attr( $offer['title'] ) . '" loading="lazy">'
			. '<div>'
			. '<h2>' . esc_html( $offer['title'] ) . '</h2>'
			. '<p>' . esc_html( $offer['body'] ) . '</p>'
			. '</div>'
			. '</article>';
	}

	foreach ( $template['detailList'] as $item ) {
		$detail_list .= '<li>' . esc_html( $item ) . '</li>';
	}

	return '<section class="gusy-secondary-section">'
		. '<div class="gusy-secondary-gallery">' . $gallery . '</div>'
		. '</section>'
		. '<section class="gusy-secondary-split">'
		. '<figure><img src="' . esc_url( gusy_base_image_url( $slug . '-offer.jpg' ) ) . '" alt="' . esc_attr( $template['detailTitle'] ) . '" loading="lazy"></figure>'
		. '<div>'
		. '<h2>' . esc_html( $template['detailTitle'] ) . '</h2>'
		. '<p>' . esc_html( $template['detailBody'] ) . '</p>'
		. '<ul>' . $detail_list . '</ul>'
		. '</div>'
		. '</section>';
}

/**
 * Render the secondary about page body.
 *
 * @param array<string,mixed> $template Template data.
 * @return string
 */
function gusy_base_render_secondary_about( array $template ): string {
	$slug        = sanitize_title( (string) $template['slug'] );
	$detail_list = '';

	foreach ( $template['detailList'] as $item ) {
		$detail_list .= '<li>' . esc_html( $item ) . '</li>';
	}

	return '<section class="gusy-proof gusy-secondary-proof" aria-label="' . esc_attr( gusy_base_text( 'quickProof', $template ) ) . '">' . gusy_base_render_proof_cells( $template ) . '</section>'
		. '<section class="gusy-secondary-split">'
		. '<figure><img src="' . esc_url( gusy_base_image_url( $slug . '-detail.jpg' ) ) . '" alt="' . esc_attr( $template['brand'] ) . '" loading="lazy"></figure>'
		. '<div>'
		. '<h2>' . esc_html( gusy_base_text( 'methodTitle', $template ) ) . '</h2>'
		. '<p>' . esc_html( $template['detailBody'] ) . '</p>'
		. '<ul>' . $detail_list . '</ul>'
		. '</div>'
		. '</section>'
		. '<section class="gusy-review gusy-secondary-review">'
		. '<div class="gusy-review-head"><h2>' . esc_html( gusy_base_text( 'aboutReviews', $template ) ) . '</h2></div>'
		. '<div class="gusy-review-grid">' . gusy_base_render_review_cards( $template ) . '</div>'
		. '</section>';
}

/**
 * Render the secondary contact page body.
 *
 * @param array<string,mixed> $template Template data.
 * @return string
 */
function gusy_base_render_secondary_contact( array $template ): string {
	$slug       = sanitize_title( (string) $template['slug'] );
	$contact    = $template['contact'];
	$tel        = preg_replace( '/[^0-9+]/', '', (string) $contact['phone'] );
	$mailto     = 'mailto:' . (string) $contact['email'];
	$visuals    = '';
	$visual_map = array(
		array( $slug . '-hero.jpg', (string) $template['brand'] ),
		array( $slug . '-offer.jpg', (string) $template['offersTitle'] ),
		array( $slug . '-detail.jpg', (string) $template['detailTitle'] ),
	);

	foreach ( $visual_map as $visual ) {
		$visuals .= '<figure><img src="' . esc_url( gusy_base_image_url( $visual[0] ) ) . '" alt="' . esc_attr( $visual[1] ) . '" loading="lazy"><figcaption>' . esc_html( $visual[1] ) . '</figcaption></figure>';
	}

	$prep = '<article><h2>' . esc_html( gusy_base_text( 'yourRequest', $template ) ) . '</h2><p>' . esc_html( $template['offers'][0]['body'] ) . '</p></article>'
		. '<article><h2>' . esc_html( gusy_base_text( 'rightTiming', $template ) ) . '</h2><p>' . esc_html( $contact['hours'] ) . ' - ' . esc_html( $template['badge'] ) . '</p></article>'
		. '<article><h2>' . esc_html( gusy_base_text( 'usefulDetails', $template ) ) . '</h2><p>' . esc_html( $contact['address'] ) . ' - ' . esc_html( $template['body'] ) . '</p></article>';

	return '<section class="gusy-secondary-contact-grid">'
		. '<form class="gusy-contact-form" action="' . esc_url( $mailto ) . '" method="post" enctype="text/plain">'
		. '<h2>' . esc_html( gusy_base_text( 'requestTitle', $template ) ) . '</h2>'
		. '<label><span>' . esc_html( gusy_base_text( 'name', $template ) ) . '</span><input name="name" type="text" autocomplete="name"></label>'
		. '<label><span>' . esc_html( gusy_base_text( 'email', $template ) ) . '</span><input name="email" type="email" autocomplete="email"></label>'
		. '<label><span>' . esc_html( gusy_base_text( 'need', $template ) ) . '</span><textarea name="message" rows="6"></textarea></label>'
		. '<button class="gusy-button" type="submit">' . esc_html( gusy_base_text( 'send', $template ) ) . '</button>'
		. '</form>'
		. '<address>'
		. '<h2>' . esc_html( gusy_base_text( 'directInfo', $template ) ) . '</h2>'
		. '<strong>' . esc_html( $template['brand'] ) . '</strong>'
		. '<span>' . esc_html( $contact['address'] ) . '</span>'
		. '<span>' . esc_html( $contact['hours'] ) . '</span>'
		. '<a href="tel:' . esc_attr( $tel ) . '">' . esc_html( $contact['phone'] ) . '</a>'
		. '<a href="' . esc_url( $mailto ) . '">' . esc_html( $contact['email'] ) . '</a>'
		. '</address>'
		. '</section>'
		. '<section class="gusy-contact-prep">'
		. '<div class="gusy-secondary-section-head"><h2>' . esc_html( gusy_base_text( 'prepareTitle', $template ) ) . '</h2><p>' . esc_html( gusy_base_text( 'prepareBody', $template ) ) . '</p></div>'
		. '<div class="gusy-contact-prep-grid">' . $prep . '</div>'
		. '</section>'
		. '<section class="gusy-secondary-visuals" aria-label="' . esc_attr( gusy_base_text( 'imagesLabel', $template ) ) . '">' . $visuals . '</section>';
}

/**
 * Render one complete secondary page.
 *
 * @param array<string,mixed> $template Template data.
 * @param string             $type Secondary page type.
 * @return string
 */
function gusy_base_render_secondary_page( array $template, string $type ): string {
	$page       = gusy_base_secondary_page( $template, $type );
	$class_name = 'gusy-theme gusy-theme--' . sanitize_html_class( (string) $template['class'] ) . ' gusy-secondary gusy-secondary--' . sanitize_html_class( $page['type'] );
	$body       = '';

	switch ( $page['type'] ) {
		case 'work':
			$body = gusy_base_render_secondary_realisations( $template );
			break;
		case 'about':
			$body = gusy_base_render_secondary_about( $template );
			break;
		case 'contact':
			$body = gusy_base_render_secondary_contact( $template );
			break;
		case 'offers':
		default:
			$body = gusy_base_render_secondary_offers( $template );
			break;
	}

	return '<!-- wp:group {"align":"full","className":"' . esc_attr( $class_name ) . '","layout":{"type":"default"}} -->'
		. '<div class="wp-block-group alignfull ' . esc_attr( $class_name ) . '">'
		. '<div class="gusy-shell">'
		. gusy_base_render_template_nav( $template, $page['type'] )
		. '<main>'
		. gusy_base_render_secondary_hero( $template, $page )
		. $body
		. '</main>'
		. gusy_base_render_template_footer( $template, $page['type'] )
		. '</div>'
		. '</div>'
		. '<!-- /wp:group -->';
}

/**
 * Create a Gusy editor blueprint for secondary pages.
 *
 * @param array<string,mixed>  $template Template data.
 * @param array<string,string> $page Secondary page definition.
 * @return array<string,mixed>
 */
function gusy_base_secondary_page_blueprint( array $template, array $page ): array {
	$tokens        = gusy_base_template_design_tokens( $template );
	$items         = array();
	$template_slug = (string) $template['slug'];
	$page_image    = isset( $page['image'] ) ? (string) $page['image'] : $template_slug . '-hero.jpg';
	$offer_images  = array(
		$template_slug . '-offer.jpg',
		$template_slug . '-detail.jpg',
		$template_slug . '-hero.jpg',
	);

	if ( 'contact' === $page['type'] ) {
		$items = array(
			array( 'title' => (string) $template['contact']['address'], 'body' => (string) $template['contact']['hours'], 'label' => gusy_base_text( 'address', $template ), 'image' => gusy_base_blueprint_image( $template_slug . '-detail.jpg', (string) $template['brand'] ) ),
			array( 'title' => (string) $template['contact']['phone'], 'body' => (string) $template['contact']['email'], 'label' => gusy_base_text( 'navContact', $template ), 'image' => gusy_base_blueprint_image( $template_slug . '-offer.jpg', (string) $template['brand'] ) ),
		);
	} else {
		foreach ( $template['offers'] as $index => $offer ) {
			$items[] = array(
				'title' => (string) $offer['title'],
				'body'  => (string) $offer['body'],
				'label' => (string) $offer['price'],
				'image' => gusy_base_blueprint_image( $offer_images[ $index % count( $offer_images ) ], (string) $offer['title'] ),
			);
		}
	}

	return array(
		'schemaVersion' => '1.0',
		'page'          => array(
			'title'        => (string) $page['title'],
			'slug'         => gusy_base_template_page_slug( $template, (string) $page['slug_suffix'] ),
			'language'     => gusy_base_template_language( $template ),
			'seo'          => array(
				'metaTitle'       => (string) $page['title'] . ' - ' . (string) $template['brand'],
				'metaDescription' => (string) $page['metaDescription'],
			),
			'designSystem' => $tokens,
			'sections'     => array(
				array(
					'id'       => 'navigation',
					'type'     => 'header',
					'variant'  => 'commerce',
					'label'    => 'Navigation',
					'kicker'   => '',
					'title'    => (string) $template['brand'],
					'body'     => (string) $template['location'],
					'cta'      => array(
						'label' => (string) $template['primary'],
						'url'   => gusy_base_template_page_url( $template, 'contact' ),
					),
					'items'    => array_map(
						static function ( array $link ): array {
							return array(
								'title' => $link['label'],
								'body'  => $link['url'],
								'label' => '',
							);
						},
						gusy_base_template_nav_links( $template )
					),
					'settings' => array( 'background' => 'plain', 'spacing' => 'sm', 'columns' => 5, 'mobileStack' => true ),
				),
				array(
					'id'       => 'hero',
					'type'     => 'hero',
					'variant'  => 'secondary',
					'label'    => 'Page',
					'kicker'   => '',
					'title'    => (string) $page['title'],
					'body'     => (string) $page['intro'],
					'cta'      => array(
						'label'          => (string) $template['primary'],
						'url'            => gusy_base_template_page_url( $template, 'contact' ),
						'secondaryLabel' => gusy_base_text( 'navHome', $template ),
						'secondaryUrl'   => gusy_base_template_page_url( $template ),
						),
						'items'    => $items,
						'settings' => array( 'background' => 'hero', 'spacing' => 'lg', 'columns' => 2, 'backgroundImage' => gusy_base_blueprint_image( $page_image, (string) $page['title'] ), 'mobileStack' => true ),
					),
			),
		),
	);
}

/**
 * Return the Gusy editor admin URL for a page.
 *
 * @param int $post_id Page ID.
 * @return string
 */
function gusy_base_gusy_editor_url( int $post_id ): string {
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
 * Check whether the Gusy builder plugin is available.
 *
 * @return bool
 */
function gusy_base_has_gusy_editor(): bool {
	return defined( 'GUSY_AI_BUILDER_VERSION' ) || class_exists( 'Gusy_AI_Builder_Plugin' );
}

/**
 * Detect pages owned by the Gusy Base theme.
 *
 * @param int $post_id Page ID.
 * @return bool
 */
function gusy_base_is_gusy_page( int $post_id ): bool {
	$post = get_post( $post_id );
	if ( ! $post instanceof WP_Post || 'page' !== $post->post_type ) {
		return false;
	}

	if ( '1' === (string) get_post_meta( $post_id, '_gusy_edit_with_gusy', true ) ) {
		return true;
	}

	$page_template = (string) get_post_meta( $post_id, '_wp_page_template', true );
	if ( 0 === strpos( $page_template, 'page-gusy-' ) ) {
		return true;
	}

	return false !== strpos( (string) $post->post_content, 'gusy-theme--' );
}

/**
 * Send WordPress edit links for Gusy pages to the Gusy editor.
 *
 * @param string $link Existing edit link.
 * @param int    $post_id Post ID.
 * @param string $context Link context.
 * @return string
 */
function gusy_base_filter_edit_post_link( string $link, int $post_id, string $context ): string {
	if ( ! gusy_base_has_gusy_editor() || ! gusy_base_is_gusy_page( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return $link;
	}

	$gusy_url = gusy_base_gusy_editor_url( $post_id );

	return 'display' === $context ? esc_url( $gusy_url ) : $gusy_url;
}
add_filter( 'get_edit_post_link', 'gusy_base_filter_edit_post_link', 20, 3 );

/**
 * Replace the page list edit action with a Gusy action.
 *
 * @param array<string,string> $actions Row actions.
 * @param WP_Post             $post Current post.
 * @return array<string,string>
 */
function gusy_base_page_row_actions( array $actions, WP_Post $post ): array {
	if ( ! gusy_base_has_gusy_editor() || ! gusy_base_is_gusy_page( $post->ID ) || ! current_user_can( 'edit_post', $post->ID ) ) {
		return $actions;
	}

	$actions['edit'] = sprintf(
		'<a href="%s" aria-label="%s">%s</a>',
		esc_url( gusy_base_gusy_editor_url( $post->ID ) ),
		esc_attr( sprintf( __( 'Edit %s with Gusy', 'gusy-base' ), $post->post_title ) ),
		esc_html__( 'Edit with Gusy', 'gusy-base' )
	);

	return $actions;
}
add_filter( 'page_row_actions', 'gusy_base_page_row_actions', 20, 2 );

/**
 * Return the current front-end Gusy page ID.
 *
 * @return int
 */
function gusy_base_current_gusy_page_id(): int {
	if ( is_admin() || ! is_singular( 'page' ) ) {
		return 0;
	}

	$post_id = get_queried_object_id();
	if ( ! $post_id || ! gusy_base_is_gusy_page( $post_id ) ) {
		return 0;
	}

	return (int) $post_id;
}

/**
 * Make the admin bar edit actions open Gusy for Gusy pages.
 *
 * @param WP_Admin_Bar $wp_admin_bar Admin bar instance.
 */
function gusy_base_admin_bar_edit_links( WP_Admin_Bar $wp_admin_bar ): void {
	if ( ! gusy_base_has_gusy_editor() || ! is_admin_bar_showing() ) {
		return;
	}

	$post_id = gusy_base_current_gusy_page_id();
	if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$gusy_url = gusy_base_gusy_editor_url( $post_id );
	$title    = esc_html__( 'Edit with Gusy', 'gusy-base' );

	foreach ( array( 'site-editor', 'edit' ) as $node_id ) {
		$node = $wp_admin_bar->get_node( $node_id );
		if ( ! $node ) {
			continue;
		}

		$wp_admin_bar->add_node(
			array(
				'id'    => $node_id,
				'title' => $title,
				'href'  => $gusy_url,
				'meta'  => is_array( $node->meta ) ? $node->meta : array(),
			)
		);
	}
}
add_action( 'admin_bar_menu', 'gusy_base_admin_bar_edit_links', 999 );

/**
 * Resolve a Gusy page ID from the HTTP referer.
 *
 * @return int
 */
function gusy_base_gusy_page_id_from_referer(): int {
	$referer = wp_get_referer();
	if ( ! $referer ) {
		return 0;
	}

	$path = wp_parse_url( $referer, PHP_URL_PATH );
	if ( ! is_string( $path ) || '' === $path ) {
		return 0;
	}

	$home_path = wp_parse_url( home_url( '/' ), PHP_URL_PATH );
	if ( is_string( $home_path ) && '/' !== $home_path && 0 === strpos( $path, $home_path ) ) {
		$path = substr( $path, strlen( $home_path ) );
	}

	$slug = trim( $path, '/' );
	if ( '' === $slug ) {
		return 0;
	}

	$page = get_page_by_path( sanitize_title( basename( $slug ) ), OBJECT, 'page' );
	if ( ! $page instanceof WP_Post || ! gusy_base_is_gusy_page( $page->ID ) ) {
		return 0;
	}

	return (int) $page->ID;
}

/**
 * Redirect direct Gutenberg edit attempts for Gusy pages.
 */
function gusy_base_redirect_gutenberg_edit(): void {
	if ( ! is_admin() || wp_doing_ajax() || ! gusy_base_has_gusy_editor() ) {
		return;
	}

	global $pagenow;
	if ( 'site-editor.php' === $pagenow && ! isset( $_GET['gusy_allow_site_editor'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$post_id = gusy_base_gusy_page_id_from_referer();
		if ( $post_id && current_user_can( 'edit_post', $post_id ) ) {
			wp_safe_redirect( gusy_base_gusy_editor_url( $post_id ) );
			exit;
		}

		return;
	}

	if ( 'post.php' === $pagenow ) {
		$post_id = isset( $_GET['post'] ) ? absint( wp_unslash( $_GET['post'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$action  = isset( $_GET['action'] ) ? sanitize_key( wp_unslash( $_GET['action'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$allow   = isset( $_GET['gusy_allow_gutenberg'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( ! $post_id || 'edit' !== $action || $allow || ! gusy_base_is_gusy_page( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		wp_safe_redirect( gusy_base_gusy_editor_url( $post_id ) );
		exit;
	}
}
add_action( 'admin_init', 'gusy_base_redirect_gutenberg_edit', 1 );

/**
 * Design tokens used by the Gusy editor for a base template.
 *
 * @param array<string,mixed> $template Template data.
 * @return array<string,mixed>
 */
function gusy_base_template_design_tokens( array $template ): array {
	$palettes = array(
		'boutique-luxe'        => array( '#201D1B', '#F7F0E8', '#B98645', '#576A80' ),
		'atelier-artisan'      => array( '#24322B', '#F5EFE4', '#A66A3F', '#667C5D' ),
		'independant-conseil'  => array( '#14212A', '#F4F7F8', '#3C7890', '#B98A52' ),
		'salon-beaute'         => array( '#2B2026', '#FAF0F3', '#C96A88', '#8B735E' ),
		'restaurant-table'     => array( '#202620', '#F8F1E8', '#B45E3C', '#6B7F58' ),
		'fleuriste-poetique'   => array( '#17393A', '#F3F8F5', '#D7749D', '#7B9A74' ),
		'coach-wellness'       => array( '#183230', '#F4F4EA', '#6FA287', '#C3915A' ),
		'architecte-interieur' => array( '#202329', '#F2F0EA', '#9A7B5B', '#65737E' ),
		'marche-local'         => array( '#243B30', '#F8F2E6', '#D7683E', '#7A9B62' ),
		'studio-createur'      => array( '#181B22', '#F5F3EF', '#C15F78', '#4F7694' ),
	);

	$slug    = (string) ( $template['slug'] ?? '' );
	$palette = $palettes[ $slug ] ?? array( '#102326', '#F7F8F3', '#E46F4D', '#5C8D89' );

	return array(
		'style'      => 'Gusy commerce local',
		'mode'       => 'light',
		'colors'     => array(
			'primary'   => $palette[0],
			'secondary' => $palette[1],
			'accent'    => $palette[2],
			'support'   => $palette[3],
			'gold'      => '#C99A3A',
			'surface'   => '#FFFFFF',
			'ink'       => '#121615',
			'muted'     => '#64716D',
			'line'      => '#DDE5DF',
		),
		'typography' => array(
			'fontFamily' => 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			'scale'      => 'comfortable',
			'weight'     => '700',
		),
		'spacing'    => 'comfortable',
		'radius'     => array(
			'sm' => '6px',
			'md' => '10px',
			'lg' => '16px',
			'xl' => '24px',
		),
		'shadow'     => 'premium',
		'motion'     => 'subtle',
		'layout'     => 'wide',
	);
}

/**
 * Create editable image data for the Gusy editor blueprint.
 *
 * @param string $file Theme image file.
 * @param string $alt Alt text.
 * @return array<string,mixed>
 */
function gusy_base_blueprint_image( string $file, string $alt ): array {
	return array(
		'id'    => 0,
		'url'   => gusy_base_image_url( $file ),
		'alt'   => $alt,
		'title' => $alt,
	);
}

/**
 * Create a Gusy editor blueprint from a base theme template.
 *
 * @param array<string,mixed> $template Template data.
 * @return array<string,mixed>
 */
function gusy_base_template_blueprint( array $template ): array {
	$slug          = gusy_base_template_page_slug( $template );
	$tokens        = gusy_base_template_design_tokens( $template );
	$language      = gusy_base_template_language( $template );
	$offers_suffix = gusy_base_secondary_slug_suffix( $template, 'offers' );
	$offers_label  = gusy_base_text( 'navOffers', $template );
	$method_label  = 'fr' === $language ? 'Méthode' : 'Method';
	$template_slug = (string) $template['slug'];
	$hero_image    = gusy_base_blueprint_image( $template_slug . '-hero.jpg', (string) $template['brand'] );
	$offer_images  = array(
		$template_slug . '-offer.jpg',
		$template_slug . '-detail.jpg',
		$template_slug . '-hero.jpg',
	);
	$review_images = array(
		$template_slug . '-testimonial-1.jpg',
		$template_slug . '-testimonial-2.jpg',
		$template_slug . '-testimonial-3.jpg',
	);

	$offer_items = array();
	foreach ( $template['offers'] as $index => $offer ) {
		$offer_items[] = array(
			'title' => (string) $offer['title'],
			'body'  => (string) $offer['body'],
			'label' => (string) $offer['price'],
			'image' => gusy_base_blueprint_image( $offer_images[ $index % count( $offer_images ) ], (string) $offer['title'] ),
		);
	}

	$proof_items = array();
	foreach ( $template['proof'] as $proof ) {
		$proof_items[] = array(
			'title' => (string) $proof['label'],
			'body'  => (string) $proof['label'],
			'label' => (string) $proof['value'],
		);
	}

	$process_items = array();
	foreach ( $template['process'] as $index => $step ) {
		$process_items[] = array(
			'title' => (string) $step,
			'body'  => 0 === $index ? (string) $template['detailBody'] : (string) $template['body'],
			'label' => '0' . ( $index + 1 ),
			'image' => gusy_base_blueprint_image( $offer_images[ ( $index + 1 ) % count( $offer_images ) ], (string) $step ),
		);
	}

	$review_items = array();
		foreach ( gusy_base_template_reviews( $template ) as $index => $review ) {
			$review_items[] = array(
				'title' => (string) $review['person'] . ' - ' . (string) $review['role'],
				'body'  => (string) $review['quote'],
				'label' => gusy_base_text( 'reviewLabel', $template ),
			'image' => gusy_base_blueprint_image( $review_images[ $index % count( $review_images ) ], (string) $review['person'] ),
		);
	}

	$contact = $template['contact'];

	return array(
		'schemaVersion' => '1.0',
		'page'          => array(
			'title'        => (string) $template['brand'],
			'slug'         => $slug,
			'language'     => $language,
			'seo'          => array(
				'metaTitle'       => (string) $template['brand'] . ' - ' . (string) $template['name'],
				'metaDescription' => (string) $template['body'],
				'schemaJsonLd'    => array(
					'@context' => 'https://schema.org',
					'@type'    => 'LocalBusiness',
					'name'     => (string) $template['brand'],
					'address'  => (string) $contact['address'],
					'email'    => (string) $contact['email'],
					'telephone'=> (string) $contact['phone'],
				),
			),
			'designSystem' => $tokens,
			'sections'     => array(
				array(
					'id'       => 'navigation',
					'type'     => 'header',
					'variant'  => 'commerce',
					'label'    => 'Navigation',
					'kicker'   => '',
					'title'    => (string) $template['brand'],
					'body'     => (string) $template['location'],
					'cta'      => array(
						'label' => (string) $template['primary'],
						'url'   => gusy_base_template_page_url( $template, 'contact' ),
					),
					'items'    => array_map(
						static function ( array $link ): array {
							return array(
								'title' => $link['label'],
								'body'  => $link['url'],
								'label' => '',
							);
						},
						gusy_base_template_nav_links( $template )
					),
					'settings' => array( 'background' => 'plain', 'spacing' => 'sm', 'columns' => 5, 'mobileStack' => true ),
				),
				array(
					'id'       => 'hero',
					'type'     => 'hero',
					'variant'  => 'local-commerce',
					'label'    => 'Hero',
					'kicker'   => (string) $template['location'],
					'title'    => (string) $template['title'],
					'body'     => (string) $template['body'],
					'cta'      => array(
						'label'          => (string) $template['primary'],
						'url'            => gusy_base_template_page_url( $template, 'contact' ),
						'secondaryLabel' => (string) $template['secondary'],
						'secondaryUrl'   => gusy_base_template_page_url( $template, $offers_suffix ),
					),
					'items'    => $proof_items,
					'settings' => array( 'background' => 'hero', 'spacing' => 'lg', 'columns' => 2, 'backgroundImage' => $hero_image, 'mobileStack' => true ),
				),
				array(
					'id'       => 'offres',
					'type'     => 'pricing',
					'variant'  => 'commerce',
					'label'    => $offers_label,
					'kicker'   => $offers_label,
					'title'    => (string) $template['offersTitle'],
					'body'     => (string) $template['offersIntro'],
					'cta'      => array(
						'label' => (string) $template['primary'],
						'url'   => gusy_base_template_page_url( $template, 'contact' ),
					),
					'items'    => $offer_items,
					'settings' => array( 'background' => 'soft', 'spacing' => 'lg', 'columns' => 3, 'mobileStack' => true ),
				),
				array(
					'id'       => 'methode',
					'type'     => 'process',
					'variant'  => 'steps',
					'label'    => $method_label,
					'kicker'   => $method_label,
					'title'    => (string) $template['detailTitle'],
					'body'     => (string) $template['detailBody'],
					'cta'      => array(
						'label' => (string) $template['secondary'],
						'url'   => gusy_base_template_page_url( $template, $offers_suffix ),
					),
					'items'    => $process_items,
					'settings' => array( 'background' => 'plain', 'spacing' => 'lg', 'columns' => 3, 'mobileStack' => true ),
				),
				array(
					'id'       => 'preuve',
					'type'     => 'testimonials',
					'variant'  => 'grid',
					'label'    => gusy_base_text( 'reviews', $template ),
					'kicker'   => gusy_base_text( 'reviews', $template ),
					'title'    => gusy_base_text( 'reviewsTitle', $template ),
					'body'     => gusy_base_text( 'reviewBody', $template ),
					'items'    => $review_items,
				'settings' => array( 'background' => 'elevated', 'spacing' => 'md', 'columns' => 3, 'mobileStack' => true ),
			),
			array(
				'id'       => 'questions',
				'type'     => 'faq',
				'variant'  => 'accordion',
				'label'    => gusy_base_text( 'faqLabel', $template ),
				'kicker'   => gusy_base_text( 'faqLabel', $template ),
				'title'    => gusy_base_text( 'faqTitle', $template ),
				'body'     => gusy_base_text( 'faqBody', $template ),
				'items'    => gusy_base_template_faq_items( $template ),
				'settings' => array( 'background' => 'plain', 'spacing' => 'md', 'columns' => 2, 'mobileStack' => true ),
			),
			array(
				'id'       => 'contact',
				'type'     => 'form',
					'variant'  => 'contact',
					'label'    => 'Contact',
					'kicker'   => 'Contact',
					'title'    => (string) $template['primary'],
					'body'     => (string) $contact['address'] . ' · ' . (string) $contact['hours'] . ' · ' . (string) $contact['phone'] . ' · ' . (string) $contact['email'],
					'cta'      => array(
						'label' => (string) $template['primary'],
						'url'   => 'mailto:' . (string) $contact['email'],
					),
						'items'    => array(
							array( 'title' => gusy_base_text( 'address', $template ), 'body' => (string) $contact['address'], 'label' => gusy_base_text( 'local', $template ) ),
							array( 'title' => gusy_base_text( 'hours', $template ), 'body' => (string) $contact['hours'], 'label' => gusy_base_text( 'opening', $template ) ),
							array( 'title' => gusy_base_text( 'phone', $template ), 'body' => (string) $contact['phone'], 'label' => gusy_base_text( 'call', $template ) ),
						),
					'settings' => array( 'background' => 'soft', 'spacing' => 'lg', 'columns' => 2, 'mobileStack' => true ),
				),
			),
		),
	);
}
