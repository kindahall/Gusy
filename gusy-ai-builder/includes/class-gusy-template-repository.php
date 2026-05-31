<?php
/**
 * Built-in section template library.
 *
 * @package Gusy_AI_Builder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Provides business-goal oriented templates.
 */
final class Gusy_AI_Builder_Template_Repository {
	/**
	 * Return the built-in section templates.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public function get_sections(): array {
		$templates = array(
			$this->template( 'header-nav', 'Navigation', 'Header navigation', 'header', 'nav-compact', 'Add logo, menu and primary CTA' ),
			$this->template( 'hero-local-service', 'Local', 'Local service hero', 'hero', 'local-trust', 'Turn local search intent into qualified enquiries' ),
			$this->template( 'hero-saas-acquisition', 'Hero', 'SaaS hero', 'hero', 'split-premium', 'Present a digital offer with immediate proof' ),
			$this->template( 'hero-agency-split', 'Hero', 'Agency hero', 'hero', 'agency-proof', 'Position creative or technical expertise' ),
			$this->template( 'hero-product-launch', 'Commerce', 'Product launch hero', 'hero', 'launch-focus', 'Make the offer easy to understand fast' ),
			$this->template( 'problem-solution', 'Content', 'Problem / solution', 'problem-solution', 'split-proof', 'Clarify the pain and the response' ),
			$this->template( 'features-bento', 'Product', 'Feature bento', 'features', 'bento', 'Show key capabilities without noise' ),
			$this->template( 'features-grid', 'Content', 'Services grid', 'features', 'cards', 'Turn services into outcomes' ),
			$this->template( 'process-steps', 'Content', 'Process steps', 'process', 'steps', 'Make the method and timeline clear' ),
			$this->template( 'stats-proof', 'Trust', 'Stats strip', 'stats', 'proof-band', 'Anchor credibility with numbers' ),
			$this->template( 'logo-cloud', 'Trust', 'Logo wall', 'logos', 'cloud', 'Show quick proof above the fold' ),
			$this->template( 'testimonials-slider', 'Trust', 'Testimonials grid', 'testimonials', 'cards', 'Reduce perceived risk' ),
			$this->template( 'case-study-snapshot', 'Trust', 'Case study card', 'case-study', 'snapshot', 'Prove a result without a long page' ),
			$this->template( 'pricing-two-plans', 'Commerce', 'Pricing: two plans', 'pricing', 'two-plans', 'Compare a standard and premium offer' ),
			$this->template( 'pricing-three-plans', 'Commerce', 'Pricing: three plans', 'pricing', 'three-plans', 'Structure a clear offer ladder' ),
			$this->template( 'faq-conversion', 'Support', 'FAQ accordion', 'faq', 'accordion', 'Handle objections before the form' ),
			$this->template( 'contact-form-qualified', 'Conversion', 'Qualified form', 'form', 'qualified', 'Receive more useful enquiries' ),
			$this->template( 'final-cta', 'Conversion', 'CTA band', 'cta', 'closing', 'Give one clear final action' ),
			$this->template( 'comparison-table', 'Commerce', 'Comparison table', 'comparison', 'table', 'Differentiate an offer from alternatives' ),
			$this->template( 'gallery-editorial', 'Media', 'Gallery grid', 'gallery', 'editorial', 'Show work or products visually' ),
			$this->template( 'before-after', 'Trust', 'Before / after', 'before-after', 'split', 'Make progress obvious' ),
			$this->template( 'local-map-hours', 'Local', 'Map and hours', 'local', 'map-card', 'Convert city plus service searches' ),
			$this->template( 'lead-magnet', 'Conversion', 'Lead magnet', 'lead-magnet', 'resource', 'Collect a contact for a useful resource' ),
			$this->template( 'integrations', 'Product', 'Integrations wall', 'integrations', 'logo-grid', 'Show compatibility with customer tools' ),
			$this->template( 'team-experts', 'Trust', 'Team grid', 'team', 'people-grid', 'Humanize a service offer' ),
			$this->template( 'guarantee-risk', 'Trust', 'Guarantee strip', 'guarantee', 'assurance', 'Reduce fear of choosing wrong' ),
			$this->template( 'timeline-delivery', 'Content', 'Delivery timeline', 'timeline', 'milestones', 'Make delivery concrete' ),
			$this->template( 'metrics-dashboard', 'Product', 'Metrics dashboard', 'metrics', 'dashboard', 'Project the user into the product' ),
			$this->template( 'offer-sticky', 'Conversion', 'Sticky offer bar', 'sticky-offer', 'inline', 'Keep an action available after reading' ),
			$this->template( 'newsletter-trust', 'Conversion', 'Newsletter form', 'newsletter', 'compact', 'Convert visitors who are not ready yet' ),
			$this->template( 'audit-offer', 'Conversion', 'Free audit offer', 'audit', 'conversion-card', 'Generate qualified commercial enquiries' ),
			$this->template( 'footer-compact', 'Navigation', 'Footer', 'footer', 'compact', 'Close the page with useful links and social proof' ),
		);

		return $templates;
	}

	/**
	 * Find template by id.
	 *
	 * @param string $id Template id.
	 * @return array<string,mixed>|null
	 */
	public function find( string $id ): ?array {
		foreach ( $this->get_sections() as $template ) {
			if ( $id === $template['id'] ) {
				return $template;
			}
		}

		return null;
	}

