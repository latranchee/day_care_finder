<script lang="ts">
	import type { ChildInput } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		unassignedCount: number;
		onMigrate: (input: ChildInput) => void | Promise<void>;
	}

	let { unassignedCount, onMigrate }: Props = $props();

	let isSubmitting = $state(false);
	let form = $state<ChildInput>({
		name: '',
		date_of_birth: ''
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (form.name.trim() && form.date_of_birth && !isSubmitting) {
			isSubmitting = true;
			try {
				await onMigrate(form);
			} finally {
				isSubmitting = false;
			}
		}
	}
</script>

<div class="modal-backdrop" role="presentation">
	<div class="migration-modal" role="dialog" tabindex="-1">
		<div class="modal-icon">👶</div>
		<h2 class="modal-title">{m.migration_title()}</h2>
		<p class="modal-description">{m.migration_description()}</p>

		{#if unassignedCount > 0}
			<p class="migration-note">
				{m.migration_existing_daycares({ count: unassignedCount })}
			</p>
		{/if}

		<form class="migration-form" onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="child-name">{m.child_name()}</label>
				<input
					id="child-name"
					type="text"
					bind:value={form.name}
					required
					placeholder={m.placeholder_child_name()}
					disabled={isSubmitting}
				/>
			</div>

			<div class="form-group">
				<label for="child-dob">{m.child_dob()}</label>
				<input
					id="child-dob"
					type="date"
					bind:value={form.date_of_birth}
					required
					max={new Date().toISOString().split('T')[0]}
					disabled={isSubmitting}
				/>
			</div>

			<button
				type="submit"
				class="btn btn-primary"
				disabled={!form.name.trim() || !form.date_of_birth || isSubmitting}
			>
				{#if isSubmitting}
					<LoadingSpinner mode="inline" size="sm" showMessage={false} />
				{:else}
					{m.migration_submit()}
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.migration-modal {
		background: white;
		border-radius: 20px;
		padding: 2.5rem;
		max-width: 420px;
		width: 100%;
		text-align: center;
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

	.modal-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.modal-title {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary, #3d3425);
		margin: 0 0 0.75rem 0;
	}

	.modal-description {
		color: var(--text-secondary, #5a4d3d);
		font-size: 0.95rem;
		line-height: 1.5;
		margin: 0 0 1rem 0;
	}

	.migration-note {
		font-size: 0.85rem;
		color: var(--primary-color, #c47a4e);
		background: #faf7f3;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin: 0 0 1.5rem 0;
	}

	.migration-form {
		text-align: left;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary, #5a4d3d);
		margin-bottom: 0.375rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-color, #e8dfd3);
		border-radius: 8px;
		font-size: 0.95rem;
		color: var(--text-primary, #3d3425);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--primary-color, #c47a4e);
		box-shadow: 0 0 0 3px rgba(196, 122, 78, 0.1);
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem;
		font-size: 1rem;
		font-weight: 500;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		margin-top: 0.5rem;
	}

	.btn-primary {
		background: var(--primary-color, #c47a4e);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #b36a42;
	}

	.btn-primary:disabled {
		background: #d8cfc4;
		cursor: not-allowed;
	}
</style>
