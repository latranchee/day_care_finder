<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		loading: boolean;
		items: T[];
		loadingMessage: string;
		emptyMessage: string;
		children: Snippet<[T]>;
	}

	let { loading, items, loadingMessage, emptyMessage, children }: Props = $props();
</script>

<div class="list-container">
	{#if loading}
		<div class="state-loading">
			<LoadingSpinner mode="inline" size="sm" showMessage={false} />
			<span>{loadingMessage}</span>
		</div>
	{:else if items.length === 0}
		<p class="state-empty">{emptyMessage}</p>
	{:else}
		{#each items as item, index (index)}
			{@render children(item)}
		{/each}
	{/if}
</div>

<style>
	.list-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.state-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		padding: 2rem 0;
	}

	.state-empty {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
		padding: 2rem 0;
	}
</style>