	/**
	 * Return section templates for a generated page.
	 *
	 * @param string $business_type Business type.
	 * @return array<int,array<string,mixed>>
	 */
	public function starter_page_sections( string $business_type ): array {
		$ids = array(
			'hero-local-service',
			'stats-proof',
			'problem-solution',
			'features-grid',
			'process-steps',
			'testimonials-slider',
			'pricing-two-plans',
			'faq-conversion',
			'contact-form-qualified',
			'final-cta',
		);

		if ( 'local' === $business_type ) {
			$ids = array(
				'hero-local-service',
				'stats-proof',
				'problem-solution',
				'features-grid',
				'local-map-hours',
				'testimonials-slider',
				'faq-conversion',
				'contact-form-qualified',
				'final-cta',
			);
		}

		if ( 'agency' === $business_type ) {
			$ids = array(
				'hero-agency-split',
				'logo-cloud',
				'case-study-snapshot',
				'features-bento',
				'timeline-delivery',
				'team-experts',
				'testimonials-slider',
				'audit-offer',
				'faq-conversion',
				'final-cta',
			);
		}

		$sections = array();
		foreach ( $ids as $id ) {
			$template = $this->find( $id );
			if ( $template ) {
				$sections[] = $template['section'];
			}
		}

		return $sections;
	}

	/**
	 * Build a template object.
	 *
	 * @param string $id Template id.
	 * @param string $category Business category.
	 * @param string $title Title.
	 * @param string $type Section type.
	 * @param string $variant Variant.
	 * @param string $intent Business intent.
	 * @return array<string,mixed>
	 */
	private function template( string $id, string $category, string $title, string $type, string $variant, string $intent ): array {
		return array(
			'id'       => $id,
			'category' => $category,
			'title'    => $title,
			'type'     => $type,
			'variant'  => $variant,
			'intent'   => $intent,
			'preview'  => $this->preview_copy( $type ),
			'section'  => $this->section( $id, $title, $type, $variant, $intent ),
		);
	}

