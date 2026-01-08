<script lang="ts">
	import type { ChildInput, ChildWithDetails } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		child?: ChildWithDetails | null;
		onSave: (data: ChildInput) => void | Promise<void>;
		onClose: () => void;
		onDelete?: (childId: number) => void | Promise<void>;
	}

	let { child = null, onSave, onClose, onDelete }: Props = $props();

	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);

	let form = $state<ChildInput>({
		name: '',
		date_of_birth: ''
	});

	$effect(() => {
		if (child) {
			form.name = child.name || '';
			form.date_of_birth = child.date_of_birth || '';
		}
	});

	const isEditing = $derived(!!child);
	const canDelete = $derived(isEditing && child?.is_owner);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (form.name.trim() && form.date_of_birth && !isSubmitting) {
			isSubmitting = true;
			try {
				await onSave(form);
			} finally {
				isSubmitting = false;
			}
		}
	}

	async function handleDelete() {
		if (child && onDelete && !isDeleting) {
			isDeleting = true;
			try {
				await onDelete(child.id);
			} finally {
				isDeleting = false;
			}
		}
	}

	function handleBackdropClick() {
		if (!isSubmitting && !isDeleting) {
			onClose();
		}
	}
</script>

<div class="modal-backdrop" onclick={handleBackdropClick} onkeydown={(e) => e.key === 'Escape' && handleBackdropClick()} role="presentation">
	<div class="child-modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
		<button class="modal-close" onclick={onClose} aria-label={m.close()} disabled={isSubmitting || isDeleting}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6L6 18M6 6l12 12" />
			</svg>
		</button>

		<h2 class="modal-title">
			{isEditing ? m.child_edit() : m.child_add()}
		</h2>

		<form class="child-form" onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="child-name">{m.child_name()}</label>
				<input
					id="child-name"
					type="text"
					bind:value={form.name}
					required
					placeholder={m.placeholder_child_name()}
					disabled={isSubmitting || isDeleting}
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
					disabled={isSubmitting || isDeleting}
				/>
			</div>

			<div class="form-actions">
				{#if canDelete}
					{#if showDeleteConfirm}
						<div class="delete-confirm">
							<span class="delete-warning">{m.child_delete_confirm()}</span>
							<button
								type="button"
								class="btn btn-danger"
								onclick={handleDelete}
								disabled={isDeleting}
							>
								{#if isDeleting}
									<LoadingSpinner mode="inline" size="sm" showMessage={false} />
								{:else}
									{m.btn_confirm_delete()}
								{/if}
							</button>
							<button
								type="button"
								class="btn btn-secondary"
								onclick={() => showDeleteConfirm = false}
								disabled={isDeleting}
							>
								{m.btn_cancel()}
							</button>
						</div>
					{:else}
						<button
							type="button"
							class="btn btn-danger-outline"
							onclick={() => showDeleteConfirm = true}
							disabled={isSubmitting}
						>
							{m.child_delete()}
						</button>
					{/if}
				{/if}

				<div class="spacer"></div>

				<button
					type="button"
					class="btn btn-secondary"
					onclick={onClose}
					disabled={isSubmitting || isDeleting}
				>
					{m.btn_cancel()}
				</button>
				<button
					type="submit"
					class="btn btn-primary"
					disabled={!form.name.trim() || !form.date_of_birth || isSubmitting || isDeleting}
				>
					{#if isSubmitting}
						<LoadingSpinner mode="inline" size="sm" showMessage={false} />
					{:else}
						{isEditing ? m.btn_save() : m.child_add()}
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.child-modal {
		background: var(--modal-bg, white);
		border-radius: 20px;
		padding: 2rem;
		width: 100%;
		max-width: 420px;
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

	.modal-title {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary, #3d3425);
		margin: 0 0 1.5rem 0;
	}

	.child-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-group label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary, #5a4d3d);
	}

	.form-group input {
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

	.form-group input:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}

	.form-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.5rem;
		flex-wrap: wrap;
	}

	.spacer {
		flex: 1;
	}

	.delete-confirm {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.delete-warning {
		font-size: 0.85rem;
		color: #dc2626;
	}
</style>
