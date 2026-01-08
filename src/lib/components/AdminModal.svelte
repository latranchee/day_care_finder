<script lang="ts">
	import Modal from './Modal.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import ImportCSV from './ImportCSV.svelte';
	import AddDaycare from './AddDaycare.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { AdminFamilyResponse, AdminChildDetails, Stage, DaycareInput } from '$lib/types';

	interface Props {
		onClose: () => void;
		onImport: () => void;
		onAddDaycare: (data: DaycareInput) => void | Promise<void>;
	}

	let { onClose, onImport, onAddDaycare }: Props = $props();

	let showImport = $state(false);
	let showAddDaycare = $state(false);

	function handleImportComplete() {
		showImport = false;
		onImport();
	}

	async function handleAddDaycareComplete(data: DaycareInput) {
		await onAddDaycare(data);
		showAddDaycare = false;
	}

	let loading = $state(true);
	let error = $state<string | null>(null);
	let data = $state<AdminFamilyResponse | null>(null);
	let expandedUsers = $state<Set<number>>(new Set());

	const stageLabels: Record<Stage, () => string> = {
		to_research: m.stage_to_research,
		to_contact: m.stage_to_contact,
		contacted: m.stage_contacted,
		visited: m.stage_visited,
		waitlisted: m.stage_waitlisted,
		decision_made: m.stage_decision_made
	};

	$effect(() => {
		fetchAdminData();
	});

	async function fetchAdminData() {
		try {
			const response = await fetch('/api/admin/families');
			if (!response.ok) {
				throw new Error('Failed to load admin data');
			}
			data = await response.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}

	function toggleUser(userId: number) {
		if (expandedUsers.has(userId)) {
			expandedUsers.delete(userId);
			expandedUsers = new Set(expandedUsers);
		} else {
			expandedUsers.add(userId);
			expandedUsers = new Set(expandedUsers);
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString();
	}

	function calculateAge(dateOfBirth: string): string {
		const dob = new Date(dateOfBirth);
		const now = new Date();
		const diffMs = now.getTime() - dob.getTime();
		const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));

		if (diffMonths < 12) {
			return m.child_age_months({ months: diffMonths });
		}

		const years = Math.floor(diffMonths / 12);
		const months = diffMonths % 12;

		if (months === 0) {
			return m.child_age_years({ years });
		}

		return m.child_age_years_months({ years, months });
	}
</script>

