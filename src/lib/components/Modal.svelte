<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		onClose: () => void;
		title?: string;
		size?: 'sm' | 'md' | 'lg';
		children: Snippet;
	}

	let { onClose, title, size = 'md', children }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	function handleBackdropClick() {
		onClose();
	}

	function handleModalClick(e: MouseEvent) {
		e.stopPropagation();
	}

	function handleModalKeydown(e: KeyboardEvent) {
		e.stopPropagation();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="modal-backdrop"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="presentation"
>
	<div
		class="modal modal-{size}"
		onclick={handleModalClick}
		onkeydown={handleModalKeydown}
		role="dialog"
		aria-modal="true"
		aria-label={title || m.close_modal()}
		tabindex="-1"
	>
		<button class="modal-close" onclick={onClose} aria-label={m.close()}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6L6 18M6 6l12 12" />
			</svg>
		</button>

		{#if title}
			<h2 class="modal-title">{title}</h2>
		{/if}

		{@render children()}
	</div>
</div>

<style>
	/* Modal size variants */
	.modal {
		background: var(--modal-bg);
		border-radius: 20px;
		padding: 2rem;
		width: 100%;
		position: relative;
		box-shadow: 0 20px 40px rgba(45, 35, 25, 0.15);
		animation: slideUp 0.3s ease-out;
	}

	.modal-sm {
		max-width: 400px;
	}

	.modal-md {
		max-width: 560px;
	}

	.modal-lg {
		max-width: 900px;
		max-height: 90vh;
		overflow-y: auto;
		padding: 0;
	}

	.modal-title {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1.5rem 0;
	}

	/* slideUp animation is in shared.css */
</style>
