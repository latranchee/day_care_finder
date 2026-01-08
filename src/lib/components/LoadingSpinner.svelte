<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		mode?: 'inline' | 'overlay' | 'standalone';
		size?: 'sm' | 'md' | 'lg';
		showMessage?: boolean;
		messageInterval?: number;
	}

	let {
		mode = 'standalone',
		size = 'md',
		showMessage = true,
		messageInterval = 2000
	}: Props = $props();

	// Array of loading message functions
	const messages = [
		m.loading_message_1,
		m.loading_message_2,
		m.loading_message_3,
		m.loading_message_4,
		m.loading_message_5,
		m.loading_message_6,
		m.loading_message_7,
		m.loading_message_8
	];

	let currentMessageIndex = $state(Math.floor(Math.random() * messages.length));
	let intervalId: ReturnType<typeof setInterval> | undefined;

	onMount(() => {
		if (showMessage && mode !== 'inline') {
			intervalId = setInterval(() => {
				currentMessageIndex = (currentMessageIndex + 1) % messages.length;
			}, messageInterval);
		}
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
	});

	const sizeClass = $derived(size === 'md' ? '' : size);
	const modeClass = $derived(mode === 'standalone' ? '' : mode);
</script>

{#if mode === 'overlay'}
	<div class="loading-overlay">
		<div class="loading-spinner {sizeClass}" role="status" aria-live="polite">
			<div class="loading-dots">
				<div class="loading-dot"></div>
				<div class="loading-dot"></div>
				<div class="loading-dot"></div>
			</div>
			{#if showMessage}
				{#key currentMessageIndex}
					<span class="loading-message">{messages[currentMessageIndex]()}</span>
				{/key}
			{/if}
		</div>
	</div>
{:else}
	<div class="loading-spinner {sizeClass} {modeClass}" role="status" aria-live="polite">
		<div class="loading-dots">
			<div class="loading-dot"></div>
			<div class="loading-dot"></div>
			<div class="loading-dot"></div>
		</div>
		{#if showMessage && mode !== 'inline'}
			{#key currentMessageIndex}
				<span class="loading-message">{messages[currentMessageIndex]()}</span>
			{/key}
		{/if}
	</div>
{/if}
