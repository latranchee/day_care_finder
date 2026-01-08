<script lang="ts">
	import type { DaycareInput } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		onAdd: (data: DaycareInput) => void | Promise<void>;
		onClose: () => void;
	}

	let { onAdd, onClose }: Props = $props();

	let isSubmitting = $state(false);
	let form = $state<DaycareInput>({
		name: '',
		address: '',
		phone: '',
		facebook: '',
		website: '',
		capacity: null,
		price: '',
		hours: '',
		age_range: '',
		rating: null
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (form.name.trim() && !isSubmitting) {
			isSubmitting = true;
			try {
				await onAdd(form);
			} finally {
				isSubmitting = false;
			}
		}
	}
</script>

<div class="modal-backdrop" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="presentation">
	<div class="add-modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
		<button class="modal-close" onclick={onClose} aria-label={m.close()}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6L6 18M6 6l12 12" />
			</svg>
		</button>

		<h2 class="add-title">{m.modal_add_daycare()}</h2>

		<form class="add-form" onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="name">{m.label_name_required()}</label>
				<input id="name" type="text" bind:value={form.name} required placeholder={m.placeholder_daycare_name()} />
			</div>

			<div class="form-group">
				<label for="address">{m.label_address()}</label>
				<input id="address" type="text" bind:value={form.address} placeholder={m.placeholder_full_address()} />
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="phone">{m.label_phone()}</label>
					<input id="phone" type="tel" bind:value={form.phone} placeholder={m.placeholder_phone()} />
				</div>
				<div class="form-group">
					<label for="website">{m.label_website()}</label>
					<input id="website" type="url" bind:value={form.website} placeholder={m.placeholder_website()} />
				</div>
			</div>

			<div class="form-group">
				<label for="facebook">{m.label_facebook()}</label>
				<input id="facebook" type="url" bind:value={form.facebook} placeholder={m.placeholder_facebook()} />
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="price">{m.label_price()}</label>
					<input id="price" type="text" bind:value={form.price} placeholder={m.placeholder_price()} />
				</div>
				<div class="form-group">
					<label for="capacity">{m.label_capacity()}</label>
					<input id="capacity" type="number" bind:value={form.capacity} placeholder={m.placeholder_capacity()} />
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="hours">{m.label_hours()}</label>
					<input id="hours" type="text" bind:value={form.hours} placeholder={m.placeholder_hours()} />
				</div>
				<div class="form-group">
					<label for="age_range">{m.label_age_range()}</label>
					<input id="age_range" type="text" bind:value={form.age_range} placeholder={m.placeholder_age_range()} />
				</div>
			</div>

			<div class="form-group">
				<label for="rating">{m.label_rating_range()}</label>
				<input id="rating" type="number" min="1" max="5" step="0.5" bind:value={form.rating} placeholder={m.placeholder_rating()} />
			</div>

			<div class="form-actions">
				<button type="button" class="btn btn-secondary" onclick={onClose} disabled={isSubmitting}>{m.btn_cancel()}</button>
				<button type="submit" class="btn btn-primary" disabled={!form.name.trim() || isSubmitting}>
					{#if isSubmitting}
						<LoadingSpinner mode="inline" size="sm" showMessage={false} />
					{:else}
						{m.btn_add_daycare()}
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	/* Base modal-backdrop, modal-close, btn, form-group, form-row, form-actions from shared.css */

	.add-modal {
		background: var(--modal-bg);
		border-radius: 20px;
		padding: 2rem;
		width: 100%;
		max-width: 560px;
		position: relative;
		box-shadow: 0 20px 40px rgba(45, 35, 25, 0.15);
		animation: slideUp 0.3s ease-out;
	}

	.add-title {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1.5rem 0;
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Ensure inputs in this modal take full width */
	.add-form :global(.form-group input) {
		width: 100%;
		box-sizing: border-box;
	}
</style>
