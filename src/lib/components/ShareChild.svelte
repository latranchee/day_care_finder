<script lang="ts">
	import type { ChildWithDetails, Invitation } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		child: ChildWithDetails;
		invitation: Invitation | null;
		loading?: boolean;
		onGenerateCode: () => Promise<void>;
		onRevokeCode: () => Promise<void>;
		onRemoveCollaborator: (userId: number) => Promise<void>;
		onEditChild: () => void;
		onClose: () => void;
	}

	let { child, invitation, loading = false, onGenerateCode, onRevokeCode, onRemoveCollaborator, onEditChild, onClose }: Props = $props();

	let isGenerating = $state(false);
	let isRevoking = $state(false);
	let removingUserId = $state<number | null>(null);
	let copied = $state(false);

	const inviteCode = $derived(invitation?.code ? `${invitation.code.slice(0, 4)}-${invitation.code.slice(4)}` : null);
	const inviteUrl = $derived(invitation?.code ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${invitation.code}` : null);
	const isExpired = $derived(invitation ? new Date(invitation.expires_at) < new Date() : false);
	const expiresDate = $derived(invitation ? new Date(invitation.expires_at).toLocaleDateString() : null);

	async function handleGenerateCode() {
		isGenerating = true;
		try {
			await onGenerateCode();
		} finally {
			isGenerating = false;
		}
	}

	async function handleRevokeCode() {
		isRevoking = true;
		try {
			await onRevokeCode();
		} finally {
			isRevoking = false;
		}
	}

	async function handleRemoveCollaborator(userId: number) {
		removingUserId = userId;
		try {
			await onRemoveCollaborator(userId);
		} finally {
			removingUserId = null;
		}
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => copied = false, 2000);
		} catch {
			// Fallback for older browsers
			const input = document.createElement('input');
			input.value = text;
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
			copied = true;
			setTimeout(() => copied = false, 2000);
		}
	}
</script>

<div class="modal-backdrop" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="presentation">
	<div class="share-modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
		<button class="modal-close" onclick={onClose} aria-label={m.close()}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6L6 18M6 6l12 12" />
			</svg>
		</button>

		<div class="modal-header">
			<h2 class="modal-title">{child.name}</h2>
			<button class="edit-btn" onclick={onEditChild} title={m.child_edit()}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
				</svg>
			</button>
		</div>

		<div class="share-section">
			<h3 class="section-title">{m.share_title()}</h3>

			{#if loading}
				<div class="loading-container">
					<LoadingSpinner mode="standalone" showMessage={true} />
				</div>
			{:else if invitation && !isExpired}
				<div class="invite-code-box">
					<span class="code-label">{m.share_code_label()}</span>
					<div class="code-row">
						<span class="code-value">{inviteCode}</span>
						<button
							class="btn btn-sm"
							onclick={() => copyToClipboard(invitation.code)}
						>
							{copied ? m.share_copied() : m.share_copy()}
						</button>
						<button
							class="btn btn-sm btn-secondary"
							onclick={handleRevokeCode}
							disabled={isRevoking}
						>
							{#if isRevoking}
								<LoadingSpinner mode="inline" size="sm" showMessage={false} />
							{:else}
								{m.share_revoke()}
							{/if}
						</button>
					</div>
					<div class="expires">{m.share_expires({ date: expiresDate || '' })}</div>
				</div>

				<div class="invite-link-box">
					<span class="code-label">{m.share_link_label()}</span>
					<div class="link-row">
						<input type="text" readonly value={inviteUrl} class="link-input" />
						<button
							class="btn btn-sm"
							onclick={() => inviteUrl && copyToClipboard(inviteUrl)}
						>
							{copied ? m.share_copied() : m.share_copy()}
						</button>
					</div>
				</div>
			{:else}
				<p class="no-invite">{m.share_no_invite()}</p>
				<button
					class="btn btn-primary"
					onclick={handleGenerateCode}
					disabled={isGenerating}
				>
					{#if isGenerating}
						<LoadingSpinner mode="inline" size="sm" showMessage={false} />
					{:else}
						{m.share_generate()}
					{/if}
				</button>
			{/if}
		</div>

		<div class="parents-section">
			<h3 class="section-title">{m.share_parents_title()}</h3>
			<ul class="parents-list">
				{#each child.parents as parent (parent.id)}
					<li class="parent-item">
						<div class="parent-info">
							<span class="parent-name">{parent.name || parent.email}</span>
							<span class="parent-role">
								{parent.role === 'owner' ? m.share_owner() : m.share_collaborator()}
							</span>
						</div>
						{#if parent.role === 'collaborator' && child.is_owner}
							<button
								class="remove-btn"
								onclick={() => handleRemoveCollaborator(parent.id)}
								disabled={removingUserId === parent.id}
								title={m.share_remove()}
							>
								{#if removingUserId === parent.id}
									<LoadingSpinner mode="inline" size="sm" showMessage={false} />
								{:else}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M18 6L6 18M6 6l12 12" />
									</svg>
								{/if}
							</button>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>

<style>
	.share-modal {
		background: var(--modal-bg, white);
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

	.modal-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.modal-title {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary, #3d3425);
		margin: 0;
	}

	.edit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: none;
		border: 1px solid var(--border-color, #e8dfd3);
		border-radius: 8px;
		cursor: pointer;
		color: var(--text-secondary, #8b7355);
		transition: all 0.15s ease;
	}

	.edit-btn:hover {
		border-color: var(--primary-color, #c47a4e);
		color: var(--primary-color, #c47a4e);
	}

	.edit-btn svg {
		width: 18px;
		height: 18px;
	}

	.share-section,
	.parents-section {
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary, #3d3425);
		margin: 0 0 0.75rem 0;
	}

	.invite-code-box,
	.invite-link-box {
		background: #faf7f3;
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 0.75rem;
	}

	.code-label {
		display: block;
		font-size: 0.8rem;
		color: var(--text-secondary, #8b7355);
		margin-bottom: 0.5rem;
	}

	.code-row,
	.link-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.code-value {
		font-family: monospace;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--primary-color, #c47a4e);
		letter-spacing: 0.1em;
	}

	.link-input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--border-color, #e8dfd3);
		border-radius: 6px;
		font-size: 0.85rem;
		color: var(--text-primary, #3d3425);
		background: white;
	}

	.expires {
		font-size: 0.8rem;
		color: var(--text-secondary, #8b7355);
		margin-top: 0.5rem;
	}

	.no-invite {
		color: var(--text-secondary, #8b7355);
		font-size: 0.9rem;
		margin: 0 0 0.75rem 0;
	}

	.parents-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.parent-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--border-color, #e8dfd3);
	}

	.parent-item:last-child {
		border-bottom: none;
	}

	.parent-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.parent-name {
		font-weight: 500;
		color: var(--text-primary, #3d3425);
	}

	.parent-role {
		font-size: 0.8rem;
		color: var(--text-secondary, #8b7355);
	}

	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: none;
		border: 1px solid transparent;
		border-radius: 6px;
		cursor: pointer;
		color: var(--text-secondary, #8b7355);
		transition: all 0.15s ease;
	}

	.remove-btn:hover {
		background: #fee2e2;
		border-color: #fecaca;
		color: #dc2626;
	}

	.remove-btn svg {
		width: 16px;
		height: 16px;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.85rem;
	}

	.loading-container {
		display: flex;
		justify-content: center;
		padding: 1.5rem;
	}
</style>
