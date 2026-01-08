<script lang="ts">
	import type { Review } from '$lib/types';
	import LoadingSpinner from '../LoadingSpinner.svelte';
	import ListSection from '../ListSection.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { formatDate as formatDateUtil } from '$lib/utils/formatting';

	interface Props {
		daycareId: number;
		onRatingUpdate: (newRating: number | null) => void;
	}

	let { daycareId, onRatingUpdate }: Props = $props();

	let reviews = $state<Review[]>([]);
	let newReview = $state({ text: '', source_url: '', rating: 5 });
	let loadingReviews = $state(false);
	let isAddingReview = $state(false);
	let showReviewForm = $state(false);
	let deletingReviewId = $state<number | null>(null);
	let error = $state<string | null>(null);

	function clearError() {
		error = null;
	}

	function setError(message: string) {
		error = message;
		setTimeout(() => error = null, 5000);
	}

	$effect(() => {
		if (daycareId) {
			loadReviews();
		}
	});

	async function loadReviews() {
		loadingReviews = true;
		clearError();
		try {
			const res = await fetch(`/api/daycares/${daycareId}/reviews`);
			reviews = await res.json();
		} catch (e) {
			console.error('Failed to load reviews:', e);
			setError(m.error_load_reviews());
		}
		loadingReviews = false;
	}

	async function addReview() {
		if (!newReview.text.trim() || isAddingReview) return;
		isAddingReview = true;
		clearError();
		try {
			const res = await fetch(`/api/daycares/${daycareId}/reviews`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					text: newReview.text.trim(),
					source_url: newReview.source_url.trim(),
					rating: newReview.rating
				})
			});
			if (res.ok) {
				const review = await res.json();
				reviews = [review, ...reviews];
				newReview = { text: '', source_url: '', rating: 5 };
				showReviewForm = false;
				// Fetch the actual rating from the server (source of truth)
				const daycareRes = await fetch(`/api/daycares/${daycareId}`);
				if (daycareRes.ok) {
					const daycare = await daycareRes.json();
					onRatingUpdate(daycare.rating);
				}
			} else {
				setError(m.error_add_review());
			}
		} catch (e) {
			console.error('Failed to add review:', e);
			setError(m.error_add_review());
		} finally {
			isAddingReview = false;
		}
	}

	async function deleteReview(reviewId: number) {
		if (deletingReviewId !== null) return;
		deletingReviewId = reviewId;
		clearError();
		try {
			const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
			if (res.ok) {
				reviews = reviews.filter((r) => r.id !== reviewId);
				// Fetch the actual rating from the server (source of truth)
				const daycareRes = await fetch(`/api/daycares/${daycareId}`);
				if (daycareRes.ok) {
					const daycare = await daycareRes.json();
					onRatingUpdate(daycare.rating);
				}
			} else {
				setError(m.error_delete_review());
			}
		} catch (e) {
			console.error('Failed to delete review:', e);
			setError(m.error_delete_review());
		} finally {
			deletingReviewId = null;
		}
	}

	function formatDate(dateStr: string): string {
		const locale = getLocale() === 'fr' ? 'fr' : 'en';
		return formatDateUtil(dateStr, locale);
	}
</script>

<h3 class="reviews-title">{m.section_reviews({ count: reviews.length })}</h3>

