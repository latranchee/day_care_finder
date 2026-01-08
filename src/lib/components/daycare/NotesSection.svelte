<script lang="ts">
	import type { Note } from '$lib/types';
	import { APP_CONFIG } from '$lib/constants';
	import Markdown from '../Markdown.svelte';
	import LoadingSpinner from '../LoadingSpinner.svelte';
	import ListSection from '../ListSection.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { formatDate as formatDateUtil, truncateText } from '$lib/utils/formatting';

	interface User {
		id: number;
		name: string | null;
	}

	interface Props {
		daycareId: number;
		user: User | null;
	}

	let { daycareId, user }: Props = $props();

	let notes = $state<Note[]>([]);
	let newNote = $state('');
	let loadingNotes = $state(false);
	let isAddingNote = $state(false);
	let showNoteForm = $state(false);
	let expandedNotes = $state<Set<number>>(new Set());
	let deletingNoteId = $state<number | null>(null);
	let error = $state<string | null>(null);

	function clearError() {
		error = null;
	}

	function setError(message: string) {
		error = message;
		setTimeout(() => error = null, 5000);
	}

	$effect(() => {
		if (daycareId) {
			loadNotes();
		}
	});

	async function loadNotes() {
		loadingNotes = true;
		clearError();
		try {
			const res = await fetch(`/api/daycares/${daycareId}/notes`);
			notes = await res.json();
		} catch (e) {
			console.error('Failed to load notes:', e);
			setError(m.error_load_notes());
		}
		loadingNotes = false;
	}

	async function addNote() {
		if (!newNote.trim() || isAddingNote || !user) return;
		isAddingNote = true;
		clearError();
		try {
			const res = await fetch(`/api/daycares/${daycareId}/notes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: newNote.trim() })
			});
			if (res.ok) {
				const note = await res.json();
				notes = [note, ...notes];
				newNote = '';
				showNoteForm = false;
			} else {
				setError(m.error_add_note());
			}
		} catch (e) {
			console.error('Failed to add note:', e);
			setError(m.error_add_note());
		} finally {
			isAddingNote = false;
		}
	}

	async function deleteNote(noteId: number) {
		if (deletingNoteId !== null) return;
		deletingNoteId = noteId;
		clearError();
		try {
			const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
			if (res.ok) {
				notes = notes.filter((n) => n.id !== noteId);
			} else {
				setError(m.error_delete_note());
			}
		} catch (e) {
			console.error('Failed to delete note:', e);
			setError(m.error_delete_note());
		} finally {
			deletingNoteId = null;
		}
	}

	function formatDate(dateStr: string): string {
		const locale = getLocale() === 'fr' ? 'fr' : 'en';
		return formatDateUtil(dateStr, locale);
	}

	function isNoteLong(content: string): boolean {
		return content.length > APP_CONFIG.NOTE_PREVIEW_LENGTH;
	}

	function truncateNote(content: string): string {
		return truncateText(content, APP_CONFIG.NOTE_PREVIEW_LENGTH);
	}

	function toggleNoteExpanded(noteId: number) {
		if (expandedNotes.has(noteId)) {
			expandedNotes.delete(noteId);
			expandedNotes = new Set(expandedNotes);
		} else {
			expandedNotes = new Set(expandedNotes.add(noteId));
		}
	}
</script>

<div class="section-header">
	<h3 class="notes-title">{m.section_notes({ count: notes.length })}</h3>
	<p class="privacy-hint">{m.section_notes_hint()}</p>
</div>

{#if error}
	<p class="error-message">{error}</p>
{/if}

{#if user}
	{#if showNoteForm}
		<div class="note-input">
			<textarea
				bind:value={newNote}
				placeholder={m.placeholder_add_note()}
				rows="3"
			></textarea>
			<div class="note-form-actions">
				<button
					class="btn btn-secondary btn-sm"
					onclick={() => { showNoteForm = false; newNote = ''; }}
				>
					{m.btn_cancel()}
				</button>
				<button
					class="btn btn-primary btn-sm"
					onclick={addNote}
					disabled={!newNote.trim() || isAddingNote}
				>
					{#if isAddingNote}
						<LoadingSpinner mode="inline" size="sm" showMessage={false} />
					{:else}
						{m.btn_add_note()}
					{/if}
				</button>
			</div>
		</div>
	{:else}
		<button class="btn btn-secondary btn-sm add-note-btn" onclick={() => showNoteForm = true}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="add-icon">
				<line x1="12" y1="5" x2="12" y2="19"/>
				<line x1="5" y1="12" x2="19" y2="12"/>
			</svg>
			{m.btn_add_note()}
		</button>
	{/if}
{:else}
	<p class="login-required">{m.notes_login_required()}</p>
{/if}

<ListSection loading={loadingNotes} items={notes} loadingMessage={m.loading_notes()} emptyMessage={m.empty_notes()}>
	{#snippet children(note)}
		<div class="note-item">
			<div class="note-content">
				{#if isNoteLong(note.content) && !expandedNotes.has(note.id)}
					<Markdown content={truncateNote(note.content)} />
					<button class="show-more-btn" onclick={() => toggleNoteExpanded(note.id)}>
						{m.btn_show_more()}
					</button>
				{:else}
					<Markdown content={note.content} />
					{#if isNoteLong(note.content)}
						<button class="show-more-btn" onclick={() => toggleNoteExpanded(note.id)}>
							{m.btn_show_less()}
						</button>
					{/if}
				{/if}
			</div>
			<div class="note-footer">
				<span class="note-meta">
					{#if note.username}<span class="note-author">{note.username}</span>{/if}
					<span class="note-date">{formatDate(note.created_at)}</span>
				</span>
				<button
					class="note-delete"
					onclick={() => deleteNote(note.id)}
					disabled={deletingNoteId === note.id}
					aria-label={m.btn_delete()}
				>
					{#if deletingNoteId === note.id}
						<LoadingSpinner mode="inline" size="sm" showMessage={false} />
					{:else}
						&times;
					{/if}
				</button>
			</div>
		</div>
	{/snippet}
</ListSection>

<style>
	.section-header {
		margin-bottom: 1rem;
	}

	.notes-title {
		font-family: 'DM Sans', system-ui, sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.privacy-hint {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin: 0.25rem 0 0 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.privacy-hint::before {
		content: '🔒';
		font-size: 0.7rem;
	}

	.error-message {
		font-size: 0.85rem;
		color: #c44e4e;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 0.75rem;
		margin-bottom: 1rem;
		text-align: center;
	}

	.note-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.note-input textarea {
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.9rem;
		resize: vertical;
		font-family: inherit;
		background: white;
	}

	.note-input textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.note-item {
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		padding: 0.875rem;
	}

	.note-content {
		margin: 0 0 0.5rem 0;
	}

	.note-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.login-required {
		font-size: 0.85rem;
		color: var(--text-secondary);
		text-align: center;
		padding: 0.75rem;
		margin-bottom: 1rem;
		background: #f5f1eb;
		border-radius: 8px;
	}

	.note-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.note-author {
		font-weight: 600;
		color: var(--text-primary);
	}

	.note-author::after {
		content: '\2022';
		margin-left: 0.5rem;
		color: var(--text-secondary);
		font-weight: normal;
	}

	.note-date {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.note-delete {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0 0.25rem;
		line-height: 1;
		opacity: 0.5;
		transition: opacity 0.15s ease;
	}

	.note-delete:hover {
		opacity: 1;
		color: #c44e4e;
	}

	.show-more-btn {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		padding: 0;
		margin-top: 0.25rem;
	}

	.show-more-btn:hover {
		text-decoration: underline;
	}

	.note-form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.add-note-btn {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		margin-bottom: 1rem;
	}

	.add-icon {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
	}
</style>