<Modal {onClose} size="lg">
	<div class="admin-content">
		<h2 class="admin-title">{m.admin_title()}</h2>
		{#if loading}
			<div class="loading-state">
				<LoadingSpinner size="md" />
			</div>
		{:else if error}
			<div class="error-state">{error}</div>
		{:else if data}
			<div class="admin-section">
				<h3 class="section-title">{m.admin_section_daycares()}</h3>
				<div class="admin-actions">
					<button class="btn-admin-action btn-primary" onclick={() => showAddDaycare = true}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="12" y1="5" x2="12" y2="19"/>
							<line x1="5" y1="12" x2="19" y2="12"/>
						</svg>
						{m.btn_add_daycare()}
					</button>
					<button class="btn-admin-action" onclick={() => showImport = true}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
							<polyline points="17 8 12 3 7 8"/>
							<line x1="12" y1="3" x2="12" y2="15"/>
						</svg>
						{m.btn_import_csv()}
					</button>
				</div>
			</div>

			<div class="admin-section">
				<h3 class="section-title">{m.admin_section_users()}</h3>
				<span class="user-count">{m.admin_users_count({ count: data.users.length })}</span>
			</div>

			{#if data.users.length === 0}
				<div class="empty-state">{m.admin_no_users()}</div>
			{:else}
				<div class="users-list">
					{#each data.users as user}
						<div class="user-card" class:expanded={expandedUsers.has(user.id)}>
							<button class="user-header" onclick={() => toggleUser(user.id)}>
								<div class="user-info">
									<span class="user-email">{user.email}</span>
									{#if user.name}
										<span class="user-name">{user.name}</span>
									{/if}
								</div>
								<div class="user-meta">
									<span class="user-joined">{m.admin_user_joined({ date: formatDate(user.created_at) })}</span>
									<span class="children-badge">{m.admin_children_count({ count: user.children.length })}</span>
									<svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polyline points="6 9 12 15 18 9"></polyline>
									</svg>
								</div>
							</button>

							{#if expandedUsers.has(user.id)}
								<div class="user-details">
									{#if user.children.length === 0}
										<div class="no-children">{m.admin_no_children()}</div>
									{:else}
										{#each user.children as child}
											<div class="child-card">
												<div class="child-header">
													<span class="child-name">{child.name}</span>
													<span class="child-age">{calculateAge(child.date_of_birth)}</span>
												</div>

												{#if child.parents.length > 1}
													<div class="child-parents">
														<span class="parents-label">{m.admin_collaborators()}:</span>
														{#each child.parents as parent}
															<span class="parent-chip" class:owner={parent.role === 'owner'}>
																{parent.email}
																<span class="role-badge">{parent.role === 'owner' ? m.admin_owner() : m.share_collaborator()}</span>
															</span>
														{/each}
													</div>
												{/if}

												<div class="daycare-progress">
													<span class="progress-label">{m.admin_daycare_progress()}:</span>
													<div class="stage-counts">
														{#each Object.entries(child.daycare_counts) as [stage, count]}
															{#if count > 0}
																<span class="stage-chip">{stageLabels[stage as Stage]()}: {count}</span>
															{/if}
														{/each}
													</div>
													<span class="total-daycares">{m.admin_total_daycares({ count: child.total_daycares })}</span>
												</div>
											</div>
										{/each}
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</Modal>

{#if showImport}
	<ImportCSV
		onImport={handleImportComplete}
		onClose={() => showImport = false}
	/>
{/if}

{#if showAddDaycare}
	<AddDaycare
		onAdd={handleAddDaycareComplete}
		onClose={() => showAddDaycare = false}
	/>
{/if}

<style>
	.admin-content {
		padding: 1.5rem 2rem 2rem;
		max-height: 80vh;
		overflow-y: auto;
	}

	.admin-title {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1.25rem 0;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 3rem;
		color: var(--text-secondary);
	}

	.error-state {
		padding: 2rem;
		text-align: center;
		color: var(--danger-color);
	}

	.admin-section {
		margin-bottom: 1.25rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-color);
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin: 0 0 0.75rem 0;
	}

	.user-count {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.admin-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-admin-action {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #f5f1eb;
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-admin-action:hover {
		background: #ebe5db;
		border-color: #d8cfc4;
	}

	.btn-admin-action.btn-primary {
		background: var(--accent);
		color: white;
		border-color: var(--accent);
	}

	.btn-admin-action.btn-primary:hover {
		background: var(--accent-hover, #b36a3e);
		border-color: var(--accent-hover, #b36a3e);
	}

	.btn-admin-action svg {
		width: 16px;
		height: 16px;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--text-secondary);
	}

	.users-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.user-card {
		border: 1px solid var(--border-color);
		border-radius: 12px;
		overflow: hidden;
		background: white;
	}

	.user-card.expanded {
		border-color: var(--accent);
	}

	.user-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 1rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.15s;
	}

	.user-header:hover {
		background: rgba(0, 0, 0, 0.02);
	}

	.user-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.user-email {
		font-weight: 500;
		color: var(--text-primary);
	}

	.user-name {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.user-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-joined {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.children-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: var(--accent);
		color: white;
		border-radius: 9999px;
	}

	.expand-icon {
		width: 20px;
		height: 20px;
		color: var(--text-secondary);
		transition: transform 0.2s;
	}

	.user-card.expanded .expand-icon {
		transform: rotate(180deg);
	}

	.user-details {
		padding: 0 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.no-children {
		padding: 1rem;
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.child-card {
		padding: 1rem;
		background: var(--modal-bg);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.child-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.child-name {
		font-weight: 600;
		color: var(--text-primary);
	}

	.child-age {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.child-parents {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.parents-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.parent-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 6px;
	}

	.parent-chip.owner {
		border-color: var(--accent);
	}

	.role-badge {
		font-size: 0.625rem;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.parent-chip.owner .role-badge {
		color: var(--accent);
	}

	.daycare-progress {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.progress-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.stage-counts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.stage-chip {
		font-size: 0.7rem;
		padding: 0.2rem 0.4rem;
		background: var(--border-color);
		color: var(--text-primary);
		border-radius: 4px;
	}

	.total-daycares {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--accent);
	}
</style>
