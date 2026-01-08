<script lang="ts">
	import type { DaycareInput } from '$lib/types';
	import Modal from './Modal.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import AddressAutocomplete from './AddressAutocomplete.svelte';

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

<Modal {onClose} title={m.modal_add_daycare()} size="md">
	<form class="add-form" onsubmit={handleSubmit}>
		<div class="form-group">
			<label for="name">{m.label_name_required()}</label>
			<input id="name" type="text" bind:value={form.name} required placeholder={m.placeholder_daycare_name()} />
		</div>

		<div class="form-group">
			<label for="address">{m.label_address()}</label>
			<AddressAutocomplete
				id="address"
				bind:value={form.address}
				placeholder={m.placeholder_full_address()}
			/>
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
</Modal>

<style>
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