	/**
	 * Build section content for a template.
	 *
	 * @param string $id Template id.
	 * @param string $label Section label.
	 * @param string $type Section type.
	 * @param string $variant Variant.
	 * @param string $intent Business intent.
	 * @return array<string,mixed>
	 */
	private function section( string $id, string $label, string $type, string $variant, string $intent ): array {
		$base = array(
			'id'       => 'gusy-' . $id,
			'type'     => $type,
			'variant'  => $variant,
			'label'    => $label,
			'intent'   => $intent,
			'kicker'   => $this->kicker_for_type( $type ),
			'title'    => $this->title_for_type( $type ),
			'body'     => $this->body_for_type( $type ),
			'cta'      => array(
				'label'          => $this->cta_for_type( $type ),
				'url'            => '#contact',
				'secondaryLabel' => 'See examples',
				'secondaryUrl'   => '#proof',
			),
			'items'    => $this->items_for_type( $type ),
			'settings' => array(
				'background'  => $this->background_for_type( $type ),
				'spacing'     => 'xl',
				'columns'     => in_array( $type, array( 'features', 'pricing', 'testimonials', 'team' ), true ) ? 3 : 2,
				'tabletColumns' => 2,
				'mobileColumns' => 1,
				'mobileStack' => true,
				'interactive' => in_array( $type, array( 'faq', 'pricing', 'form', 'sticky-offer' ), true ),
			),
			'notes'    => array(),
		);

		if ( 'hero' === $type ) {
			$hero_image = $this->theme_image_url( 'themes/atelier-artisan-hero.jpg' );
			$base['settings']['background'] = 'hero';
			$base['items']                  = array(
				array( 'label' => '24h', 'title' => 'fast reply', 'body' => 'Make the next step obvious from the first screen.' ),
				array( 'label' => '4.9/5', 'title' => 'client trust', 'body' => 'Show reviews, photos and proof where visitors decide.' ),
				array( 'label' => 'Local', 'title' => 'easy contact', 'body' => 'Keep address, hours, phone and booking close to the offer.' ),
			);

			if ( $hero_image ) {
				$base['settings']['backgroundImage'] = array(
					'id'    => 0,
					'url'   => $hero_image,
					'alt'   => 'Independent artisan workspace',
					'title' => 'Local business photo',
				);
			}
		}

		return $base;
	}

	/**
	 * Preview copy.
	 *
	 * @param string $type Section type.
	 * @return string
	 */
	private function preview_copy( string $type ): string {
		$map = array(
			'header'           => 'Logo, navigation and CTA button',
			'hero'             => 'Strong headline, quick proof, visible CTA',
			'features'         => 'Readable cards with concrete benefits',
			'pricing'          => 'Comparable plans and annual toggle',
			'faq'              => 'Objections handled in accordions',
			'form'             => 'Short fields and clear qualification',
			'comparison'       => 'Key differences in a scannable table',
			'local'            => 'Address, hours and local CTA',
			'footer'           => 'Links, contact and trust closer',
			'problem-solution' => 'Pain point followed by structured solution',
		);

		return $map[ $type ] ?? 'Section ready to adapt to the brief';
	}

	/**
	 * Section kicker by type.
	 *
	 * @param string $type Section type.
	 * @return string
	 */
	private function kicker_for_type( string $type ): string {
		$map = array(
			'header'           => 'Navigation',
			'hero'             => 'Local business website',
			'logos'            => 'Trusted by teams',
			'problem-solution' => 'Problem solved',
			'features'         => 'What changes',
			'process'          => 'Method',
			'stats'            => 'Proof',
			'testimonials'     => 'Customer feedback',
			'pricing'          => 'Plans',
			'faq'              => 'Questions',
			'form'             => 'Contact',
			'cta'              => 'Next step',
			'local'            => 'Visit',
			'footer'           => 'Footer',
		);

		return $map[ $type ] ?? 'Section';
	}

