<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Daycare, DaycareInput, Review, Contact, Stage } from '$lib/types';
	import KanbanColumn from '$lib/components/KanbanColumn.svelte';
	import DaycareModal from '$lib/components/DaycareModal.svelte';
	import ImportCSV from '$lib/components/ImportCSV.svelte';
	import AddDaycare from '$lib/components/AddDaycare.svelte';

	type DaycareWithExtras = Daycare & { firstReview?: Review; primaryContact?: Contact; contactCount: number };

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let columns = $state<Record<Stage, DaycareWithExtras[]>>(structuredClone(data.columns));
	let selectedDaycare = $state<Daycare | null>(null);
	let showImport = $state(false);
	let showAddDaycare = $state(false);
	let showHidden = $state(false);
	let saveError = $state<string | null>(null);

	// Only sync from server on initial load or explicit refresh (not after every change)
	let lastDataVersion = $state(JSON.stringify(data.columns));
	$effect(() => {
		const currentVersion = JSON.stringify(data.columns);
		if (currentVersion !== lastDataVersion) {
			columns = structuredClone(data.columns);
			lastDataVersion = currentVersion;
		}
	});

	function handleDndConsider(stage: Stage) {
		return (e: CustomEvent) => {
			columns[stage] = e.detail.items;
		};
	}

	function handleDndFinalize(stage: Stage) {
		return (e: CustomEvent) => {
			const items = e.detail.items as DaycareWithExtras[];
			columns[stage] = items;
			saveError = null;

			const info = e.detail.info;
			const movedId = Number(info.id);

			// Only save if the item was dropped INTO this zone (not removed from it)
			const itemInThisColumn = items.find((item) => item.id === movedId);

			if (itemInThisColumn && info.trigger === 'droppedIntoZone') {
				const newPosition = items.findIndex((item) => item.id === movedId);

				// Fire and forget - optimistic update already applied
				fetch(`/api/daycares/${movedId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ stage, position: newPosition })
				}).catch(() => {
					saveError = 'Failed to save position. Please refresh.';
					setTimeout(() => saveError = null, 5000);
				});
			}
		};
	}

	function handleSelectDaycare(daycare: Daycare) {
		selectedDaycare = daycare;
	}

	async function handleSaveDaycare(id: number, updates: Partial<DaycareInput>) {
		try {
			const res = await fetch(`/api/daycares/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});

			if (res.ok) {
				const updated = await res.json();
				// Update local state
				const stage = updated.stage as Stage;
				columns[stage] = columns[stage].map((d) => (d.id === id ? updated : d));
				selectedDaycare = updated;
			}
		} catch (err) {
			console.error('Failed to update daycare:', err);
		}
	}

	async function handleDeleteDaycare(id: number) {
		try {
			const res = await fetch(`/api/daycares/${id}`, { method: 'DELETE' });
			if (res.ok) {
				selectedDaycare = null;
				invalidateAll();
			}
		} catch (err) {
			console.error('Failed to delete daycare:', err);
		}
	}

	async function handleAddDaycare(input: DaycareInput) {
		try {
			const res = await fetch('/api/daycares', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input)
			});

			if (res.ok) {
				showAddDaycare = false;
				invalidateAll();
			}
		} catch (err) {
			console.error('Failed to add daycare:', err);
		}
	}

	function handleImportComplete() {
		invalidateAll();
	}

	async function handleToggleHidden(id: number) {
		// Find the daycare in columns
		for (const stage of Object.keys(columns) as Stage[]) {
			const daycare = columns[stage].find((d) => d.id === id);
			if (daycare) {
				const newHidden = !daycare.hidden;
				// Optimistic update
				columns[stage] = columns[stage].map((d) =>
					d.id === id ? { ...d, hidden: newHidden } : d
				);

				// Persist to server
				try {
					await fetch(`/api/daycares/${id}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ hidden: newHidden })
					});
				} catch (err) {
					// Revert on error
					columns[stage] = columns[stage].map((d) =>
						d.id === id ? { ...d, hidden: !newHidden } : d
					);
					console.error('Failed to toggle hidden:', err);
				}
				break;
			}
		}
	}

	const hiddenCount = $derived(
		Object.values(columns).reduce((sum, col) => sum + col.filter((d) => d.hidden).length, 0)
	);

	const totalDaycares = $derived(
		Object.values(columns).reduce(
			(sum, col) => sum + col.filter((d) => showHidden || !d.hidden).length,
			0
		)
	);

	function getFilteredItems(items: DaycareWithExtras[]): DaycareWithExtras[] {
		return showHidden ? items : items.filter((d) => !d.hidden);
	}

	function handleReviewsChange() {
		invalidateAll();
	}
</script>

<svelte:head>
	<title>Daycare Finder</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="app">
	{#if saveError}
		<div class="error-toast">{saveError}</div>
	{/if}

	<header class="app-header">
		<div class="header-left">
			<h1 class="app-title">
				<span class="title-icon">🏠</span>
				Daycare Finder
			</h1>
			<span class="daycare-count">{totalDaycares} daycares</span>
		</div>

		<div class="header-actions">
			{#if hiddenCount > 0}
				<button
					class="btn btn-secondary"
					class:active={showHidden}
					onclick={() => showHidden = !showHidden}
				>
					<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						{#if showHidden}
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
							<circle cx="12" cy="12" r="3"/>
						{:else}
							<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
							<line x1="1" y1="1" x2="23" y2="23"/>
						{/if}
					</svg>
					{showHidden ? 'Hide Hidden' : `Show Hidden (${hiddenCount})`}
				</button>
			{/if}
			<button class="btn btn-secondary" onclick={() => showImport = true}>
				<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
					<polyline points="17 8 12 3 7 8"/>
					<line x1="12" y1="3" x2="12" y2="15"/>
				</svg>
				Import CSV
			</button>
			<button class="btn btn-primary" onclick={() => showAddDaycare = true}>
				<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19"/>
					<line x1="5" y1="12" x2="19" y2="12"/>
				</svg>
				Add Daycare
			</button>
		</div>
	</header>

	<main class="kanban-board">
		{#each data.stages as stage (stage.id)}
			<KanbanColumn
				{stage}
				items={getFilteredItems(columns[stage.id])}
				onDndConsider={handleDndConsider(stage.id)}
				onDndFinalize={handleDndFinalize(stage.id)}
				onSelectDaycare={handleSelectDaycare}
				onHideDaycare={handleToggleHidden}
			/>
		{/each}
	</main>
</div>

<DaycareModal
	daycare={selectedDaycare}
	onClose={() => selectedDaycare = null}
	onSave={handleSaveDaycare}
	onDelete={handleDeleteDaycare}
	onReviewsChange={handleReviewsChange}
/>

{#if showImport}
	<ImportCSV
		onImport={handleImportComplete}
		onClose={() => showImport = false}
	/>
{/if}

{#if showAddDaycare}
	<AddDaycare
		onAdd={handleAddDaycare}
		onClose={() => showAddDaycare = false}
	/>
{/if}

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
		background: linear-gradient(135deg, #f5f0e8 0%, #ebe5db 100%);
		min-height: 100vh;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.error-toast {
		position: fixed;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		background: #c44e4e;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		z-index: 200;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.app-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 2rem;
		background: linear-gradient(180deg, rgba(255,252,248,0.95) 0%, rgba(255,252,248,0.8) 100%);
		border-bottom: 1px solid #e8dfd3;
		backdrop-filter: blur(10px);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.app-title {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 700;
		color: #3d3425;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.title-icon {
		font-size: 1.25rem;
	}

	.daycare-count {
		font-size: 0.85rem;
		color: #7a6d5c;
		background: #f0ebe4;
		padding: 0.375rem 0.75rem;
		border-radius: 999px;
		font-weight: 500;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		border: none;
		border-radius: 10px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-icon {
		width: 18px;
		height: 18px;
	}

	.btn-primary {
		background: #c47a4e;
		color: white;
	}

	.btn-primary:hover {
		background: #b36a42;
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: #f0ebe4;
		color: #5a4d3d;
	}

	.btn-secondary:hover {
		background: #e8e2d9;
	}

	.btn-secondary.active {
		background: #d8cfc4;
		color: #3d3425;
	}

	.kanban-board {
		display: flex;
		gap: 1rem;
		padding: 1.5rem 2rem 2rem;
		overflow-x: auto;
		flex: 1;
		align-items: flex-start;
	}

	/* Subtle background pattern */
	.app::before {
		content: '';
		position: fixed;
		inset: 0;
		background-image:
			radial-gradient(circle at 25% 25%, rgba(196, 122, 78, 0.03) 0%, transparent 50%),
			radial-gradient(circle at 75% 75%, rgba(95, 122, 95, 0.03) 0%, transparent 50%);
		pointer-events: none;
		z-index: -1;
	}

	/* Scrollbar for board */
	.kanban-board::-webkit-scrollbar {
		height: 8px;
	}

	.kanban-board::-webkit-scrollbar-track {
		background: transparent;
	}

	.kanban-board::-webkit-scrollbar-thumb {
		background: #d8d0c4;
		border-radius: 4px;
	}

	.kanban-board::-webkit-scrollbar-thumb:hover {
		background: #c4bab0;
	}

	@media (max-width: 768px) {
		.app-header {
			flex-direction: column;
			gap: 1rem;
			padding: 1rem;
		}

		.header-left {
			width: 100%;
			justify-content: space-between;
		}

		.header-actions {
			width: 100%;
		}

		.header-actions .btn {
			flex: 1;
			justify-content: center;
		}

		.kanban-board {
			padding: 1rem;
		}
	}
</style>
