<script lang="ts">
	import '$lib/styles/shared.css';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';

	// Import images
	import heroImg from '$img/olivier_lambert_Happy_parents_sitting_on_cozy_couch_reviewing_f0430d78-163c-41e0-a7bb-5df495b83509_1.png';
	import step1Img from '$img/olivier_lambert_Person_pinning_colorful_cards_to_a_bulletin_b_5e91a018-38d2-4443-8426-98ef401c5c14_3.png';
	import step2Img from '$img/olivier_lambert_Hand_moving_colorful_cards_between_columns_on_59a8e21e-6668-4846-855a-b366db63ce3e_0.png';
	import step3Img from '$img/olivier_lambert_Happy_family_with_toddler_waving_goodbye_at_d_67f8671e-15c0-4479-b3b8-70017446f07e_0.png';
	import screenshotImg from '$img/olivier_lambert_Cozy_desk_scene_with_laptop_showing_colorful__861e513f-a115-4dda-b9c1-31a7f8be44bc_2.png';
	import testimonial1Img from '$img/olivier_lambert_Friendly_young_woman_portrait_with_warm_smile_c67fd334-a373-4784-8001-878037f0ea7a_1.png';
	import testimonial2Img from '$img/olivier_lambert_Friendly_young_man_portrait_with_warm_smile_w_c3dc1801-33ed-455c-8731-2eb5ca0748a9_3.png';
	import testimonial3Img from '$img/olivier_lambert_Friendly_couple_portrait_standing_together_wi_2e868fbe-b806-4a42-a19b-4f93628ed453_0.png';
	import ctaImg from '$img/olivier_lambert_Happy_family_with_toddler_arriving_at_charmin_b1823b3d-d557-4403-a438-9629bfb5ef88_2.png';

	function switchLanguage(locale: string) {
		setLocale(locale as 'en' | 'fr');
	}
</script>

