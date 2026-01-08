<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import type { Daycare, Stage, DaycareWithExtras, CardSettings } from '$lib/types';
	import DaycareCard from './DaycareCard.svelte';

	interface Props {
		stage: { id: Stage; label: string };
		items: DaycareWithExtras[];
		cardSettings: CardSettings;
		onDndConsider: (e: CustomEvent) => void;
		onDndFinalize: (e: CustomEvent) => void;
		onSelectDaycare: (daycare: Daycare) => void;
		onHideDaycare?: (id: number) => void;
	}

	let { stage, items, cardSettings, onDndConsider, onDndFinalize, onSelectDaycare, onHideDaycare }: Props = $props();

	const stageColors: Record<Stage, { bg: string; border: string; header: string }> = {
		to_research: { bg: '#faf8f5', border: '#e8e2d9', header: '#8b7355' },
		to_contact: { bg: '#f8faf8', border: '#dde8dd', header: '#5f7a5f' },
		contacted: { bg: '#f5f8fa', border: '#d9e2e8', header: '#557588' },
		visited: { bg: '#faf8f5', border: '#e8dfd3', header: '#8b6b4e' },
		waitlisted: { bg: '#faf5f8', border: '#e8d9e2', header: '#885570' },
		decision_made: { bg: '#f5faf8', border: '#d3e8df', header: '#4e8b6b' }
	};

	const stageIcons: Record<Stage, string> = {
		to_research: '🔍',
		to_contact: '📞',
		contacted: '💬',
		visited: '👀',
		waitlisted: '⏳',
		decision_made: '✓'
	};

	$effect(() => {
		const colors = stageColors[stage.id];
		document.documentElement.style.setProperty(`--col-${stage.id}-bg`, colors.bg);
	});
</script>

<div
	class="kanban-column"
	style="--col-bg: {stageColors[stage.id].bg}; --col-border: {stageColors[stage.id].border}; --col-header: {stageColors[stage.id].header};"
>
	<div class="column-header">
		<span class="column-icon">{stageIcons[stage.id]}</span>
		<h2 class="column-title">{stage.label}</h2>
		<span class="column-count">{items.length}</span>
	</div>

	<div
		class="column-content"
		use:dndzone={{
			items,
			flipDurationMs: 0,
			morphDisabled: true,
			centreDraggedOnCursor: true,
			dropTargetStyle: {},
			type: 'daycare'
		}}
		onconsider={onDndConsider}
		onfinalize={onDndFinalize}
	>
		{#each items as item (item.id)}
			<div class="card-wrapper">
				<DaycareCard daycare={item} firstReview={item.firstReview} primaryContact={item.primaryContact} contactCount={item.contactCount} {cardSettings} onSelect={onSelectDaycare} onHide={onHideDaycare} />
			</div>
		{/each}
	</div>
</div>

<style>
	.kanban-column {
		display: flex;
		flex-direction: column;
		min-width: 280px;
		max-width: 320px;
		flex: 1;
		background: var(--col-bg);
		border: 1px solid var(--col-border);
		border-radius: 16px;
		overflow: hidden;
	}

	.column-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1rem 0.75rem;
		border-bottom: 1px solid var(--col-border);
		background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%);
	}

	.column-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.column-title {
		font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--col-header);
		margin: 0;
		flex: 1;
		letter-spacing: -0.01em;
	}

	.column-count {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--col-header);
		background: rgba(0,0,0,0.05);
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
		min-width: 1.5rem;
		text-align: center;
	}

	.column-content {
		padding: 0.75rem;
		overflow-y: auto;
		min-height: 100px;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	/* Hide shadow placeholder so column can shrink */
	.column-content > :global([data-is-dnd-shadow-item-hint]) {
		display: none !important;
	}

	/* Take dragged element out of flow so column shrinks immediately while card remains visible */
	.column-content > :global([data-is-dnd-dragged-el]) {
		position: fixed !important;
	}

	/* Scrollbar styling */
	.column-content::-webkit-scrollbar {
		width: 6px;
	}

	.column-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.column-content::-webkit-scrollbar-thumb {
		background: var(--col-border);
		border-radius: 3px;
	}

	.column-content::-webkit-scrollbar-thumb:hover {
		background: var(--col-header);
		opacity: 0.5;
	}
</style>
