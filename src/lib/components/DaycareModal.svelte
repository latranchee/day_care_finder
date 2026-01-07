<script lang="ts">
	import type { Daycare, Note, DaycareInput } from '$lib/types';

	interface Props {
		daycare: Daycare | null;
		onClose: () => void;
		onSave: (id: number, data: Partial<DaycareInput>) => void;
		onDelete: (id: number) => void;
	}

	let { daycare, onClose, onSave, onDelete }: Props = $props();

	let isEditing = $state(false);
	let notes = $state<Note[]>([]);
	let newNote = $state('');
	let loadingNotes = $state(false);
	let editForm = $state<Partial<DaycareInput>>({});

	$effect(() => {
		if (daycare) {
			loadNotes();
			editForm = {
				name: daycare.name,
				address: daycare.address,
				phone: daycare.phone,
				website: daycare.website,
				capacity: daycare.capacity,
				price: daycare.price,
				hours: daycare.hours,
				age_range: daycare.age_range,
				rating: daycare.rating
			};
		}
	});

	async function loadNotes() {
		if (!daycare) return;
		loadingNotes = true;
		try {
			const res = await fetch(`/api/daycares/${daycare.id}/notes`);
			notes = await res.json();
		} catch (e) {
			console.error('Failed to load notes:', e);
		}
		loadingNotes = false;
	}

	async function addNote() {
		if (!daycare || !newNote.trim()) return;
		try {
			const res = await fetch(`/api/daycares/${daycare.id}/notes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: newNote.trim() })
			});
			if (res.ok) {
				const note = await res.json();
				notes = [note, ...notes];
				newNote = '';
			}
		} catch (e) {
			console.error('Failed to add note:', e);
		}
	}

	async function deleteNote(noteId: number) {
		try {
			const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
			if (res.ok) {
				notes = notes.filter((n) => n.id !== noteId);
			}
		} catch (e) {
			console.error('Failed to delete note:', e);
		}
	}

	function handleSave() {
		if (daycare) {
			onSave(daycare.id, editForm);
			isEditing = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if daycare}
	<div class="modal-backdrop" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="presentation">
		<div class="modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
			<button class="modal-close" onclick={onClose} aria-label="Close modal">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</button>

			<div class="modal-content">
				<div class="modal-main">
					{#if isEditing}
						<form class="edit-form" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
							<div class="form-group">
								<label for="name">Name</label>
								<input id="name" type="text" bind:value={editForm.name} required />
							</div>

							<div class="form-group">
								<label for="address">Address</label>
								<input id="address" type="text" bind:value={editForm.address} />
							</div>

							<div class="form-row">
								<div class="form-group">
									<label for="phone">Phone</label>
									<input id="phone" type="tel" bind:value={editForm.phone} />
								</div>
								<div class="form-group">
									<label for="website">Website</label>
									<input id="website" type="url" bind:value={editForm.website} />
								</div>
							</div>

							<div class="form-row">
								<div class="form-group">
									<label for="price">Price</label>
									<input id="price" type="text" bind:value={editForm.price} placeholder="e.g., $1,200/mo" />
								</div>
								<div class="form-group">
									<label for="capacity">Capacity</label>
									<input id="capacity" type="number" bind:value={editForm.capacity} />
								</div>
							</div>

							<div class="form-row">
								<div class="form-group">
									<label for="hours">Hours</label>
									<input id="hours" type="text" bind:value={editForm.hours} placeholder="e.g., 7am-6pm" />
								</div>
								<div class="form-group">
									<label for="age_range">Age Range</label>
									<input id="age_range" type="text" bind:value={editForm.age_range} placeholder="e.g., 6mo-5yr" />
								</div>
							</div>

							<div class="form-group">
								<label for="rating">Rating (1-5)</label>
								<input id="rating" type="number" min="1" max="5" step="0.5" bind:value={editForm.rating} />
							</div>

							<div class="form-actions">
								<button type="button" class="btn btn-secondary" onclick={() => isEditing = false}>
									Cancel
								</button>
								<button type="submit" class="btn btn-primary">Save Changes</button>
							</div>
						</form>
					{:else}
						<div class="daycare-details">
							<h2 class="daycare-name">{daycare.name}</h2>

							{#if daycare.rating}
								<div class="rating-display">
									{#each Array(5) as _, i}
										<span class="star" class:filled={i < Math.round(daycare.rating)}>★</span>
									{/each}
									<span class="rating-value">({daycare.rating})</span>
								</div>
							{/if}

							<div class="info-grid">
								{#if daycare.address}
									<div class="info-item">
										<span class="info-label">Address</span>
										<span class="info-value">{daycare.address}</span>
									</div>
								{/if}

								{#if daycare.phone}
									<div class="info-item">
										<span class="info-label">Phone</span>
										<a href="tel:{daycare.phone}" class="info-value link">{daycare.phone}</a>
									</div>
								{/if}

								{#if daycare.website}
									<div class="info-item">
										<span class="info-label">Website</span>
										<a href={daycare.website} target="_blank" rel="noopener" class="info-value link">
											{daycare.website.replace(/^https?:\/\//, '')}
										</a>
									</div>
								{/if}

								{#if daycare.price}
									<div class="info-item">
										<span class="info-label">Price</span>
										<span class="info-value">{daycare.price}</span>
									</div>
								{/if}

								{#if daycare.hours}
									<div class="info-item">
										<span class="info-label">Hours</span>
										<span class="info-value">{daycare.hours}</span>
									</div>
								{/if}

								{#if daycare.capacity}
									<div class="info-item">
										<span class="info-label">Capacity</span>
										<span class="info-value">{daycare.capacity} children</span>
									</div>
								{/if}

								{#if daycare.age_range}
									<div class="info-item">
										<span class="info-label">Ages</span>
										<span class="info-value">{daycare.age_range}</span>
									</div>
								{/if}
							</div>

							<div class="detail-actions">
								<button class="btn btn-secondary" onclick={() => isEditing = true}>
									Edit Details
								</button>
								<button class="btn btn-danger" onclick={() => { if (confirm('Delete this daycare?')) onDelete(daycare!.id); }}>
									Delete
								</button>
							</div>
						</div>
					{/if}
				</div>

				<div class="modal-sidebar">
					<h3 class="notes-title">Notes</h3>

					<div class="note-input">
						<textarea
							bind:value={newNote}
							placeholder="Add a note..."
							rows="3"
						></textarea>
						<button
							class="btn btn-primary btn-sm"
							onclick={addNote}
							disabled={!newNote.trim()}
						>
							Add Note
						</button>
					</div>

					<div class="notes-list">
						{#if loadingNotes}
							<p class="notes-loading">Loading notes...</p>
						{:else if notes.length === 0}
							<p class="notes-empty">No notes yet</p>
						{:else}
							{#each notes as note (note.id)}
								<div class="note-item">
									<p class="note-content">{note.content}</p>
									<div class="note-footer">
										<span class="note-date">{formatDate(note.created_at)}</span>
										<button
											class="note-delete"
											onclick={() => deleteNote(note.id)}
											aria-label="Delete note"
										>
											×
										</button>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(45, 35, 25, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 100;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal {
		--modal-bg: #fffcf8;
		--border-color: #e8dfd3;
		--text-primary: #3d3425;
		--text-secondary: #7a6d5c;
		--accent: #c47a4e;

		background: var(--modal-bg);
		border-radius: 20px;
		box-shadow:
			0 4px 6px rgba(0,0,0,0.05),
			0 20px 40px rgba(45, 35, 25, 0.15);
		width: 100%;
		max-width: 900px;
		max-height: 90vh;
		overflow: hidden;
		position: relative;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 36px;
		height: 36px;
		border: none;
		background: transparent;
		cursor: pointer;
		color: var(--text-secondary);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
		z-index: 10;
	}

	.modal-close:hover {
		background: rgba(0,0,0,0.05);
		color: var(--text-primary);
	}

	.modal-close svg {
		width: 20px;
		height: 20px;
	}

	.modal-content {
		display: flex;
		height: 100%;
		max-height: 90vh;
	}

	.modal-main {
		flex: 1;
		padding: 2rem;
		overflow-y: auto;
	}

	.modal-sidebar {
		width: 320px;
		background: #f8f5f0;
		border-left: 1px solid var(--border-color);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	/* Daycare Details */
	.daycare-name {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
	}

	.rating-display {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		margin-bottom: 1.5rem;
	}

	.star {
		font-size: 1.25rem;
		color: #ddd;
	}

	.star.filled {
		color: var(--accent);
	}

	.rating-value {
		margin-left: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.info-grid {
		display: grid;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
	}

	.info-value {
		font-size: 1rem;
		color: var(--text-primary);
	}

	.info-value.link {
		color: var(--accent);
		text-decoration: none;
	}

	.info-value.link:hover {
		text-decoration: underline;
	}

	.detail-actions {
		display: flex;
		gap: 0.75rem;
	}

	/* Edit Form */
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-group label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.form-group input {
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.95rem;
		background: white;
		color: var(--text-primary);
		transition: border-color 0.15s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	/* Notes */
	.notes-title {
		font-family: 'DM Sans', system-ui, sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
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

	.notes-list {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.notes-loading,
	.notes-empty {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
		padding: 2rem 0;
	}

	.note-item {
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		padding: 0.875rem;
	}

	.note-content {
		font-size: 0.9rem;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		white-space: pre-wrap;
		line-height: 1.5;
	}

	.note-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
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

	/* Buttons */
	.btn {
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-sm {
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
	}

	.btn-primary {
		background: var(--accent);
		color: white;
	}

	.btn-primary:hover {
		background: #b36a42;
	}

	.btn-primary:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #f0ebe4;
		color: var(--text-primary);
	}

	.btn-secondary:hover {
		background: #e8e2d9;
	}

	.btn-danger {
		background: #fae8e8;
		color: #a04444;
	}

	.btn-danger:hover {
		background: #f5d5d5;
	}

	@media (max-width: 768px) {
		.modal-content {
			flex-direction: column;
		}

		.modal-sidebar {
			width: 100%;
			border-left: none;
			border-top: 1px solid var(--border-color);
		}

		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
