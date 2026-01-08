<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Daycare, DaycareInput, Stage, DaycareWithExtras, CardSettings, FilterSettings, ChildWithDetails, ChildInput, Invitation } from '$lib/types';
	import { STAGE_IDS } from '$lib/types';
	import { DEFAULT_CARD_SETTINGS, DEFAULT_FILTER_SETTINGS, STAGE_LABELS } from '$lib/constants';
	import KanbanColumn from '$lib/components/KanbanColumn.svelte';
	import DaycareModal from '$lib/components/DaycareModal.svelte';
	import AddDaycare from '$lib/components/AddDaycare.svelte';
	import LandingPage from '$lib/components/LandingPage.svelte';
	import ChildSelector from '$lib/components/ChildSelector.svelte';
	import ChildModal from '$lib/components/ChildModal.svelte';
	import ShareChild from '$lib/components/ShareChild.svelte';
	import MigrationModal from '$lib/components/MigrationModal.svelte';
	import AddressAutocomplete from '$lib/components/AddressAutocomplete.svelte';
	import AdminModal from '$lib/components/AdminModal.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';

	function switchLanguage(locale: string) {
		setLocale(locale as 'en' | 'fr');
	}

	// Get translated stage label
	function getStageLabel(stageId: Stage): string {
		return STAGE_LABELS[stageId]();
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

	// Initialize columns with empty arrays for each stage (for SSR), then sync from data via $effect
	const emptyColumns = Object.fromEntries(
		STAGE_IDS.map(stage => [stage, [] as DaycareWithExtras[]])
	) as Record<Stage, DaycareWithExtras[]>;
	let columns = $state<Record<Stage, DaycareWithExtras[]>>(emptyColumns);
	let selectedDaycare = $state<Daycare | null>(null);
	let showAddDaycare = $state(false);
	let showHidden = $state(false);
	let showSettings = $state(false);
	let settingsContainer = $state<HTMLDivElement | null>(null);
	let saveError = $state<string | null>(null);
	let homeAddress = $state('');
	let isCalculatingCommutes = $state(false);
	let commuteStatus = $state<string | null>(null);

	// Child management state
	let showChildModal = $state(false);
	let editingChild = $state<ChildWithDetails | null>(null);
	let showShareChild = $state(false);
	let managingChild = $state<ChildWithDetails | null>(null);
	let childInvitation = $state<Invitation | null>(null);

	// Search state
	let searchQuery = $state('');

	// Admin state
	let showAdminModal = $state(false);
	const isAdmin = $derived(data.user?.email === 'ol@latranchee.com');

	// Filter settings - load from localStorage
	function loadFilterSettings(): FilterSettings {
		if (typeof window === 'undefined') return DEFAULT_FILTER_SETTINGS;
		const saved = localStorage.getItem('filterSettings');
		if (saved) {
			try {
				return { ...DEFAULT_FILTER_SETTINGS, ...JSON.parse(saved) };
			} catch {
				return DEFAULT_FILTER_SETTINGS;
			}
		}
		return DEFAULT_FILTER_SETTINGS;
	}

	let filterSettings = $state<FilterSettings>(loadFilterSettings());

	// Card display settings - load from localStorage
	function loadCardSettings() {
		if (typeof window === 'undefined') return DEFAULT_CARD_SETTINGS;
		const saved = localStorage.getItem('cardSettings');
		if (saved) {
			try {
				return { ...DEFAULT_CARD_SETTINGS, ...JSON.parse(saved) };
			} catch {
				return DEFAULT_CARD_SETTINGS;
			}
		}
		return DEFAULT_CARD_SETTINGS;
	}

	let cardSettings = $state(loadCardSettings());

	// Save settings to localStorage when they change
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('cardSettings', JSON.stringify(cardSettings));
		}
	});

	// Save filter settings to localStorage when they change
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('filterSettings', JSON.stringify(filterSettings));
		}
	});

	// Count active filters
	const activeFilterCount = $derived(() => {
		let count = 0;
		if (filterSettings.maxCommuteMinutes !== null) count++;
		if (filterSettings.requireReviews) count++;
		if (filterSettings.subsidizedOnly) count++;
		if (filterSettings.minRating !== null) count++;
		if (filterSettings.requirePhone) count++;
		if (filterSettings.requireEmail) count++;
		if (filterSettings.requireWebsite) count++;
		if (filterSettings.requireFacebook) count++;
		return count;
	});

	// Count daycares hidden by filters (excluding the "hidden" flag)
	const filteredOutCount = $derived(() => {
		if (activeFilterCount() === 0) return 0;

		let total = 0;
		let filtered = 0;

		for (const stage of Object.keys(columns) as Stage[]) {
			for (const d of columns[stage]) {
				// Skip already hidden daycares
				if (!showHidden && d.hidden) continue;
				total++;

				// Check if filtered out by any active filter
				if (filterSettings.maxCommuteMinutes !== null) {
					if (d.commute_minutes === null || d.commute_minutes > filterSettings.maxCommuteMinutes) {
						filtered++;
						continue;
					}
				}
				if (filterSettings.requireReviews && !d.firstReview) { filtered++; continue; }
				if (filterSettings.subsidizedOnly && !d.subventionne) { filtered++; continue; }
				if (filterSettings.minRating !== null && (d.rating === null || d.rating < filterSettings.minRating)) { filtered++; continue; }
				if (filterSettings.requirePhone && !d.phone) { filtered++; continue; }
				if (filterSettings.requireEmail && !d.email) { filtered++; continue; }
				if (filterSettings.requireWebsite && !d.website) { filtered++; continue; }
				if (filterSettings.requireFacebook && !d.facebook) { filtered++; continue; }
			}
		}
		return filtered;
	});

	function clearAllFilters() {
		filterSettings = { ...DEFAULT_FILTER_SETTINGS };
	}

	// Sync columns from server data when it changes
	let lastDataVersion = $state('');
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
			// Include child_id in the request
			const daycareInput = {
				...input,
				child_id: data.selectedChildId
			};

			const res = await fetch('/api/daycares', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(daycareInput)
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
		return items.filter((d) => {
			// Filter by hidden status
			if (!showHidden && d.hidden) return false;

			// Filter by search query (loose match on name, address, phone, email)
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase().trim();
				const nameMatch = d.name?.toLowerCase().includes(query);
				const addressMatch = d.address?.toLowerCase().includes(query);
				const phoneMatch = d.phone?.toLowerCase().includes(query);
				const emailMatch = d.email?.toLowerCase().includes(query);
				if (!nameMatch && !addressMatch && !phoneMatch && !emailMatch) return false;
			}

			// Filter by max commute time (also hide those without commute time computed)
			if (filterSettings.maxCommuteMinutes !== null) {
				if (d.commute_minutes === null || d.commute_minutes > filterSettings.maxCommuteMinutes) return false;
			}

			// Filter by reviews requirement
			if (filterSettings.requireReviews && !d.firstReview) return false;

			// Filter by subsidized only
			if (filterSettings.subsidizedOnly && !d.subventionne) return false;

			// Filter by minimum rating
			if (filterSettings.minRating !== null && (d.rating === null || d.rating < filterSettings.minRating)) return false;

			// Filter by required contact info
			if (filterSettings.requirePhone && !d.phone) return false;
			if (filterSettings.requireEmail && !d.email) return false;
			if (filterSettings.requireWebsite && !d.website) return false;
			if (filterSettings.requireFacebook && !d.facebook) return false;

			return true;
		});
	}

	function handleReviewsChange() {
		invalidateAll();
	}

	// Child management handlers
	function handleSelectChild(childId: number) {
		goto(`?child=${childId}`, { replaceState: true });
	}

	function handleAddChild() {
		editingChild = null;
		showChildModal = true;
	}

	async function handleManageChild(child: ChildWithDetails) {
		managingChild = child;
		// Load invitation for this child
		try {
			const res = await fetch(`/api/children/${child.id}/invitation`);
			if (res.ok) {
				childInvitation = await res.json();
			} else {
				childInvitation = null;
			}
		} catch {
			childInvitation = null;
		}
		showShareChild = true;
	}

	async function handleSaveChild(input: ChildInput) {
		try {
			if (editingChild) {
				// Update existing child
				const res = await fetch(`/api/children/${editingChild.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(input)
				});
				if (res.ok) {
					showChildModal = false;
					editingChild = null;
					invalidateAll();
				}
			} else {
				// Create new child
				const res = await fetch('/api/children', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(input)
				});
				if (res.ok) {
					const newChild = await res.json();
					showChildModal = false;
					// Navigate to the new child
					goto(`?child=${newChild.id}`, { replaceState: true });
				}
			}
		} catch (err) {
			console.error('Failed to save child:', err);
		}
	}

	async function handleDeleteChild(childId: number) {
		try {
			const res = await fetch(`/api/children/${childId}`, { method: 'DELETE' });
			if (res.ok) {
				showChildModal = false;
				editingChild = null;
				// Navigate to first remaining child or clear selection
				invalidateAll();
				goto('/', { replaceState: true });
			}
		} catch (err) {
			console.error('Failed to delete child:', err);
		}
	}

	function handleEditChild() {
		if (managingChild) {
			editingChild = managingChild;
			showShareChild = false;
			showChildModal = true;
		}
	}

	async function handleGenerateInvitation() {
		if (!managingChild) return;
		try {
			const res = await fetch(`/api/children/${managingChild.id}/invitation`, {
				method: 'POST'
			});
			if (res.ok) {
				childInvitation = await res.json();
			}
		} catch (err) {
			console.error('Failed to generate invitation:', err);
		}
	}

	async function handleRevokeInvitation() {
		if (!managingChild) return;
		try {
			const res = await fetch(`/api/children/${managingChild.id}/invitation`, {
				method: 'DELETE'
			});
			if (res.ok) {
				childInvitation = null;
			}
		} catch (err) {
			console.error('Failed to revoke invitation:', err);
		}
	}

	async function handleRemoveCollaborator(userId: number) {
		if (!managingChild) return;
		try {
			const res = await fetch(`/api/children/${managingChild.id}/collaborators/${userId}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				// Refresh the managing child data
				const childRes = await fetch(`/api/children/${managingChild.id}`);
				if (childRes.ok) {
					managingChild = await childRes.json();
				}
				invalidateAll();
			}
		} catch (err) {
			console.error('Failed to remove collaborator:', err);
		}
	}

	// Migration handler - creates a child and migrates unassigned daycares
	async function handleMigration(input: ChildInput) {
		try {
			// Create the child
			const res = await fetch('/api/children', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input)
			});
			if (res.ok) {
				const newChild = await res.json();
				// Migrate daycares to this child
				await fetch(`/api/children/${newChild.id}/migrate`, {
					method: 'POST'
				});
				// Navigate to the new child
				goto(`?child=${newChild.id}`, { replaceState: true });
			}
		} catch (err) {
			console.error('Failed to migrate:', err);
		}
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
			commuteStatus = m.commute_enter_address_first();
			setTimeout(() => commuteStatus = null, 3000);
			return;
		}

		isCalculatingCommutes = true;
		commuteStatus = m.commute_calculating();

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
								commuteStatus = m.commute_all_up_to_date();
							}
						} else if (data.type === 'progress') {
							commuteStatus = m.commute_progress({ current: data.current, total: data.total, name: data.name });
						} else if (data.type === 'done') {
							if (data.calculated > 0) {
								commuteStatus = m.commute_calculated({ count: data.calculated });
								invalidateAll();
							} else if (data.errors?.length > 0) {
								commuteStatus = m.commute_errors({ count: data.errors.length });
							} else {
								commuteStatus = m.commute_all_up_to_date();
							}
						}
					}
				}
			}
		} catch (err) {
			commuteStatus = m.commute_failed();
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

{#if data.user}
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
			<div class="search-container">
				<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8"/>
					<path d="m21 21-4.35-4.35"/>
				</svg>
				<input
					type="text"
					class="search-input"
					placeholder={m.search_placeholder()}
					bind:value={searchQuery}
				/>
				{#if searchQuery}
					<button
						class="search-clear"
						onclick={() => searchQuery = ''}
						title={m.search_clear()}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"/>
							<line x1="6" y1="6" x2="18" y2="18"/>
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<div class="header-actions">
			<ChildSelector
				children={data.children}
				selectedChildId={data.selectedChildId}
				onSelect={handleSelectChild}
				onAddChild={handleAddChild}
				onManageChild={handleManageChild}
			/>
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
			{#if isAdmin}
				<button
					class="btn btn-secondary"
					onclick={() => showAdminModal = true}
				>
					<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
					</svg>
					{m.admin_btn()}
				</button>
			{/if}
			<div class="settings-container" bind:this={settingsContainer}>
				<button
					class="btn btn-icon-only"
					class:active={showSettings}
					onclick={() => showSettings = !showSettings}
					title={m.settings_card_display_title()}
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
									{m.label_commute()}
								</label>
								<label class="chip" class:active={cardSettings.showSubsidized}>
									<input type="checkbox" bind:checked={cardSettings.showSubsidized} />
									{m.label_subsidized()}
								</label>
							</div>
						</div>

						<div class="settings-section filters-section">
							<div class="settings-header filters-header">
								<span>{m.settings_filters()}</span>
								{#if activeFilterCount() > 0}
									<span class="filter-badge">{m.filter_active_count({ count: activeFilterCount() })}</span>
									{#if filteredOutCount() > 0}
										<span class="filter-badge filter-badge-hidden">{m.filter_hidden_count({ count: filteredOutCount() })}</span>
									{/if}
									<button class="btn-clear-link" onclick={clearAllFilters}>
										{m.filter_clear_all()}
									</button>
								{/if}
							</div>

							<div class="filter-grid">
								<!-- Commute Time Slider -->
								<div class="filter-card">
									<div class="filter-card-header">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<circle cx="12" cy="12" r="10"/>
											<polyline points="12 6 12 12 16 14"/>
										</svg>
										<span>{m.settings_max_commute()}</span>
									</div>
									<div class="slider-row">
										<input
											type="range"
											min="5"
											max="60"
											step="5"
											value={filterSettings.maxCommuteMinutes ?? 60}
											oninput={(e) => {
												const val = parseInt(e.currentTarget.value, 10);
												filterSettings.maxCommuteMinutes = val >= 60 ? null : val;
											}}
										/>
										<span class="slider-value" class:inactive={filterSettings.maxCommuteMinutes === null}>
											{filterSettings.maxCommuteMinutes === null ? m.settings_max_commute_any() : m.settings_max_commute_minutes({ minutes: filterSettings.maxCommuteMinutes })}
										</span>
									</div>
								</div>

								<!-- Rating Slider -->
								<div class="filter-card">
									<div class="filter-card-header">
										<svg viewBox="0 0 24 24" fill="currentColor">
											<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
										</svg>
										<span>{m.filter_min_rating()}</span>
									</div>
									<div class="rating-selector">
										<button
											class="btn-rating"
											class:active={filterSettings.minRating === null}
											onclick={() => filterSettings.minRating = null}
										>
											{m.filter_any_rating()}
										</button>
										{#each [2, 3, 4] as rating}
											<button
												class="btn-rating"
												class:active={filterSettings.minRating === rating}
												onclick={() => filterSettings.minRating = rating}
											>
												{m.filter_rating_stars({ rating })}
											</button>
										{/each}
									</div>
								</div>
							</div>

							<!-- Toggle Filters -->
							<div class="filter-toggles">
								<label class="filter-toggle" class:active={filterSettings.requireReviews}>
									<input type="checkbox" bind:checked={filterSettings.requireReviews} />
									<span class="toggle-icon">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
										</svg>
									</span>
									<span>{m.filter_has_reviews()}</span>
								</label>

								<label class="filter-toggle" class:active={filterSettings.subsidizedOnly}>
									<input type="checkbox" bind:checked={filterSettings.subsidizedOnly} />
									<span class="toggle-icon">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
										</svg>
									</span>
									<span>{m.filter_subsidized_only()}</span>
								</label>

								<label class="filter-toggle" class:active={filterSettings.requirePhone}>
									<input type="checkbox" bind:checked={filterSettings.requirePhone} />
									<span class="toggle-icon">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
										</svg>
									</span>
									<span>{m.filter_has_phone()}</span>
								</label>

								<label class="filter-toggle" class:active={filterSettings.requireEmail}>
									<input type="checkbox" bind:checked={filterSettings.requireEmail} />
									<span class="toggle-icon">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
											<polyline points="22,6 12,13 2,6"/>
										</svg>
									</span>
									<span>{m.filter_has_email()}</span>
								</label>

								<label class="filter-toggle" class:active={filterSettings.requireWebsite}>
									<input type="checkbox" bind:checked={filterSettings.requireWebsite} />
									<span class="toggle-icon">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<circle cx="12" cy="12" r="10"/>
											<line x1="2" y1="12" x2="22" y2="12"/>
											<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
										</svg>
									</span>
									<span>{m.filter_has_website()}</span>
								</label>

								<label class="filter-toggle" class:active={filterSettings.requireFacebook}>
									<input type="checkbox" bind:checked={filterSettings.requireFacebook} />
									<span class="toggle-icon">
										<svg viewBox="0 0 24 24" fill="currentColor">
											<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
										</svg>
									</span>
									<span>{m.filter_has_facebook()}</span>
								</label>
							</div>
						</div>

						<div class="settings-section">
							<div class="settings-header">{m.settings_commute()}</div>
							<div class="settings-field">
								<label for="home-address">{m.settings_home_address()}</label>
								<AddressAutocomplete
									id="home-address"
									bind:value={homeAddress}
									placeholder={m.settings_home_address_placeholder()}
									onSelect={() => saveHomeAddress()}
								/>
							</div>
							<button
								class="btn-settings"
								onclick={calculateCommutes}
								disabled={isCalculatingCommutes}
							>
								{#if isCalculatingCommutes}
									<LoadingSpinner mode="inline" size="sm" showMessage={false} />
									{m.settings_calculating()}
								{:else}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<circle cx="12" cy="12" r="10"/>
										<polyline points="12 6 12 12 16 14"/>
									</svg>
									{m.settings_calculate_commutes()}
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
										class="btn-lang"
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
			<button class="btn btn-primary" onclick={() => showAddDaycare = true}>
				<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19"/>
					<line x1="5" y1="12" x2="19" y2="12"/>
				</svg>
				{m.btn_add_daycare()}
			</button>

			<div class="auth-section">
				{#if data.user}
					<form action="/logout" method="POST" class="logout-form">
						<button type="submit" class="btn btn-secondary btn-sm">
							{m.auth_logout()}
						</button>
					</form>
				{:else}
					<a href="/login" class="btn btn-secondary btn-sm">{m.auth_login()}</a>
				{/if}
			</div>
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
	user={data.user}
/>

{#if showAddDaycare}
	<AddDaycare
		onAdd={handleAddDaycare}
		onClose={() => showAddDaycare = false}
	/>
{/if}

{#if showChildModal}
	<ChildModal
		child={editingChild}
		onSave={handleSaveChild}
		onClose={() => { showChildModal = false; editingChild = null; }}
		onDelete={handleDeleteChild}
	/>
{/if}

{#if showShareChild && managingChild}
	<ShareChild
		child={managingChild}
		invitation={childInvitation}
		onGenerateCode={handleGenerateInvitation}
		onRevokeCode={handleRevokeInvitation}
		onRemoveCollaborator={handleRemoveCollaborator}
		onEditChild={handleEditChild}
		onClose={() => { showShareChild = false; managingChild = null; }}
	/>
{/if}

{#if data.hasUnassignedDaycares && data.children.length === 0}
	<MigrationModal
		unassignedCount={data.unassignedDaycareCount}
		onMigrate={handleMigration}
	/>
{/if}

{#if showAdminModal}
	<AdminModal onClose={() => showAdminModal = false} onImport={handleImportComplete} />
{/if}
{:else}
	<LandingPage />
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

	.search-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		width: 16px;
		height: 16px;
		color: #a09485;
		pointer-events: none;
	}

	.search-input {
		padding: 0.5rem 2rem 0.5rem 2.25rem;
		border: 1px solid #e8dfd3;
		border-radius: 999px;
		font-size: 0.875rem;
		background: #fafafa;
		width: 200px;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: #c47a4e;
		background: white;
		width: 260px;
		box-shadow: 0 0 0 3px rgba(196, 122, 78, 0.1);
	}

	.search-input::placeholder {
		color: #a09485;
	}

	.search-clear {
		position: absolute;
		right: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		border: none;
		background: #e8dfd3;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.search-clear:hover {
		background: #d8cfc4;
	}

	.search-clear svg {
		width: 12px;
		height: 12px;
		color: #5a4d3d;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.auth-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: 0.5rem;
		padding-left: 0.75rem;
		border-left: 1px solid var(--border-color);
	}

	.logout-form {
		margin: 0;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.85rem;
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

	/* btn-icon-only now in shared.css */

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
		width: 400px;
		max-height: 80vh;
		overflow-y: auto;
		z-index: 100;
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

	/* btn-settings now in shared.css */

	.commute-status {
		font-size: 0.75rem;
		color: #7a6d5c;
		text-align: center;
		margin-top: 0.5rem;
	}

	/* Filter Section Styles */
	.filters-section {
		background: linear-gradient(180deg, #faf8f5 0%, #f5f1eb 100%);
	}

	.filters-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.filter-badge {
		font-size: 0.65rem;
		font-weight: 600;
		color: white;
		background: #c47a4e;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		text-transform: none;
		letter-spacing: 0;
	}

	.filter-badge-hidden {
		background: #7a6d5c;
	}

	/* btn-clear-link now in shared.css */

	.filter-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.filter-card {
		background: white;
		border: 1px solid #e8dfd3;
		border-radius: 10px;
		padding: 0.75rem;
	}

	.filter-card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #5a4d3d;
		margin-bottom: 0.625rem;
	}

	.filter-card-header svg {
		width: 14px;
		height: 14px;
		color: #c47a4e;
	}

	.slider-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.slider-row input[type="range"] {
		flex: 1;
		height: 4px;
		border-radius: 2px;
		background: linear-gradient(to right, #c47a4e 0%, #e8dfd3 0%);
		appearance: none;
		cursor: pointer;
	}

	.slider-row input[type="range"]::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #c47a4e;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(196, 122, 78, 0.4);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.slider-row input[type="range"]::-webkit-slider-thumb:hover {
		transform: scale(1.15);
		box-shadow: 0 3px 8px rgba(196, 122, 78, 0.5);
	}

	.slider-row input[type="range"]::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #c47a4e;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 6px rgba(196, 122, 78, 0.4);
	}

	.slider-value {
		font-size: 0.75rem;
		font-weight: 600;
		color: #c47a4e;
		min-width: 45px;
		text-align: right;
	}

	.slider-value.inactive {
		color: #a09485;
	}

	.rating-selector {
		display: flex;
		gap: 0.5rem;
	}

	/* btn-rating now in shared.css */

	.filter-toggles {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.filter-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		background: white;
		border: 1px solid #e8dfd3;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s ease;
		font-size: 0.7rem;
		color: #7a6d5c;
	}

	.filter-toggle:hover {
		border-color: #d8cfc4;
		background: #faf8f5;
	}

	.filter-toggle.active {
		background: linear-gradient(135deg, #c47a4e 0%, #d4896a 100%);
		border-color: #c47a4e;
		color: white;
	}

	.filter-toggle input[type="checkbox"] {
		display: none;
	}

	.toggle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: #f5f1eb;
		border-radius: 5px;
		flex-shrink: 0;
	}

	.filter-toggle.active .toggle-icon {
		background: rgba(255, 255, 255, 0.25);
	}

	.toggle-icon svg {
		width: 12px;
		height: 12px;
	}

	.filter-toggle.active .toggle-icon svg {
		stroke: white;
		fill: none;
	}

	.filter-toggle.active .toggle-icon svg[fill="currentColor"] {
		fill: white;
		stroke: none;
	}

	.language-toggle {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem 1rem 0.75rem;
	}

	/* btn-lang now in shared.css */

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