	/**
	 * Section title by type.
	 *
	 * @param string $type Section type.
	 * @return string
	 */
	private function title_for_type( string $type ): string {
		$map = array(
			'header'           => 'Primary navigation',
			'hero'             => 'A polished business page, ready to book.',
			'logos'            => 'Trusted by local clients',
			'problem-solution' => 'From first visit to first request',
			'features'         => 'Services customers can choose',
			'process'          => 'How it works',
			'stats'            => 'What clients notice',
			'testimonials'     => 'Reviews that build trust',
			'pricing'          => 'Clear offers and packages',
			'faq'              => 'Quick answers',
			'form'             => 'Send a request',
			'cta'              => 'Ready to talk?',
			'comparison'       => 'Why choose this business',
			'gallery'          => 'Photos that show the offer',
			'before-after'     => 'Before and after',
			'local'            => 'Find us and book faster',
			'team'             => 'The team behind it',
			'footer'           => 'Useful links and next steps',
		);

		return $map[ $type ] ?? 'Visual block ready';
	}

	/**
	 * Body by type.
	 *
	 * @param string $type Section type.
	 * @return string
	 */
	private function body_for_type( string $type ): string {
		$map = array(
			'header'           => 'Connect every key page and keep the main action visible.',
			'hero'             => 'Show the offer, photos, hours and contact details in a page clients can understand fast.',
			'logos'            => 'Add clients, partners, press or certificates as a fast trust signal.',
			'problem-solution' => 'Explain what visitors need and why this business is the right choice.',
			'features'         => 'Present services, products or packages with useful details, not filler.',
			'process'          => 'Explain booking, preparation, delivery and follow-up in plain steps.',
			'stats'            => 'Keep the strongest proof visible where decisions happen.',
			'testimonials'     => 'Show real client context, result and confidence.',
			'pricing'          => 'Compare offers clearly and highlight the best path.',
			'faq'              => 'Remove friction before the visitor leaves.',
			'form'             => 'Collect the right details without slowing the page.',
			'cta'              => 'One final action, visually clear.',
			'local'            => 'Show address, opening hours, service area and a booking action.',
			'footer'           => 'Keep contact, legal links, social links and a final CTA accessible.',
		);

		return $map[ $type ] ?? 'Ready for the canvas.';
	}

	/**
	 * CTA copy by type.
	 *
	 * @param string $type Section type.
	 * @return string
	 */
	private function cta_for_type( string $type ): string {
		$map = array(
			'hero'        => 'Book a call',
			'pricing'     => 'Choose this offer',
			'form'        => 'Send request',
			'cta'         => 'Contact us',
			'audit'       => 'Request an audit',
			'lead-magnet' => 'Get the resource',
		);

		return $map[ $type ] ?? 'Continue';
	}

	/**
	 * Background by type.
	 *
	 * @param string $type Section type.
	 * @return string
	 */
	private function background_for_type( string $type ): string {
		if ( in_array( $type, array( 'hero', 'cta', 'pricing' ), true ) ) {
			return 'elevated';
		}

		if ( in_array( $type, array( 'stats', 'logos', 'faq' ), true ) ) {
			return 'soft';
		}

		return 'plain';
	}

