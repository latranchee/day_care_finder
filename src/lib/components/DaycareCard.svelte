<script lang="ts">
	import type { Daycare, Review, Contact } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';

	interface CardSettings {
		showAddress: boolean;
		showPhone: boolean;
		showEmail: boolean;
		showPrice: boolean;
		showAgeRange: boolean;
		showFacebook: boolean;
		showContacts: boolean;
		showReview: boolean;
		showCommuteTime: boolean;
	}

	interface Props {
		daycare: Daycare;
		firstReview?: Review | null;
		primaryContact?: Contact | null;
		contactCount?: number;
		cardSettings: CardSettings;
		onSelect: (daycare: Daycare) => void;
		onHide?: (id: number) => void;
	}

	let { daycare, firstReview = null, primaryContact = null, contactCount = 0, cardSettings, onSelect, onHide }: Props = $props();

	function formatRating(rating: number | null): string {
		if (rating === null) return '—';
		return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
	}

	function truncateText(text: string, maxLength: number = 80): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trim() + '...';
	}

	function handleHide(e: MouseEvent) {
		e.stopPropagation();
		onHide?.(daycare.id);
	}
</script>

<div
	class="daycare-card"
	class:hidden={daycare.hidden}
	onclick={() => onSelect(daycare)}
	onkeydown={(e) => e.key === 'Enter' && onSelect(daycare)}
	role="button"
	tabindex="0"
