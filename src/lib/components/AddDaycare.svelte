<script lang="ts">
	import type { DaycareInput } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		onAdd: (data: DaycareInput) => void;
		onClose: () => void;
	}

	let { onAdd, onClose }: Props = $props();

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

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (form.name.trim()) {
			onAdd(form);
		}
	}
</script>

<div class="add-backdrop" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="presentation">
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
				<button type="button" class="btn btn-secondary" onclick={onClose}>{m.btn_cancel()}</button>
				<button type="submit" class="btn btn-primary" disabled={!form.name.trim()}>{m.btn_add_daycare()}</button>
			</div>
		</form>
	</div>
</div>

<style>
	.add-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(45, 35, 25, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 100;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.add-modal {
		--modal-bg: #fffcf8;
		--border-color: #e8dfd3;
		--text-primary: #3d3425;
		--text-secondary: #7a6d5c;
		--accent: #c47a4e;

		background: var(--modal-bg);
		border-radius: 20px;
		padding: 2rem;
		width: 100%;
		max-width: 480px;
		position: relative;
		box-shadow: 0 20px 40px rgba(45, 35, 25, 0.15);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 36px;
		height: 36px;
		border: none;
		background: transparent;
		cursor: pointer;
		color: var(--text-secondary);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:hover {
		background: rgba(0,0,0,0.05);
	}

	.modal-close svg {
		width: 20px;
		height: 20px;
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

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-group label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.form-group input {
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.95rem;
		background: white;
		color: var(--text-primary);
		transition: border-color 0.15s ease;
	}

	.form-group input::placeholder {
		color: #bbb;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.btn {
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-primary {
		background: var(--accent);
		color: white;
	}

	.btn-primary:hover {
		background: #b36a42;
	}

	.btn-primary:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #f0ebe4;
		color: var(--text-primary);
	}

	.btn-secondary:hover {
		background: #e8e2d9;
	}

	@media (max-width: 480px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