	/**
	 * Items by type.
	 *
	 * @param string $type Section type.
	 * @return array<int,array<string,mixed>>
	 */
	private function items_for_type( string $type ): array {
		$items = array(
			'header' => array(
				array( 'title' => 'Home', 'body' => '#home', 'label' => 'Link' ),
				array( 'title' => 'Services', 'body' => '#services', 'label' => 'Link' ),
				array( 'title' => 'Pricing', 'body' => '#pricing', 'label' => 'Link' ),
				array( 'title' => 'Contact', 'body' => '#contact', 'label' => 'CTA' ),
			),
			'features' => array(
				array(
					'title' => 'Main service',
					'body'  => 'Describe the offer, who it helps and what is included.',
					'label' => '01',
					'image' => $this->image_data( 'themes/atelier-artisan-detail.jpg', 'Hands-on service detail' ),
				),
				array(
					'title' => 'Fast booking',
					'body'  => 'Make phone, email, form or appointment actions easy to find.',
					'label' => '02',
					'image' => $this->image_data( 'themes/boutique-luxe-offer.jpg', 'Prepared customer order' ),
				),
				array(
					'title' => 'Real photos',
					'body'  => 'Reserve space for products, projects, team or the place itself.',
					'label' => '03',
					'image' => $this->image_data( 'themes/fleuriste-poetique-offer.jpg', 'Local product detail' ),
				),
				array(
					'title' => 'Client proof',
					'body'  => 'Add reviews, guarantees, certifications or recent results.',
					'label' => '04',
					'image' => $this->image_data( 'themes/restaurant-table-detail.jpg', 'Business detail photo' ),
				),
			),
			'process' => array(
				array( 'title' => 'Brief', 'body' => 'Define target, offer, tone and required sections.', 'label' => '1' ),
				array( 'title' => 'Generation', 'body' => 'Gusy assembles structure, content and design system.', 'label' => '2' ),
				array( 'title' => 'Adjustment', 'body' => 'Edit a section by clicking it or through the assistant.', 'label' => '3' ),
				array( 'title' => 'Publishing', 'body' => 'Save as draft or publish as clean blocks.', 'label' => '4' ),
			),
			'stats' => array(
				array( 'title' => 'under 10 min', 'body' => 'To get a publishable page.', 'label' => '10' ),
				array( 'title' => '12 blocks', 'body' => 'To cover essential sections.', 'label' => '12' ),
				array( 'title' => '30 sections', 'body' => 'Organized by business objective.', 'label' => '30' ),
			),
			'logos' => array(
				array( 'title' => 'Northstar', 'body' => '', 'label' => 'Logo' ),
				array( 'title' => 'Atelier', 'body' => '', 'label' => 'Logo' ),
				array( 'title' => 'Pilot', 'body' => '', 'label' => 'Logo' ),
				array( 'title' => 'Evergreen', 'body' => '', 'label' => 'Logo' ),
				array( 'title' => 'Union', 'body' => '', 'label' => 'Logo' ),
				array( 'title' => 'Keystone', 'body' => '', 'label' => 'Logo' ),
			),
			'testimonials' => array(
				array(
					'title' => '"The page felt ready for our shop."',
					'body'  => 'Amelie R., boutique owner.',
					'label' => 'Retail',
					'image' => $this->image_data( 'themes/boutique-luxe-testimonial-1.jpg', 'Retail client portrait' ),
				),
				array(
					'title' => '"Clients understood the offer faster."',
					'body'  => 'Marc D., independent artisan.',
					'label' => 'Craft',
					'image' => $this->image_data( 'themes/atelier-artisan-testimonial-2.jpg', 'Artisan client portrait' ),
				),
				array(
					'title' => '"The contact path is finally obvious."',
					'body'  => 'Sofia L., local service customer.',
					'label' => 'Local',
					'image' => $this->image_data( 'themes/salon-beaute-testimonial-1.jpg', 'Local client portrait' ),
				),
			),
			'pricing' => array(
				array( 'title' => 'Essential', 'body' => 'A clear first offer with the basics included.', 'label' => 'From EUR49' ),
				array( 'title' => 'Signature', 'body' => 'The most requested package with extra service and priority.', 'label' => 'From EUR89' ),
				array( 'title' => 'Custom', 'body' => 'A tailored option for events, larger orders or special projects.', 'label' => 'Quote' ),
			),
			'form' => array(
				array( 'title' => 'Name', 'body' => 'Your full name', 'label' => 'text' ),
				array( 'title' => 'Email', 'body' => 'Your email address', 'label' => 'email' ),
				array( 'title' => 'Project', 'body' => 'Tell us what you need', 'label' => 'textarea' ),
			),
			'newsletter' => array(
				array( 'title' => 'Name', 'body' => 'Your first name', 'label' => 'text' ),
				array( 'title' => 'Email', 'body' => 'Where should we send it?', 'label' => 'email' ),
				array( 'title' => 'Interest', 'body' => 'What are you looking for?', 'label' => 'textarea' ),
			),
			'lead-magnet' => array(
				array( 'title' => 'Name', 'body' => 'Your full name', 'label' => 'text' ),
				array( 'title' => 'Email', 'body' => 'Where should we send the resource?', 'label' => 'email' ),
				array( 'title' => 'Goal', 'body' => 'What are you trying to improve?', 'label' => 'textarea' ),
			),
			'audit' => array(
				array( 'title' => 'Name', 'body' => 'Your full name', 'label' => 'text' ),
				array( 'title' => 'Email', 'body' => 'Your work email', 'label' => 'email' ),
				array( 'title' => 'Website', 'body' => 'Paste the page to audit', 'label' => 'textarea' ),
			),
			'faq' => array(
				array( 'title' => 'How fast do you reply?', 'body' => 'Most requests receive a clear answer within one business day.', 'label' => 'Timing' ),
				array( 'title' => 'Can I ask for a custom offer?', 'body' => 'Yes, the form can collect dates, budget, quantity and special details.', 'label' => 'Custom' ),
				array( 'title' => 'Where are you based?', 'body' => 'Add the address, service area and opening hours so visitors know what to expect.', 'label' => 'Local' ),
			),
			'comparison' => array(
				array( 'title' => 'Clean output', 'body' => 'WordPress blocks and readable classes.', 'label' => 'Gusy' ),
				array( 'title' => 'AI workflow', 'body' => 'Brief, generation and contextual editing.', 'label' => 'Gusy' ),
				array( 'title' => 'Frontend weight', 'body' => 'Conditional assets and controlled CSS.', 'label' => 'Gusy' ),
			),
			'local' => array(
				array( 'title' => 'Service area', 'body' => 'Paris and nearby cities.', 'label' => 'Local' ),
				array( 'title' => 'Opening hours', 'body' => 'Mon-Fri, 9:00-18:00.', 'label' => 'Hours' ),
				array( 'title' => 'Fast booking', 'body' => 'Add phone, map link or appointment CTA.', 'label' => 'Book' ),
			),
			'footer' => array(
				array( 'title' => 'Company', 'body' => 'About, services, work, contact.', 'label' => 'Links' ),
				array( 'title' => 'Contact', 'body' => 'Email, phone and address.', 'label' => 'Info' ),
				array( 'title' => 'Legal', 'body' => 'Privacy, terms, cookies.', 'label' => 'Trust' ),
			),
		);

		return $items[ $type ] ?? array(
			array( 'title' => 'Clear', 'body' => 'Every element supports a decision or action.', 'label' => 'A' ),
			array( 'title' => 'Fast', 'body' => 'Content is ready to adjust in the canvas.', 'label' => 'B' ),
			array( 'title' => 'Clean', 'body' => 'The output stays maintainable in WordPress.', 'label' => 'C' ),
		);
	}

	/**
	 * Return a bundled theme image URL when the Gusy base theme is active.
	 *
	 * @param string $relative_path Path inside assets/images.
	 * @return string
	 */
	private function theme_image_url( string $relative_path ): string {
		if ( ! function_exists( 'get_theme_file_path' ) || ! function_exists( 'get_theme_file_uri' ) ) {
			return '';
		}

		$path = 'assets/images/' . ltrim( $relative_path, '/' );
		if ( ! file_exists( get_theme_file_path( $path ) ) ) {
			return '';
		}

		return esc_url_raw( get_theme_file_uri( $path ) );
	}

	/**
	 * Build an image payload from a bundled theme image.
	 *
	 * @param string $relative_path Path inside assets/images.
	 * @param string $title Image title and alt fallback.
	 * @return array<string,mixed>
	 */
	private function image_data( string $relative_path, string $title ): array {
		$url = $this->theme_image_url( $relative_path );
		if ( '' === $url ) {
			return array();
		}

		return array(
			'id'    => 0,
			'url'   => $url,
			'alt'   => $title,
			'title' => $title,
		);
	}
}
