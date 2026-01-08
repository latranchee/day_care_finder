<script lang="ts">
	import type { AddressSuggestion, AddressDetails } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	interface Props {
		value: string | undefined;
		id?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		onSelect?: (address: AddressDetails) => void;
	}

	let {
		value = $bindable(''),
		id = 'address',
		placeholder = '',
		required = false,
		disabled = false,
		onSelect
	}: Props = $props();

	// Ensure value is always a string
	const inputValue = $derived(value ?? '');

	let suggestions = $state<AddressSuggestion[]>([]);
	let isOpen = $state(false);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let selectedIndex = $state(-1);
	let inputRef: HTMLInputElement | undefined = $state();
	let containerRef: HTMLDivElement | undefined = $state();
	let debounceTimer: ReturnType<typeof setTimeout>;

	const language = $derived(getLocale());

	async function fetchSuggestions(searchTerm: string, lastId?: string) {
		if (searchTerm.length < 3) {
			suggestions = [];
			isOpen = false;
			return;
		}

		isLoading = true;
		error = null;

		try {
			const params = new URLSearchParams({
				q: searchTerm,
				lang: language
			});
			if (lastId) {
				params.set('lastId', lastId);
			}

			const response = await fetch(`/api/address/find?${params}`);
			const data = await response.json();

			if (data.error) {
				error = data.error;
				suggestions = [];
			} else {
				suggestions = data.suggestions;
				isOpen = suggestions.length > 0;
				selectedIndex = -1;
			}
		} catch {
			error = m.address_fetch_error();
			suggestions = [];
		} finally {
			isLoading = false;
		}
	}

	async function retrieveAddress(suggestionId: string): Promise<AddressDetails | null> {
		isLoading = true;
		try {
			const response = await fetch(`/api/address/retrieve?id=${encodeURIComponent(suggestionId)}`);
			const data = await response.json();

			if (data.error || !data.address) {
				error = data.error || m.address_retrieve_error();
				return null;
			}

			return data.address;
		} catch {
			error = m.address_retrieve_error();
			return null;
		} finally {
			isLoading = false;
		}
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;

		clearTimeout(debounceTimer);

		debounceTimer = setTimeout(() => {
			fetchSuggestions(target.value);
		}, 300);
	}

	async function handleSelect(suggestion: AddressSuggestion) {
		if (suggestion.next === 'Find') {
			await fetchSuggestions(suggestion.text, suggestion.id);
		} else {
			const address = await retrieveAddress(suggestion.id);
			if (address) {
				value = address.formatted;
				isOpen = false;
				suggestions = [];
				onSelect?.(address);
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen || suggestions.length === 0) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				break;
			case 'Enter':
				e.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
					handleSelect(suggestions[selectedIndex]);
				}
				break;
			case 'Escape':
				isOpen = false;
				suggestions = [];
				selectedIndex = -1;
				break;
		}
	}

	function handleBlur() {
		setTimeout(() => {
			if (containerRef && !containerRef.contains(document.activeElement)) {
				isOpen = false;
			}
		}, 200);
	}

	function handleFocus() {
		if (suggestions.length > 0) {
			isOpen = true;
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (containerRef && !containerRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	function highlightText(text: string, highlight: string): string {
		if (!highlight) return text;
		const ranges = highlight.split(',').map((r) => r.split('-').map(Number));
		let result = '';
		let lastEnd = 0;

		for (const [start, end] of ranges) {
			result += text.slice(lastEnd, start);
			result += `<mark>${text.slice(start, end + 1)}</mark>`;
			lastEnd = end + 1;
		}
		result += text.slice(lastEnd);

		return result;
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="address-autocomplete" bind:this={containerRef}>
	<div class="input-wrapper">
		<input
			bind:this={inputRef}
			type="text"
			{id}
			value={inputValue}
			{placeholder}
			{required}
			{disabled}
			autocomplete="off"
			oninput={handleInput}
			onkeydown={handleKeydown}
			onblur={handleBlur}
			onfocus={handleFocus}
			aria-expanded={isOpen}
			aria-haspopup="listbox"
			aria-autocomplete="list"
			aria-controls="{id}-listbox"
			role="combobox"
		/>
		{#if isLoading}
			<div class="loading-indicator">
				<svg class="spinner" viewBox="0 0 24 24">
					<circle
						cx="12"
						cy="12"
						r="10"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-dasharray="60"
						stroke-dashoffset="20"
					/>
				</svg>
			</div>
		{/if}
	</div>

	{#if isOpen && suggestions.length > 0}
		<ul class="suggestions-list" role="listbox" id="{id}-listbox">
			{#each suggestions as suggestion, index (suggestion.id)}
				<li
					class="suggestion-item"
					class:selected={index === selectedIndex}
					class:has-children={suggestion.next === 'Find'}
					role="option"
					aria-selected={index === selectedIndex}
					onclick={() => handleSelect(suggestion)}
					onkeydown={(e) => e.key === 'Enter' && handleSelect(suggestion)}
					tabindex="-1"
				>
					<div class="suggestion-content">
						<span class="suggestion-text">
							{@html highlightText(suggestion.text, suggestion.highlight)}
						</span>
						{#if suggestion.description}
							<span class="suggestion-description">{suggestion.description}</span>
						{/if}
					</div>
					{#if suggestion.next === 'Find'}
						<svg
							class="expand-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="9 18 15 12 9 6" />
						</svg>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	{#if error}
		<div class="error-message">{error}</div>
	{/if}
</div>

<style>
	.address-autocomplete {
		position: relative;
		width: 100%;
	}

	.input-wrapper {
		position: relative;
	}

	.input-wrapper input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		padding-right: 2.5rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.95rem;
		background: white;
		color: var(--text-primary);
		transition: border-color 0.15s ease;
	}

	.input-wrapper input::placeholder {
		color: #bbb;
	}

	.input-wrapper input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.loading-indicator {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-secondary);
	}

	.spinner {
		width: 18px;
		height: 18px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.suggestions-list {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin: 4px 0 0;
		padding: 0.5rem 0;
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		list-style: none;
		max-height: 300px;
		overflow-y: auto;
		z-index: 100;
	}

	.suggestion-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 1rem;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.suggestion-item:hover,
	.suggestion-item.selected {
		background: #f5f0e8;
	}

	.suggestion-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.suggestion-text {
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	.suggestion-text :global(mark) {
		background: rgba(196, 122, 78, 0.2);
		color: inherit;
		padding: 0 1px;
		border-radius: 2px;
	}

	.suggestion-description {
		font-size: 0.8rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.expand-icon {
		width: 16px;
		height: 16px;
		color: var(--text-secondary);
		flex-shrink: 0;
		margin-left: 0.5rem;
	}

	.error-message {
		font-size: 0.8rem;
		color: #c44e4e;
		margin-top: 0.25rem;
	}
</style>