<div class="landing">
	<!-- Language Toggle -->
	<div class="language-toggle">
		{#each locales as locale}
			<button
				class="btn-lang"
				class:active={getLocale() === locale}
				onclick={() => switchLanguage(locale)}
			>
				{locale === 'en' ? m.lang_en() : m.lang_fr()}
			</button>
		{/each}
	</div>

	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<div class="logo-section">
				<img src="/logo.png" alt="GarderieFacile" class="logo" />
			</div>

			<h1 class="hero-headline">{m.landing_headline()}</h1>
			<p class="hero-subtitle">{m.landing_subtitle()}</p>

			<div class="hero-cta">
				<a href="/signup" class="btn btn-primary btn-lg">{m.landing_cta_signup()}</a>
				<a href="/login" class="btn btn-secondary btn-lg">{m.landing_cta_login()}</a>
			</div>
		</div>

		<div class="hero-image">
			<img src={heroImg} alt="Parents reviewing daycare options" />
		</div>
	</section>

	<!-- Features Section -->
	<section class="features-section">
		<h2 class="section-heading">{m.landing_features_heading()}</h2>
		<p class="section-subheading">{m.landing_features_subheading()}</p>

		<div class="features">
			<div class="feature">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="7" height="7" rx="1"/>
						<rect x="14" y="3" width="7" height="7" rx="1"/>
						<rect x="3" y="14" width="7" height="7" rx="1"/>
						<rect x="14" y="14" width="7" height="7" rx="1"/>
					</svg>
				</div>
				<h3>{m.landing_feature_kanban_title()}</h3>
				<p>{m.landing_feature_kanban_desc()}</p>
			</div>

			<div class="feature">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<polyline points="14 2 14 8 20 8"/>
						<line x1="16" y1="13" x2="8" y2="13"/>
						<line x1="16" y1="17" x2="8" y2="17"/>
					</svg>
				</div>
				<h3>{m.landing_feature_notes_title()}</h3>
				<p>{m.landing_feature_notes_desc()}</p>
			</div>

			<div class="feature">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
					</svg>
				</div>
				<h3>{m.landing_feature_reviews_title()}</h3>
				<p>{m.landing_feature_reviews_desc()}</p>
			</div>

			<div class="feature">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"/>
						<polyline points="12 6 12 12 16 14"/>
					</svg>
				</div>
				<h3>{m.landing_feature_commute_title()}</h3>
				<p>{m.landing_feature_commute_desc()}</p>
			</div>
		</div>
	</section>

	<!-- How It Works Section -->
	<section class="how-it-works">
		<h2 class="section-heading">{m.landing_how_heading()}</h2>
		<p class="section-subheading">{m.landing_how_subheading()}</p>

		<div class="steps">
			<div class="step">
				<div class="step-number">1</div>
				<div class="step-image">
					<img src={step1Img} alt="Adding daycares" />
				</div>
				<h3>{m.landing_step1_title()}</h3>
				<p>{m.landing_step1_desc()}</p>
			</div>

			<div class="step">
				<div class="step-number">2</div>
				<div class="step-image">
					<img src={step2Img} alt="Tracking progress" />
				</div>
				<h3>{m.landing_step2_title()}</h3>
				<p>{m.landing_step2_desc()}</p>
			</div>

			<div class="step">
				<div class="step-number">3</div>
				<div class="step-image">
					<img src={step3Img} alt="Collaborating with partner" />
				</div>
				<h3>{m.landing_step3_title()}</h3>
				<p>{m.landing_step3_desc()}</p>
			</div>
		</div>
	</section>

	<!-- Screenshot Section -->
	<section class="screenshot-section">
		<h2 class="section-heading">{m.landing_screenshot_heading()}</h2>
		<p class="section-subheading">{m.landing_screenshot_subheading()}</p>

		<div class="screenshot-container">
			<img src={screenshotImg} alt="GarderieFacile app interface" />
		</div>
	</section>

	<!-- Testimonials Section -->
	<section class="testimonials-section">
		<h2 class="section-heading">{m.landing_testimonials_heading()}</h2>

		<div class="testimonials">
			<div class="testimonial">
				<div class="testimonial-image">
					<img src={testimonial1Img} alt="Sarah M." />
				</div>
				<blockquote>{m.landing_testimonial1_quote()}</blockquote>
				<cite>{m.landing_testimonial1_author()}</cite>
			</div>

			<div class="testimonial">
				<div class="testimonial-image">
					<img src={testimonial2Img} alt="Marc D." />
				</div>
				<blockquote>{m.landing_testimonial2_quote()}</blockquote>
				<cite>{m.landing_testimonial2_author()}</cite>
			</div>

			<div class="testimonial">
				<div class="testimonial-image">
					<img src={testimonial3Img} alt="Julie & Thomas" />
				</div>
				<blockquote>{m.landing_testimonial3_quote()}</blockquote>
				<cite>{m.landing_testimonial3_author()}</cite>
			</div>
		</div>
	</section>

	<!-- Final CTA Section -->
	<section class="final-cta">
		<div class="cta-content">
			<h2>{m.landing_cta_heading()}</h2>
			<p>{m.landing_cta_subheading()}</p>

			<div class="cta-buttons">
				<a href="/signup" class="btn btn-primary btn-lg">{m.landing_cta_signup()}</a>
			</div>

			<p class="login-prompt">
				{m.landing_already_member()}
				<a href="/login">{m.landing_cta_login()}</a>
			</p>
		</div>

		<div class="cta-image">
			<img src={ctaImg} alt="Happy family at daycare" />
		</div>
	</section>

</div>

<style>
	.landing {
		min-height: 100vh;
		background: linear-gradient(135deg, #f5f0e8 0%, #ebe5db 100%);
		position: relative;
	}

	.language-toggle {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		display: flex;
		gap: 0.5rem;
		z-index: 100;
	}

	/* Section Styles */
	section {
		padding: 4rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.section-heading {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary, #3d3425);
		text-align: center;
		margin: 0 0 0.75rem;
	}

	.section-subheading {
		font-size: 1.1rem;
		color: var(--text-secondary, #7a6d5c);
		text-align: center;
		max-width: 600px;
		margin: 0 auto 3rem;
		line-height: 1.6;
	}

	/* Hero Section */
	.hero {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: center;
		min-height: 90vh;
		padding-top: 5rem;
	}

	.hero-content {
		text-align: left;
	}

	.logo-section {
		margin-bottom: 1.5rem;
	}

	.logo {
		max-width: 220px;
		height: auto;
	}

	.hero-headline {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 2.75rem;
		font-weight: 700;
		color: var(--text-primary, #3d3425);
		margin: 0 0 1rem;
		line-height: 1.15;
	}

	.hero-subtitle {
		font-size: 1.15rem;
		color: var(--text-secondary, #7a6d5c);
		margin: 0 0 2rem;
		line-height: 1.6;
	}

	.hero-cta {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.hero-image img {
		width: 100%;
		height: auto;
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(61, 52, 37, 0.15);
	}

	/* Features Section */
	.features-section {
		background: var(--modal-bg, #fffcf8);
		border-radius: 24px;
		margin: 2rem auto;
		padding: 4rem 3rem;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
	}

	.feature {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(61, 52, 37, 0.06);
		text-align: center;
		border: 1px solid var(--border-color, #e8dfd3);
	}

	.feature-icon {
		width: 44px;
		height: 44px;
		margin: 0 auto 1rem;
		color: var(--accent, #c47a4e);
	}

	.feature-icon svg {
		width: 100%;
		height: 100%;
	}

	.feature h3 {
		font-family: 'DM Sans', system-ui, sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #3d3425);
		margin: 0 0 0.5rem;
	}

	.feature p {
		font-size: 0.875rem;
		color: var(--text-secondary, #7a6d5c);
		margin: 0;
		line-height: 1.5;
	}

	/* How It Works Section */
	.how-it-works {
		text-align: center;
	}

	.steps {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
	}

	.step {
		position: relative;
	}

	.step-number {
		width: 40px;
		height: 40px;
		background: var(--accent, #c47a4e);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.25rem;
		margin: 0 auto 1rem;
	}

	.step-image {
		margin-bottom: 1rem;
	}

	.step-image img {
		width: 100%;
		height: 180px;
		object-fit: cover;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(61, 52, 37, 0.1);
	}

	.step h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary, #3d3425);
		margin: 0 0 0.5rem;
	}

	.step p {
		font-size: 0.9rem;
		color: var(--text-secondary, #7a6d5c);
		line-height: 1.5;
		margin: 0;
	}

	/* Screenshot Section */
	.screenshot-section {
		text-align: center;
	}

	.screenshot-container {
		max-width: 900px;
		margin: 0 auto;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(61, 52, 37, 0.15);
	}

	.screenshot-container img {
		width: 100%;
		height: auto;
		display: block;
	}

	/* Testimonials Section */
	.testimonials-section {
		background: var(--modal-bg, #fffcf8);
		border-radius: 24px;
		margin: 2rem auto;
	}

	.testimonials {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
	}

	.testimonial {
		text-align: center;
		padding: 1.5rem;
	}

	.testimonial-image {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.testimonial-image img {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 4px 12px rgba(61, 52, 37, 0.1);
	}

	.testimonial blockquote {
		font-size: 0.95rem;
		color: var(--text-primary, #3d3425);
		line-height: 1.6;
		margin: 0 0 1rem;
		font-style: italic;
	}

	.testimonial cite {
		font-size: 0.85rem;
		color: var(--text-secondary, #7a6d5c);
		font-style: normal;
		font-weight: 600;
	}

	/* Final CTA Section */
	.final-cta {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: center;
		padding: 5rem 2rem;
	}

	.cta-content h2 {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary, #3d3425);
		margin: 0 0 1rem;
	}

	.cta-content p {
		font-size: 1.1rem;
		color: var(--text-secondary, #7a6d5c);
		margin: 0 0 2rem;
		line-height: 1.6;
	}

	.cta-buttons {
		margin-bottom: 1rem;
	}

	.cta-image img {
		width: 100%;
		height: auto;
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(61, 52, 37, 0.15);
	}

	.login-prompt {
		color: var(--text-secondary, #7a6d5c);
		font-size: 0.95rem;
	}

	.login-prompt a {
		color: var(--accent, #c47a4e);
		text-decoration: none;
		font-weight: 500;
	}

	.login-prompt a:hover {
		text-decoration: underline;
	}

	/* Button Styles */
	.btn-lg {
		padding: 1rem 2rem;
		font-size: 1rem;
		border-radius: 10px;
	}

	/* Responsive */
	@media (max-width: 900px) {
		.hero {
			grid-template-columns: 1fr;
			text-align: center;
			min-height: auto;
			padding-top: 6rem;
		}

		.hero-content {
			text-align: center;
		}

		.hero-cta {
			justify-content: center;
		}

		.hero-image {
			order: -1;
		}

		.steps {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.testimonials {
			grid-template-columns: 1fr;
		}

		.final-cta {
			grid-template-columns: 1fr;
			text-align: center;
		}

		.cta-image {
			order: -1;
		}
	}

	@media (max-width: 640px) {
		section {
			padding: 3rem 1.5rem;
		}

		.hero-headline {
			font-size: 2rem;
		}

		.section-heading {
			font-size: 1.5rem;
		}

		.features {
			grid-template-columns: 1fr;
		}

		.features-section,
		.testimonials-section {
			border-radius: 16px;
			padding: 2rem 1.5rem;
			margin: 1rem;
		}

		.language-toggle {
			top: 1rem;
			right: 1rem;
		}

		.logo {
			max-width: 160px;
		}

		.btn-lg {
			padding: 0.875rem 1.5rem;
			font-size: 0.95rem;
		}
	}
</style>
