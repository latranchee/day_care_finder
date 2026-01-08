<script lang="ts">
	import type { Daycare, Note, Review, Contact, ContactInput, DaycareInput } from '$lib/types';
	import Markdown from './Markdown.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	interface Props {
		daycare: Daycare | null;
		onClose: () => void;
		onSave: (id: number, data: Partial<DaycareInput>) => void;
		onDelete: (id: number) => void;
		onReviewsChange?: () => void;
	}

	let { daycare, onClose, onSave, onDelete, onReviewsChange }: Props = $props();

	let isEditing = $state(false);
	let notes = $state<Note[]>([]);
	let newNote = $state('');
	let noteUsername = $state('');
	let loadingNotes = $state(false);
	let expandedNotes = $state<Set<number>>(new Set());
	let showNoteForm = $state(false);
	let reviews = $state<Review[]>([]);
	let newReview = $state({ text: '', source_url: '', rating: 5 });
	let loadingReviews = $state(false);
	let showReviewForm = $state(false);
	let contacts = $state<Contact[]>([]);
	let newContact = $state<ContactInput>({ name: '', role: '', phone: '', email: '', notes: '', is_primary: false });
	let loadingContacts = $state(false);
	let editingContactId = $state<number | null>(null);
	let editContactForm = $state<ContactInput>({ name: '', role: '', phone: '', email: '', notes: '', is_primary: false });
	let showContactForm = $state(false);
	let editForm = $state<Partial<DaycareInput>>({});

	$effect(() => {
		if (daycare) {
			loadNotes();
			loadReviews();
			loadContacts();
			editForm = {
				name: daycare.name,
				address: daycare.address,
				phone: daycare.phone,
				email: daycare.email,
				facebook: daycare.facebook,
				website: daycare.website,
				capacity: daycare.capacity,
				price: daycare.price,
				hours: daycare.hours,
				age_range: daycare.age_range
			};
		}
	});

	// Load username from localStorage on mount
	$effect(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('noteUsername');
			if (saved) noteUsername = saved;
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
				body: JSON.stringify({ content: newNote.trim(), username: noteUsername.trim() || undefined })
			});
			if (res.ok) {
				const note = await res.json();
				notes = [note, ...notes];
				newNote = '';
				showNoteForm = false;
				// Save username to localStorage for next time
				if (noteUsername.trim()) {
					localStorage.setItem('noteUsername', noteUsername.trim());
				}
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

	async function loadReviews() {
		if (!daycare) return;
		loadingReviews = true;
		try {
			const res = await fetch(`/api/daycares/${daycare.id}/reviews`);
			reviews = await res.json();
		} catch (e) {
			console.error('Failed to load reviews:', e);
		}
		loadingReviews = false;
	}

	async function addReview() {
		if (!daycare || !newReview.text.trim()) return;
		try {
			const res = await fetch(`/api/daycares/${daycare.id}/reviews`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					text: newReview.text.trim(),
					source_url: newReview.source_url.trim(),
					rating: newReview.rating
				})
			});
			if (res.ok) {
				const review = await res.json();
				reviews = [review, ...reviews];
				newReview = { text: '', source_url: '', rating: 5 };
				showReviewForm = false;
				onReviewsChange?.();
			}
		} catch (e) {
			console.error('Failed to add review:', e);
		}
	}

	async function deleteReview(reviewId: number) {
		try {
			const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
			if (res.ok) {
				reviews = reviews.filter((r) => r.id !== reviewId);
				onReviewsChange?.();
			}
		} catch (e) {
			console.error('Failed to delete review:', e);
		}
	}

	async function loadContacts() {
		if (!daycare) return;
		loadingContacts = true;
		try {
			const res = await fetch(`/api/daycares/${daycare.id}/contacts`);
			contacts = await res.json();
		} catch (e) {
			console.error('Failed to load contacts:', e);
		}
		loadingContacts = false;
	}

	async function addContact() {
		if (!daycare || !newContact.name.trim()) return;
		try {
			const res = await fetch(`/api/daycares/${daycare.id}/contacts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newContact)
			});
			if (res.ok) {
				const contact = await res.json();
				// If new contact is primary, update existing primary contacts in list
				if (contact.is_primary) {
					contacts = contacts.map(c => ({ ...c, is_primary: false }));
				}
				contacts = [contact, ...contacts];
				newContact = { name: '', role: '', phone: '', email: '', notes: '', is_primary: false };
				showContactForm = false;
			}
		} catch (e) {
			console.error('Failed to add contact:', e);
		}
	}

	function startEditContact(contact: Contact) {
		editingContactId = contact.id;
		editContactForm = {
			name: contact.name,
			role: contact.role,
			phone: contact.phone,
			email: contact.email,
			notes: contact.notes,
			is_primary: contact.is_primary
		};
	}

	async function saveContact() {
		if (editingContactId === null || !editContactForm.name?.trim()) return;
		try {
			const res = await fetch(`/api/contacts/${editingContactId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editContactForm)
			});
			if (res.ok) {
				const updated = await res.json();
				// If updated contact is now primary, update existing primary contacts in list
				if (updated.is_primary) {
					contacts = contacts.map(c => c.id === updated.id ? updated : { ...c, is_primary: false });
				} else {
					contacts = contacts.map(c => c.id === updated.id ? updated : c);
				}
				editingContactId = null;
			}
		} catch (e) {
			console.error('Failed to update contact:', e);
		}
	}

	function cancelEditContact() {
		editingContactId = null;
	}

	async function deleteContact(contactId: number) {
		try {
			const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
			if (res.ok) {
				contacts = contacts.filter((c) => c.id !== contactId);
			}
		} catch (e) {
			console.error('Failed to delete contact:', e);
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
		const locale = getLocale() === 'fr' ? 'fr-CA' : 'en-US';
		return new Date(dateStr).toLocaleDateString(locale, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	const NOTE_MAX_LENGTH = 150;

	function isNoteLong(content: string): boolean {
		return content.length > NOTE_MAX_LENGTH;
	}

	function truncateNote(content: string): string {
		if (content.length <= NOTE_MAX_LENGTH) return content;
		return content.slice(0, NOTE_MAX_LENGTH).trim() + '...';
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
								<label for="name">{m.label_name()}</label>
								<input id="name" type="text" bind:value={editForm.name} required />
							</div>

							<div class="form-group">
								<label for="address">{m.label_address()}</label>
								<input id="address" type="text" bind:value={editForm.address} />
							</div>

							<div class="form-row">
								<div class="form-group">
									<label for="phone">{m.label_phone()}</label>
									<input id="phone" type="tel" bind:value={editForm.phone} />
								</div>
								<div class="form-group">
									<label for="email">{m.label_email()}</label>
									<input id="email" type="email" bind:value={editForm.email} />
								</div>
							</div>

							<div class="form-group">
								<label for="website">{m.label_website()}</label>
								<input id="website" type="url" bind:value={editForm.website} />
							</div>

							<div class="form-group">
								<label for="facebook">{m.label_facebook()}</label>
								<input id="facebook" type="url" bind:value={editForm.facebook} placeholder={m.placeholder_facebook()} />
							</div>

							<div class="form-row">
								<div class="form-group">
									<label for="price">{m.label_price()}</label>
									<input id="price" type="text" bind:value={editForm.price} placeholder={m.placeholder_price()} />
								</div>
								<div class="form-group">
									<label for="capacity">{m.label_capacity()}</label>
									<input id="capacity" type="number" bind:value={editForm.capacity} />
								</div>
							</div>

							<div class="form-row">
								<div class="form-group">
									<label for="hours">{m.label_hours()}</label>
									<input id="hours" type="text" bind:value={editForm.hours} placeholder={m.placeholder_hours()} />
								</div>
								<div class="form-group">
									<label for="age_range">{m.label_age_range()}</label>
									<input id="age_range" type="text" bind:value={editForm.age_range} placeholder={m.placeholder_age_range()} />
								</div>
							</div>

							<div class="form-actions">
								<button type="button" class="btn btn-secondary" onclick={() => isEditing = false}>
									{m.btn_cancel()}
								</button>
								<button type="submit" class="btn btn-primary">{m.btn_save()}</button>
							</div>
						</form>
					{:else}
						<div class="daycare-details">
							<div class="details-content">
								<h2 class="daycare-name">{daycare.name}</h2>

								{#if daycare.rating}
									<div class="rating-display">
										{#each Array(5) as _, i}
											<span class="star" class:filled={i < Math.round(daycare.rating)}>★</span>
										{/each}
										<span class="rating-value">({daycare.rating})</span>
									</div>
								{/if}

								<!-- Quick action icons -->
								{#if daycare.phone || daycare.email || daycare.website || daycare.facebook}
									<div class="quick-links">
										{#if daycare.phone}
											<a href="tel:{daycare.phone}" class="quick-link" title={daycare.phone}>
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
												</svg>
											</a>
										{/if}
										{#if daycare.email}
											<a href="mailto:{daycare.email}" class="quick-link" title={daycare.email}>
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
													<polyline points="22,6 12,13 2,6"/>
												</svg>
											</a>
										{/if}
										{#if daycare.website}
											<a href={daycare.website} target="_blank" rel="noopener" class="quick-link" title={daycare.website}>
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<circle cx="12" cy="12" r="10"/>
													<line x1="2" y1="12" x2="22" y2="12"/>
													<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
												</svg>
											</a>
										{/if}
										{#if daycare.facebook}
											<a href={daycare.facebook} target="_blank" rel="noopener" class="quick-link" title="Facebook">
												<svg viewBox="0 0 24 24" fill="currentColor">
													<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
												</svg>
											</a>
										{/if}
									</div>
								{/if}

								<div class="info-grid">
									{#if daycare.address}
										<div class="info-item wide">
											<span class="info-label">{m.label_address()}</span>
											<span class="info-value">{daycare.address}</span>
										</div>
									{/if}

									{#if daycare.price}
										<div class="info-item">
											<span class="info-label">{m.label_price()}</span>
											<span class="info-value">{daycare.price}</span>
										</div>
									{/if}

									{#if daycare.hours}
										<div class="info-item">
											<span class="info-label">{m.label_hours()}</span>
											<span class="info-value">{daycare.hours}</span>
										</div>
									{/if}

									{#if daycare.capacity}
										<div class="info-item">
											<span class="info-label">{m.label_capacity()}</span>
											<span class="info-value">{m.capacity_children({ count: daycare.capacity })}</span>
										</div>
									{/if}

									{#if daycare.age_range}
										<div class="info-item">
											<span class="info-label">{m.label_ages()}</span>
											<span class="info-value">{daycare.age_range}</span>
										</div>
									{/if}
								</div>
							</div>

							<div class="detail-actions">
								<button class="btn btn-secondary" onclick={() => isEditing = true}>
									{m.btn_edit()}
								</button>
								<button class="btn btn-danger" onclick={() => { if (confirm(m.confirm_delete())) onDelete(daycare!.id); }}>
									{m.btn_delete()}
								</button>
							</div>
						</div>
					{/if}
				</div>

				<div class="modal-sidebar">
					<h3 class="notes-title">{m.section_notes({ count: notes.length })}</h3>

					{#if showNoteForm}
						<div class="note-input">
							<input
								type="text"
								bind:value={noteUsername}
								placeholder={m.placeholder_your_name()}
								class="username-input"
							/>
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
									disabled={!newNote.trim()}
								>
									{m.btn_add_note()}
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

					<div class="notes-list">
						{#if loadingNotes}
							<p class="notes-loading">{m.loading_notes()}</p>
						{:else if notes.length === 0}
							<p class="notes-empty">{m.empty_notes()}</p>
						{:else}
							{#each notes as note (note.id)}
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
											aria-label="Delete note"
										>
											×
										</button>
									</div>
								</div>
							{/each}
						{/if}
					</div>

					<div class="section-divider"></div>

					<h3 class="contacts-title">{m.section_contacts({ count: contacts.length })}</h3>

					{#if showContactForm}
						<div class="contact-input">
							<input
								type="text"
								bind:value={newContact.name}
								placeholder={m.placeholder_contact_name()}
								class="contact-field"
							/>
							<input
								type="text"
								bind:value={newContact.role}
								placeholder={m.placeholder_contact_role()}
								class="contact-field"
							/>
								<input
								type="tel"
								bind:value={newContact.phone}
								placeholder={m.label_phone()}
								class="contact-field"
							/>
							<input
								type="email"
								bind:value={newContact.email}
								placeholder={m.label_email()}
								class="contact-field"
							/>
							<textarea
								bind:value={newContact.notes}
								placeholder={m.placeholder_contact_notes()}
								rows="2"
								class="contact-notes-input"
							></textarea>
							<label class="primary-checkbox">
								<input type="checkbox" bind:checked={newContact.is_primary} />
								{m.primary_contact()}
							</label>
							<div class="contact-form-actions">
								<button
									class="btn btn-secondary btn-sm"
									onclick={() => { showContactForm = false; newContact = { name: '', role: '', phone: '', email: '', notes: '', is_primary: false }; }}
								>
									{m.btn_cancel()}
								</button>
								<button
									class="btn btn-primary btn-sm"
									onclick={addContact}
									disabled={!newContact.name.trim()}
								>
									{m.btn_add_contact()}
								</button>
							</div>
						</div>
					{:else}
						<button class="btn btn-secondary btn-sm add-contact-btn" onclick={() => showContactForm = true}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="add-icon">
								<line x1="12" y1="5" x2="12" y2="19"/>
								<line x1="5" y1="12" x2="19" y2="12"/>
							</svg>
							{m.btn_add_contact()}
						</button>
					{/if}

					<div class="contacts-list">
						{#if loadingContacts}
							<p class="contacts-loading">{m.loading_contacts()}</p>
						{:else if contacts.length === 0}
							<p class="contacts-empty">{m.empty_contacts()}</p>
						{:else}
							{#each contacts as contact (contact.id)}
								<div class="contact-item" class:is-primary={contact.is_primary}>
									{#if editingContactId === contact.id}
										<div class="contact-edit-form">
											<input
												type="text"
												bind:value={editContactForm.name}
												placeholder={m.placeholder_name_required()}
												class="contact-field"
											/>
											<input
												type="text"
												bind:value={editContactForm.role}
												placeholder={m.placeholder_role()}
												class="contact-field"
											/>
											<input
												type="tel"
												bind:value={editContactForm.phone}
												placeholder={m.label_phone()}
												class="contact-field"
											/>
											<input
												type="email"
												bind:value={editContactForm.email}
												placeholder={m.label_email()}
												class="contact-field"
											/>
											<textarea
												bind:value={editContactForm.notes}
												placeholder={m.placeholder_notes()}
												rows="2"
												class="contact-notes-input"
											></textarea>
											<label class="primary-checkbox">
												<input type="checkbox" bind:checked={editContactForm.is_primary} />
												{m.primary_contact()}
											</label>
											<div class="contact-edit-actions">
												<button class="btn btn-sm btn-secondary" onclick={cancelEditContact}>{m.btn_cancel()}</button>
												<button class="btn btn-sm btn-primary" onclick={saveContact} disabled={!editContactForm.name?.trim()}>{m.btn_save_short()}</button>
											</div>
										</div>
									{:else}
										<div class="contact-header">
											<div class="contact-name-row">
												<span class="contact-name">{contact.name}</span>
												{#if contact.is_primary}
													<span class="primary-badge">{m.primary()}</span>
												{/if}
											</div>
											{#if contact.role}
												<span class="contact-role">{contact.role}</span>
											{/if}
										</div>
										<div class="contact-details">
											{#if contact.phone}
												<a href="tel:{contact.phone}" class="contact-info">
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="contact-icon">
														<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
													</svg>
													{contact.phone}
												</a>
											{/if}
											{#if contact.email}
												<a href="mailto:{contact.email}" class="contact-info">
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="contact-icon">
														<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
														<polyline points="22,6 12,13 2,6"/>
													</svg>
													{contact.email}
												</a>
											{/if}
										</div>
										{#if contact.notes}
											<p class="contact-notes">{contact.notes}</p>
										{/if}
										<div class="contact-footer">
											<button class="contact-edit" onclick={() => startEditContact(contact)} aria-label={m.btn_edit_short()}>
												{m.btn_edit_short()}
											</button>
											<button
												class="contact-delete"
												onclick={() => deleteContact(contact.id)}
												aria-label={m.btn_delete()}
											>
												{m.btn_delete()}
											</button>
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</div>

					<div class="section-divider"></div>

					<h3 class="reviews-title">{m.section_reviews({ count: reviews.length })}</h3>

					{#if showReviewForm}
						<div class="review-input">
							<div class="rating-input">
								<label>{m.label_rating()}</label>
								<div class="star-selector">
									{#each [1, 2, 3, 4, 5] as star}
										<button
											type="button"
											class="star-btn"
											class:filled={star <= newReview.rating}
											onclick={() => newReview.rating = star}
										>
											★
										</button>
									{/each}
								</div>
							</div>

							<textarea
								bind:value={newReview.text}
								placeholder={m.placeholder_write_review()}
								rows="3"
							></textarea>

							<input
								type="url"
								bind:value={newReview.source_url}
								placeholder={m.placeholder_source_url()}
							/>

							<div class="review-form-actions">
								<button
									class="btn btn-secondary btn-sm"
									onclick={() => { showReviewForm = false; newReview = { text: '', source_url: '', rating: 5 }; }}
								>
									{m.btn_cancel()}
								</button>
								<button
									class="btn btn-primary btn-sm"
									onclick={addReview}
									disabled={!newReview.text.trim()}
								>
									{m.btn_add_review()}
								</button>
							</div>
						</div>
					{:else}
						<button class="btn btn-secondary btn-sm add-review-btn" onclick={() => showReviewForm = true}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="add-icon">
								<line x1="12" y1="5" x2="12" y2="19"/>
								<line x1="5" y1="12" x2="19" y2="12"/>
							</svg>
							{m.btn_add_review()}
						</button>
					{/if}

					<div class="reviews-list">
						{#if loadingReviews}
							<p class="reviews-loading">{m.loading_reviews()}</p>
						{:else if reviews.length === 0}
							<p class="reviews-empty">{m.empty_reviews()}</p>
						{:else}
							{#each reviews as review (review.id)}
								<div class="review-item">
									<div class="review-header">
										<span class="review-stars">
											{#each Array(5) as _, i}
												<span class="star" class:filled={i < review.rating}>★</span>
											{/each}
										</span>
										{#if review.source_url}
											<a href={review.source_url} target="_blank" rel="noopener" class="review-link">
												{m.btn_view_source()}
											</a>
										{/if}
									</div>
									<p class="review-content">{review.text}</p>
									<div class="review-footer">
										<span class="review-date">{formatDate(review.created_at)}</span>
										<button
											class="review-delete"
											onclick={() => deleteReview(review.id)}
											aria-label="Delete review"
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
	.daycare-details {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.details-content {
		flex: 1;
	}

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
		margin-bottom: 1rem;
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

	.quick-links {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.quick-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: #f5f1eb;
		color: var(--text-secondary);
		transition: all 0.15s ease;
	}

	.quick-link:hover {
		background: var(--accent);
		color: white;
	}

	.quick-link svg {
		width: 20px;
		height: 20px;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem 1.5rem;
		margin-bottom: 2rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.info-item.wide {
		grid-column: span 2;
	}

	.info-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
	}

	.info-value {
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	.detail-actions {
		display: flex;
		gap: 0.75rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color);
		margin-top: auto;
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
		margin: 0 0 0.5rem 0;
	}

	.note-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.username-input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.85rem;
		background: white;
		color: var(--text-primary);
	}

	.username-input:focus {
		outline: none;
		border-color: var(--accent);
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

	/* Reviews */
	.section-divider {
		height: 1px;
		background: var(--border-color);
		margin: 1.5rem 0;
	}

	.reviews-title {
		font-family: 'DM Sans', system-ui, sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
	}

	.review-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.rating-input {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.rating-input label {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.star-selector {
		display: flex;
		gap: 0.25rem;
	}

	.star-btn {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: #ddd;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s ease;
	}

	.star-btn.filled {
		color: var(--accent);
	}

	.star-btn:hover {
		color: var(--accent);
	}

	.review-input input[type="url"] {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.85rem;
		background: white;
	}

	.review-input input[type="url"]:focus {
		outline: none;
		border-color: var(--accent);
	}

	.review-input textarea {
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.9rem;
		resize: vertical;
		font-family: inherit;
		background: white;
	}

	.review-input textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.reviews-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.reviews-loading,
	.reviews-empty {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
		padding: 2rem 0;
	}

	.review-item {
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		padding: 0.875rem;
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.review-stars {
		display: flex;
		gap: 0.125rem;
	}

	.review-stars .star {
		font-size: 0.875rem;
		color: #ddd;
	}

	.review-stars .star.filled {
		color: var(--accent);
	}

	.review-link {
		font-size: 0.75rem;
		color: var(--accent);
		text-decoration: none;
	}

	.review-link:hover {
		text-decoration: underline;
	}

	.review-content {
		font-size: 0.9rem;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		white-space: pre-wrap;
		line-height: 1.5;
	}

	.review-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.review-date {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.review-delete {
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

	.review-delete:hover {
		opacity: 1;
		color: #c44e4e;
	}

	/* Contacts */
	.contacts-title {
		font-family: 'DM Sans', system-ui, sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
	}

	.contact-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.contact-field {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.85rem;
		background: white;
		color: var(--text-primary);
	}

	.contact-field:focus {
		outline: none;
		border-color: var(--accent);
	}

	.contact-notes-input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.85rem;
		background: white;
		resize: vertical;
		font-family: inherit;
	}

	.contact-notes-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.primary-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
		cursor: pointer;
	}

	.primary-checkbox input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: var(--accent);
	}

	.contacts-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.contacts-loading,
	.contacts-empty {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
		padding: 2rem 0;
	}

	.contact-item {
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		padding: 0.875rem;
	}

	.contact-item.is-primary {
		border-color: var(--accent);
		background: #fffaf6;
	}

	.contact-header {
		margin-bottom: 0.5rem;
	}

	.contact-name-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.contact-name {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.95rem;
	}

	.primary-badge {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: var(--accent);
		color: white;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
	}

	.contact-role {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.contact-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
	}

	.contact-info {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8rem;
		color: var(--accent);
		text-decoration: none;
	}

	.contact-info:hover {
		text-decoration: underline;
	}

	.contact-icon {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
	}

	.contact-notes {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin: 0 0 0.5rem 0;
		font-style: italic;
		line-height: 1.4;
	}

	.contact-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.contact-edit,
	.contact-delete {
		background: none;
		border: none;
		font-size: 0.75rem;
		cursor: pointer;
		padding: 0;
		opacity: 0.6;
		transition: opacity 0.15s ease;
	}

	.contact-edit {
		color: var(--accent);
	}

	.contact-delete {
		color: var(--text-secondary);
	}

	.contact-edit:hover,
	.contact-delete:hover {
		opacity: 1;
	}

	.contact-delete:hover {
		color: #c44e4e;
	}

	.contact-edit-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.contact-edit-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 0.25rem;
	}

	.contact-form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.add-contact-btn {
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

	.review-form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.add-review-btn {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		margin-bottom: 1rem;
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