>
	{#if onHide}
		<button
			class="hide-btn"
			onclick={handleHide}
			type="button"
			title={daycare.hidden ? m.card_show() : m.card_hide()}
		>
			{#if daycare.hidden}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
					<circle cx="12" cy="12" r="3"/>
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
					<line x1="1" y1="1" x2="23" y2="23"/>
				</svg>
			{/if}
		</button>
	{/if}
	<div class="card-header">
		<h3 class="card-title">{daycare.name}</h3>
		{#if daycare.rating}
			<span class="card-rating" title={m.rating_out_of({ rating: daycare.rating })}>
				{formatRating(daycare.rating)}
			</span>
		{/if}
	</div>

	{#if cardSettings.showAddress && daycare.address}
		<p class="card-address">
			<svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
				<circle cx="12" cy="10" r="3"/>
			</svg>
			{daycare.address}
		</p>
	{/if}

	<div class="card-meta">
		{#if cardSettings.showPrice && daycare.price}
			<span class="meta-tag price">{daycare.price}</span>
		{/if}
		{#if cardSettings.showAgeRange && daycare.age_range}
			<span class="meta-tag age">{daycare.age_range}</span>
		{/if}
		{#if cardSettings.showPhone && daycare.phone}
			<a
				href="tel:{daycare.phone}"
				class="meta-tag phone"
				onclick={(e) => e.stopPropagation()}
			>
				<svg class="phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
				</svg>
				{daycare.phone}
			</a>
		{/if}
		{#if cardSettings.showEmail && daycare.email}
			<a
				href="mailto:{daycare.email}"
				class="meta-tag email"
				onclick={(e) => e.stopPropagation()}
			>
				<svg class="email-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
					<polyline points="22,6 12,13 2,6"/>
				</svg>
				{daycare.email}
			</a>
		{/if}
		{#if cardSettings.showFacebook && daycare.facebook}
			<a
				href={daycare.facebook}
				target="_blank"
				rel="noopener"
				class="meta-tag facebook"
				title={m.view_facebook()}
				onclick={(e) => e.stopPropagation()}
			>
				<svg class="facebook-icon" viewBox="0 0 24 24" fill="currentColor">
					<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
				</svg>
			</a>
		{/if}
		{#if cardSettings.showContacts && contactCount > 0}
			<span
				class="meta-tag contacts"
				title={primaryContact ? `${primaryContact.name}${primaryContact.role ? ` (${primaryContact.role})` : ''}` : (contactCount > 1 ? m.contact_count_plural({ count: contactCount }) : m.contact_count({ count: contactCount }))}
			>
				<svg class="contacts-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
					<circle cx="9" cy="7" r="4"/>
					<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
					<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
				</svg>
				{contactCount}
			</span>
		{/if}
		{#if cardSettings.showCommuteTime && daycare.commute_minutes !== null}
			<span class="meta-tag commute" title="Commute time from home">
				<svg class="commute-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"/>
					<polyline points="12 6 12 12 16 14"/>
				</svg>
				{daycare.commute_minutes} min
			</span>
		{/if}
	</div>

	{#if cardSettings.showReview && firstReview}
		<div class="review-preview">
			<div class="review-header">
				<span class="review-rating">{'★'.repeat(firstReview.rating)}{'☆'.repeat(5 - firstReview.rating)}</span>
				{#if firstReview.source_url}
					<a
						href={firstReview.source_url}
						target="_blank"
						rel="noopener"
						class="review-source"
						onclick={(e) => e.stopPropagation()}
					>
						{m.source()}
					</a>
				{/if}
			</div>
			<p class="review-text">{truncateText(firstReview.text)}</p>
		</div>
	{/if}
</div>

<style>
	.daycare-card {
		--card-bg: #fffbf5;
		--card-border: #e8dfd3;
		--card-shadow: rgba(139, 109, 76, 0.08);
		--text-primary: #3d3425;
		--text-secondary: #7a6d5c;
		--accent-warm: #c47a4e;
		--tag-price-bg: #f0ebe4;
		--tag-age-bg: #e8f0e8;

		display: block;
		width: 100%;
		padding: 1rem;
		background: var(--card-bg);
		border: 1px solid var(--card-border);
		border-radius: 12px;
		box-shadow:
			0 2px 4px var(--card-shadow),
			0 4px 12px var(--card-shadow);
		cursor: pointer;
		text-align: left;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.daycare-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--accent-warm), #d4956a);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.daycare-card:hover {
		transform: translateY(-2px);
		box-shadow:
			0 4px 8px var(--card-shadow),
			0 8px 24px var(--card-shadow);
	}

	.daycare-card:hover::before {
		opacity: 1;
	}

	.daycare-card:active {
		transform: translateY(0);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.card-title {
		font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.3;
	}

	.card-rating {
		font-size: 0.65rem;
		color: var(--accent-warm);
		letter-spacing: -1px;
		flex-shrink: 0;
	}

	.card-address {
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin: 0 0 0.75rem 0;
		line-height: 1.4;
	}

	.card-icon {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		margin-top: 2px;
		opacity: 0.6;
	}

	.card-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.meta-tag {
		font-size: 0.7rem;
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		letter-spacing: 0.02em;
	}

	.meta-tag.price {
		background: var(--tag-price-bg);
		color: #6b5a47;
	}

	.meta-tag.age {
		background: var(--tag-age-bg);
		color: #4a5f4a;
	}

	.meta-tag.phone {
		background: #e8f0e8;
		color: #4a6a5a;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		text-decoration: none;
	}

	.meta-tag.phone:hover {
		background: #d8e8d8;
	}

	.phone-icon {
		width: 12px;
		height: 12px;
		flex-shrink: 0;
	}

	.meta-tag.email {
		background: #e8eaf0;
		color: #4a5a6a;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		text-decoration: none;
	}

	.meta-tag.email:hover {
		background: #d8dae8;
	}

	.email-icon {
		width: 12px;
		height: 12px;
		flex-shrink: 0;
	}

	.meta-tag.facebook {
		background: #e8eaf4;
		color: #1877f2;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		text-decoration: none;
	}

	.meta-tag.facebook:hover {
		background: #d0d8f0;
	}

	.facebook-icon {
		width: 12px;
		height: 12px;
	}

	.meta-tag.contacts {
		background: #e8f4e8;
		color: #4a6a4a;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.contacts-icon {
		width: 12px;
		height: 12px;
	}

	.meta-tag.commute {
		background: #f0e8f4;
		color: #6a4a7a;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.commute-icon {
		width: 12px;
		height: 12px;
	}

	/* Hide button - appears on hover */
	.hide-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 24px;
		height: 24px;
		padding: 4px;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid var(--card-border);
		border-radius: 6px;
		cursor: pointer;
		opacity: 0;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.hide-btn svg {
		width: 14px;
		height: 14px;
		color: var(--text-secondary);
	}

	.daycare-card:hover .hide-btn {
		opacity: 1;
	}

	.hide-btn:hover {
		background: #f0ebe4;
		border-color: var(--accent-warm);
	}

	.hide-btn:hover svg {
		color: var(--accent-warm);
	}

	/* Hidden card styling */
	.daycare-card.hidden {
		opacity: 0.5;
		filter: grayscale(0.4);
	}

	.daycare-card.hidden:hover {
		opacity: 0.7;
	}

	.daycare-card.hidden .hide-btn {
		opacity: 0.8;
	}

	/* Review preview styling */
	.review-preview {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px dashed var(--card-border);
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.375rem;
	}

	.review-rating {
		font-size: 0.6rem;
		color: var(--accent-warm);
		letter-spacing: -1px;
	}

	.review-source {
		font-size: 0.7rem;
		color: var(--accent-warm);
		text-decoration: none;
	}

	.review-source:hover {
		text-decoration: underline;
	}

	.review-text {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
		font-style: italic;
	}
</style>