{#if error}
	<p class="error-message">{error}</p>
{/if}

{#if showReviewForm}
	<div class="review-input">
		<div class="rating-input">
			<span class="rating-label">{m.label_rating()}</span>
			<div class="star-selector" role="group" aria-label={m.label_rating()}>
				{#each [1, 2, 3, 4, 5] as star}
					<button
						type="button"
						class="star-btn"
						class:filled={star <= newReview.rating}
						onclick={() => newReview.rating = star}
					>
						&#9733;
					</button>
				{/each}
			</div>
		</div>

		<textarea
			bind:value={newReview.text}
			placeholder={m.placeholder_write_review()}
			rows="3"
		></textarea>

		<input
			type="url"
			bind:value={newReview.source_url}
			placeholder={m.placeholder_source_url()}
		/>

		<div class="review-form-actions">
			<button
				class="btn btn-secondary btn-sm"
				onclick={() => { showReviewForm = false; newReview = { text: '', source_url: '', rating: 5 }; }}
			>
				{m.btn_cancel()}
			</button>
			<button
				class="btn btn-primary btn-sm"
				onclick={addReview}
				disabled={!newReview.text.trim() || isAddingReview}
			>
				{#if isAddingReview}
					<LoadingSpinner mode="inline" size="sm" showMessage={false} />
				{:else}
					{m.btn_add_review()}
				{/if}
			</button>
		</div>
	</div>
{:else}
	<button class="btn btn-secondary btn-sm add-review-btn" onclick={() => showReviewForm = true}>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="add-icon">
			<line x1="12" y1="5" x2="12" y2="19"/>
			<line x1="5" y1="12" x2="19" y2="12"/>
		</svg>
		{m.btn_add_review()}
	</button>
{/if}

<ListSection loading={loadingReviews} items={reviews} loadingMessage={m.loading_reviews()} emptyMessage={m.empty_reviews()}>
	{#snippet children(review)}
		<div class="review-item">
			<div class="review-header">
				<span class="review-stars">
					{#each Array(5) as _, i}
						<span class="star" class:filled={i < review.rating}>&#9733;</span>
					{/each}
				</span>
				{#if review.source_url}
					<a href={review.source_url} target="_blank" rel="noopener" class="review-link">
						{m.btn_view_source()}
					</a>
				{/if}
			</div>
			<p class="review-content">{review.text}</p>
			<div class="review-footer">
				<span class="review-date">{formatDate(review.created_at)}</span>
				<button
					class="review-delete"
					onclick={() => deleteReview(review.id)}
					disabled={deletingReviewId === review.id}
					aria-label={m.btn_delete()}
				>
					{#if deletingReviewId === review.id}
						<LoadingSpinner mode="inline" size="sm" showMessage={false} />
					{:else}
						&times;
					{/if}
				</button>
			</div>
		</div>
	{/snippet}
</ListSection>

<style>
	.reviews-title {
		font-family: 'DM Sans', system-ui, sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
	}

	.error-message {
		font-size: 0.85rem;
		color: #c44e4e;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 0.75rem;
		margin-bottom: 1rem;
		text-align: center;
	}

	.review-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.rating-input {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.rating-label {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.star-selector {
		display: flex;
		gap: 0.25rem;
	}

	.star-btn {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: #ddd;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s ease;
	}

	.star-btn.filled {
		color: var(--accent);
	}

	.star-btn:hover {
		color: var(--accent);
	}

	.review-input input[type="url"] {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.85rem;
		background: white;
	}

	.review-input input[type="url"]:focus {
		outline: none;
		border-color: var(--accent);
	}

	.review-input textarea {
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.9rem;
		resize: vertical;
		font-family: inherit;
		background: white;
	}

	.review-input textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.review-item {
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		padding: 0.875rem;
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.review-stars {
		display: flex;
		gap: 0.125rem;
	}

	.review-stars .star {
		font-size: 0.875rem;
		color: #ddd;
	}

	.review-stars .star.filled {
		color: var(--accent);
	}

	.review-link {
		font-size: 0.75rem;
		color: var(--accent);
		text-decoration: none;
	}

	.review-link:hover {
		text-decoration: underline;
	}

	.review-content {
		font-size: 0.9rem;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		white-space: pre-wrap;
		line-height: 1.5;
	}

	.review-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.review-date {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.review-delete {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0 0.25rem;
		line-height: 1;
		opacity: 0.5;
		transition: opacity 0.15s ease;
	}

	.review-delete:hover {
		opacity: 1;
		color: #c44e4e;
	}

	.review-form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.add-review-btn {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		margin-bottom: 1rem;
	}

	.add-icon {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
	}
</style>
