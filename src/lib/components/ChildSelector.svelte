<script lang="ts">
	import type { ChildWithDetails } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		children: ChildWithDetails[];
		selectedChildId: number | null;
		onSelect: (childId: number) => void;
		onAddChild: () => void;
		onManageChild: (child: ChildWithDetails) => void;
	}

	let { children, selectedChildId, onSelect, onAddChild, onManageChild }: Props = $props();

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement;

	const selectedChild = $derived(children.find(c => c.id === selectedChildId));

	function calculateAge(dateOfBirth: string): string {
		const dob = new Date(dateOfBirth);
		const today = new Date();
		const months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());

		if (months < 12) {
			return m.child_age_months({ months });
		} else {
			const years = Math.floor(months / 12);
			const remainingMonths = months % 12;
			if (remainingMonths === 0) {
				return m.child_age_years({ years });
			}
			return m.child_age_years_months({ years, months: remainingMonths });
		}
	}

	function handleSelect(childId: number) {
		onSelect(childId);
		isOpen = false;
	}

	function handleManage(e: MouseEvent, child: ChildWithDetails) {
		e.stopPropagation();
		onManageChild(child);
		isOpen = false;
	}

	function handleClickOutside(e: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="child-selector" bind:this={dropdownRef}>
	<button
		class="selector-button"
		class:open={isOpen}
		onclick={() => isOpen = !isOpen}
		type="button"
	>
		{#if selectedChild}
			<span class="child-icon">👶</span>
			<span class="child-name">{selectedChild.name}</span>
			<span class="child-age">{calculateAge(selectedChild.date_of_birth)}</span>
			{#if selectedChild.parents.length > 1}
				<span class="shared-badge" title={m.share_shared_with_partner()}>👥</span>
			{/if}
		{:else}
			<span class="child-icon">👶</span>
			<span class="placeholder">{m.child_selector_placeholder()}</span>
		{/if}
		<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<polyline points="6 9 12 15 18 9"/>
		</svg>
	</button>

	{#if isOpen}
		<div class="dropdown">
			{#if children.length > 0}
				<div class="dropdown-section">
					{#each children as child (child.id)}
						<div
							class="dropdown-item"
							class:selected={child.id === selectedChildId}
							onclick={() => handleSelect(child.id)}
							onkeydown={(e) => e.key === 'Enter' && handleSelect(child.id)}
							role="button"
							tabindex="0"
						>
							<div class="item-content">
								<span class="item-name">{child.name}</span>
								<span class="item-age">{calculateAge(child.date_of_birth)}</span>
								{#if child.parents.length > 1}
									<span class="shared-badge small">👥</span>
								{/if}
							</div>
							{#if child.id === selectedChildId}
								<button
									class="manage-btn"
									onclick={(e) => handleManage(e, child)}
									title={m.child_manage()}
									type="button"
								>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<circle cx="12" cy="12" r="3"/>
										<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
									</svg>
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<div class="dropdown-divider"></div>

			<button
				class="dropdown-item add-child"
				onclick={() => { onAddChild(); isOpen = false; }}
				type="button"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19"/>
					<line x1="5" y1="12" x2="19" y2="12"/>
				</svg>
				{m.child_add()}
			</button>
		</div>
	{/if}
</div>

<style>
	.child-selector {
		position: relative;
	}

	.selector-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: white;
		border: 1px solid #e8dfd3;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		color: #3d3425;
		transition: all 0.2s ease;
	}

	.selector-button:hover {
		border-color: #c47a4e;
	}

	.selector-button.open {
		border-color: #c47a4e;
		box-shadow: 0 0 0 3px rgba(196, 122, 78, 0.1);
	}

	.child-icon {
		font-size: 1rem;
	}

	.child-name {
		font-weight: 500;
	}

	.child-age {
		color: #8b7355;
		font-size: 0.85rem;
	}

	.placeholder {
		color: #8b7355;
	}

	.shared-badge {
		font-size: 0.85rem;
	}

	.shared-badge.small {
		font-size: 0.75rem;
	}

	.chevron {
		width: 16px;
		height: 16px;
		color: #8b7355;
		transition: transform 0.2s ease;
	}

	.selector-button.open .chevron {
		transform: rotate(180deg);
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 4px;
		background: white;
		border: 1px solid #e8dfd3;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		min-width: 220px;
		z-index: 100;
		overflow: hidden;
	}

	.dropdown-section {
		padding: 0.5rem 0;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.625rem 1rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		font-size: 0.9rem;
		color: #3d3425;
		transition: background 0.15s ease;
	}

	.dropdown-item:hover {
		background: #f5f0e8;
	}

	.dropdown-item.selected {
		background: #faf7f3;
	}

	.item-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.item-name {
		font-weight: 500;
	}

	.item-age {
		color: #8b7355;
		font-size: 0.85rem;
	}

	.manage-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: none;
		border: 1px solid transparent;
		border-radius: 6px;
		cursor: pointer;
		color: #8b7355;
		transition: all 0.15s ease;
	}

	.manage-btn:hover {
		background: white;
		border-color: #e8dfd3;
		color: #c47a4e;
	}

	.manage-btn svg {
		width: 16px;
		height: 16px;
	}

	.dropdown-divider {
		height: 1px;
		background: #e8dfd3;
		margin: 0;
	}

	.dropdown-item.add-child {
		gap: 0.5rem;
		color: #c47a4e;
		font-weight: 500;
	}

	.dropdown-item.add-child svg {
		width: 18px;
		height: 18px;
	}
</style>
