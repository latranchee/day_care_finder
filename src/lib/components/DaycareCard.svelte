<script lang="ts">
	import type { Daycare } from '$lib/types';

	interface Props {
		daycare: Daycare;
		onSelect: (daycare: Daycare) => void;
		onHide?: (id: number) => void;
	}

	let { daycare, onSelect, onHide }: Props = $props();

	function formatRating(rating: number | null): string {
		if (rating === null) return '—';
		return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
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
			title={daycare.hidden ? 'Show card' : 'Hide card'}
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
			<span class="card-rating" title="{daycare.rating} out of 5">
				{formatRating(daycare.rating)}
			</span>
		{/if}
	</div>

	{#if daycare.address}
		<p class="card-address">
			<svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
				<circle cx="12" cy="10" r="3"/>
			</svg>
			{daycare.address}
		</p>
	{/if}

	<div class="card-meta">
		{#if daycare.price}
			<span class="meta-tag price">{daycare.price}</span>
		{/if}
		{#if daycare.age_range}
			<span class="meta-tag age">{daycare.age_range}</span>
		{/if}
	</div>
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
</style>
