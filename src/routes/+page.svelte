<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Daycare, DaycareInput, Stage, DaycareWithExtras, CardSettings } from '$lib/types';
	import KanbanColumn from '$lib/components/KanbanColumn.svelte';
	import DaycareModal from '$lib/components/DaycareModal.svelte';
	import ImportCSV from '$lib/components/ImportCSV.svelte';
	import AddDaycare from '$lib/components/AddDaycare.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';

	function switchLanguage(locale: string) {
		setLocale(locale as 'en' | 'fr');
	}

	// Get translated stage label
	function getStageLabel(stageId: Stage): string {
		const labels: Record<Stage, () => string> = {
			to_research: m.stage_to_research,
			to_contact: m.stage_to_contact,
			contacted: m.stage_contacted,
			visited: m.stage_visited,
			waitlisted: m.stage_waitlisted,
			decision_made: m.stage_decision_made
		};
		return labels[stageId]();
	}


	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Create stages with translated labels
	const translatedStages = $derived(
		data.stages.map(stage => ({
			id: stage.id,
			label: getStageLabel(stage.id)
		}))
	);

	let columns = $state<Record<Stage, DaycareWithExtras[]>>(structuredClone(data.columns));
	let selectedDaycare = $state<Daycare | null>(null);
	let showImport = $state(false);
	let showAddDaycare = $state(false);
	let showHidden = $state(false);
	let showSettings = $state(false);
	let settingsContainer: HTMLDivElement;
	let saveError = $state<string | null>(null);
	let homeAddress = $state('');
	let isCalculatingCommutes = $state(false);
	let commuteStatus = $state<string | null>(null);

	// Card display settings - load from localStorage
	const defaultCardSettings: CardSettings = {
		showAddress: true,
		showPhone: true,
		showEmail: true,
		showPrice: true,
		showAgeRange: true,
		showFacebook: true,
		showContacts: true,
		showReview: true,
		showCommuteTime: true
	};

	function loadCardSettings() {
		if (typeof window === 'undefined') return defaultCardSettings;
		const saved = localStorage.getItem('cardSettings');
		if (saved) {
			try {
				return { ...defaultCardSettings, ...JSON.parse(saved) };
			} catch {
				return defaultCardSettings;
			}
		}
		return defaultCardSettings;
	}

	let cardSettings = $state(loadCardSettings());

	// Save settings to localStorage when they change
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('cardSettings', JSON.stringify(cardSettings));
		}
	});

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
					saveError = m.error_save_position();
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

	// Load home address from server settings on mount
	async function loadSettings() {
		try {
			const res = await fetch('/api/settings');
			if (res.ok) {
				const settings = await res.json();
				if (settings.home_address) {
					homeAddress = settings.home_address;
				}
			}
		} catch (err) {
			console.error('Failed to load settings:', err);
		}
	}

	// Save home address to server
	async function saveHomeAddress() {
		try {
			await fetch('/api/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ home_address: homeAddress })
			});
		} catch (err) {
			console.error('Failed to save home address:', err);
		}
	}

	// Calculate commute times for all daycares
	async function calculateCommutes() {
		if (!homeAddress.trim()) {
			commuteStatus = 'Please enter your home address first';
			setTimeout(() => commuteStatus = null, 3000);
			return;
		}

		isCalculatingCommutes = true;
		commuteStatus = 'Calculating commute times...';

		try {
			// Save the home address first
			await saveHomeAddress();

			const res = await fetch('/api/commute', { method: 'POST' });

			if (!res.body) {
				throw new Error('No response body');
			}

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = JSON.parse(line.slice(6));

						if (data.error) {
							commuteStatus = data.error;
						} else if (data.type === 'start') {
							if (data.total === 0) {
								commuteStatus = 'All commutes are up to date';
							}
						} else if (data.type === 'progress') {
							commuteStatus = `Calculating ${data.current} of ${data.total}: ${data.name}`;
						} else if (data.type === 'done') {
							if (data.calculated > 0) {
								commuteStatus = `Calculated ${data.calculated} commute${data.calculated > 1 ? 's' : ''}`;
								invalidateAll();
							} else if (data.errors?.length > 0) {
								commuteStatus = `${data.errors.length} error(s) occurred`;
							} else {
								commuteStatus = 'All commutes are up to date';
							}
						}
					}
				}
			}
		} catch (err) {
			commuteStatus = 'Failed to calculate commutes';
			console.error('Failed to calculate commutes:', err);
		} finally {
			isCalculatingCommutes = false;
			setTimeout(() => commuteStatus = null, 5000);
		}
	}

	// Load settings on mount
	$effect(() => {
		loadSettings();
	});

	// Close settings when clicking outside
	function handleWindowClick(e: MouseEvent) {
		if (showSettings && settingsContainer && !settingsContainer.contains(e.target as Node)) {
			showSettings = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<svelte:head>
	<title>{m.app_title()}</title>
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
				{m.app_title()}
			</h1>
			<span class="daycare-count">{m.daycares_count({ count: totalDaycares })}</span>
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
					{showHidden ? m.btn_hide_hidden() : m.btn_show_hidden({ count: hiddenCount })}
				</button>
			{/if}
			<div class="settings-container" bind:this={settingsContainer}>
				<button
					class="btn btn-icon-only"
					class:active={showSettings}
					onclick={() => showSettings = !showSettings}
					title="Card display settings"
				>
					<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="3"/>
						<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
					</svg>
				</button>
				{#if showSettings}
					<div class="settings-dropdown">
						<div class="settings-section">
							<div class="settings-header">{m.settings_card_display()}</div>
							<div class="settings-chips">
								<label class="chip" class:active={cardSettings.showAddress}>
									<input type="checkbox" bind:checked={cardSettings.showAddress} />
									{m.label_address()}
								</label>
								<label class="chip" class:active={cardSettings.showPhone}>
									<input type="checkbox" bind:checked={cardSettings.showPhone} />
									{m.label_phone()}
								</label>
								<label class="chip" class:active={cardSettings.showEmail}>
									<input type="checkbox" bind:checked={cardSettings.showEmail} />
									{m.label_email()}
								</label>
								<label class="chip" class:active={cardSettings.showPrice}>
									<input type="checkbox" bind:checked={cardSettings.showPrice} />
									{m.label_price()}
								</label>
								<label class="chip" class:active={cardSettings.showAgeRange}>
									<input type="checkbox" bind:checked={cardSettings.showAgeRange} />
									{m.label_age_range()}
								</label>
								<label class="chip" class:active={cardSettings.showFacebook}>
									<input type="checkbox" bind:checked={cardSettings.showFacebook} />
									{m.label_facebook()}
								</label>
								<label class="chip" class:active={cardSettings.showContacts}>
									<input type="checkbox" bind:checked={cardSettings.showContacts} />
									{m.section_contacts({ count: 0 }).replace(' (0)', '')}
								</label>
								<label class="chip" class:active={cardSettings.showReview}>
									<input type="checkbox" bind:checked={cardSettings.showReview} />
									{m.review_preview()}
								</label>
								<label class="chip" class:active={cardSettings.showCommuteTime}>
									<input type="checkbox" bind:checked={cardSettings.showCommuteTime} />
									Commute
								</label>
							</div>
						</div>

						<div class="settings-section">
							<div class="settings-header">Commute Settings</div>
							<div class="settings-field">
								<label for="home-address">Home Address</label>
								<input
									type="text"
									id="home-address"
									bind:value={homeAddress}
									onblur={saveHomeAddress}
									placeholder="Enter your home address"
								/>
							</div>
							<button
								class="settings-btn"
								onclick={calculateCommutes}
								disabled={isCalculatingCommutes}
							>
								{#if isCalculatingCommutes}
									<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
									</svg>
									Calculating...
								{:else}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<circle cx="12" cy="12" r="10"/>
										<polyline points="12 6 12 12 16 14"/>
									</svg>
									Calculate Commutes
								{/if}
							</button>
							{#if commuteStatus}
								<div class="commute-status">{commuteStatus}</div>
							{/if}
						</div>

						<div class="settings-section">
							<div class="settings-header">{m.settings_language()}</div>
							<div class="language-toggle">
								{#each locales as locale}
									<button
										class="lang-btn"
										class:active={getLocale() === locale}
										onclick={() => switchLanguage(locale)}
									>
										{locale === 'en' ? m.lang_en() : m.lang_fr()}
									</button>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
			<button class="btn btn-secondary" onclick={() => showImport = true}>
				<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
					<polyline points="17 8 12 3 7 8"/>
					<line x1="12" y1="3" x2="12" y2="15"/>
				</svg>
				{m.btn_import_csv()}
			</button>
			<button class="btn btn-primary" onclick={() => showAddDaycare = true}>
				<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19"/>
					<line x1="5" y1="12" x2="19" y2="12"/>
				</svg>
				{m.btn_add_daycare()}
			</button>
		</div>
	</header>

	<main class="kanban-board">
		{#each translatedStages as stage (stage.id)}
			<KanbanColumn
				{stage}
				items={getFilteredItems(columns[stage.id])}
				{cardSettings}
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

	/* Base btn, btn-primary, btn-secondary from shared.css */

	/* Page-specific button overrides */
	.btn {
		border-radius: 10px;
		padding: 0.625rem 1rem;
	}

	.btn-primary:hover {
		transform: translateY(-1px);
	}

	.btn-secondary {
		color: #5a4d3d;
	}

	.btn-icon-only {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.625rem;
		border: none;
		border-radius: 10px;
		background: #f0ebe4;
		color: #5a4d3d;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-icon-only:hover {
		background: #e8e2d9;
	}

	.btn-icon-only.active {
		background: #d8cfc4;
		color: #3d3425;
	}

	.settings-container {
		position: relative;
	}

	.settings-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.5rem;
		background: white;
		border: 1px solid #e8dfd3;
		border-radius: 16px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		width: 320px;
		z-index: 100;
		overflow: hidden;
	}

	.settings-section {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #f0ebe4;
	}

	.settings-section:last-child {
		border-bottom: none;
	}

	.settings-header {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #7a6d5c;
		margin-bottom: 0.75rem;
	}

	.settings-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.75rem;
		font-size: 0.8rem;
		font-weight: 500;
		color: #5a4d3d;
		background: #f5f1eb;
		border: 1px solid #e8dfd3;
		border-radius: 999px;
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
	}

	.chip:hover {
		background: #ebe5db;
		border-color: #d8cfc4;
	}

	.chip.active {
		background: #c47a4e;
		border-color: #c47a4e;
		color: white;
	}

	.chip input[type="checkbox"] {
		display: none;
	}

	.settings-field {
		margin-bottom: 0.75rem;
	}

	.settings-field label {
		display: block;
		font-size: 0.75rem;
		color: #7a6d5c;
		margin-bottom: 0.375rem;
	}

	.settings-field input[type="text"] {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 1px solid #e8dfd3;
		border-radius: 8px;
		font-size: 0.875rem;
		background: #fafafa;
	}

	.settings-field input[type="text"]:focus {
		outline: none;
		border-color: #c47a4e;
		background: white;
	}

	.settings-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.625rem;
		background: #c47a4e;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.settings-btn:hover:not(:disabled) {
		background: #b36a42;
	}

	.settings-btn:disabled {
		background: #d8cfc4;
		cursor: not-allowed;
	}

	.settings-btn svg {
		width: 16px;
		height: 16px;
	}

	.settings-btn .spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.commute-status {
		font-size: 0.75rem;
		color: #7a6d5c;
		text-align: center;
		margin-top: 0.5rem;
	}

	.language-toggle {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem 1rem 0.75rem;
	}

	.lang-btn {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #e8dfd3;
		border-radius: 6px;
		background: white;
		color: #5a4d3d;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.lang-btn:hover {
		border-color: #c47a4e;
	}

	.lang-btn.active {
		background: #c47a4e;
		border-color: #c47a4e;
		color: white;
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
