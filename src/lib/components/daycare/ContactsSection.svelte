<script lang="ts">
	import type { Contact, ContactInput } from '$lib/types';
	import LoadingSpinner from '../LoadingSpinner.svelte';
	import ListSection from '../ListSection.svelte';
	import PhoneIcon from '../icons/PhoneIcon.svelte';
	import EmailIcon from '../icons/EmailIcon.svelte';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		daycareId: number;
		onContactsChange: () => void;
	}

	let { daycareId, onContactsChange }: Props = $props();

	let contacts = $state<Contact[]>([]);
	let newContact = $state<ContactInput>({ name: '', role: '', phone: '', email: '', notes: '', is_primary: false });
	let loadingContacts = $state(false);
	let isAddingContact = $state(false);
	let showContactForm = $state(false);
	let editingContactId = $state<number | null>(null);
	let editContactForm = $state<ContactInput>({ name: '', role: '', phone: '', email: '', notes: '', is_primary: false });
	let isSavingContact = $state(false);
	let deletingContactId = $state<number | null>(null);
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
			loadContacts();
		}
	});

	async function loadContacts() {
		loadingContacts = true;
		clearError();
		try {
			const res = await fetch(`/api/daycares/${daycareId}/contacts`);
			contacts = await res.json();
		} catch (e) {
			console.error('Failed to load contacts:', e);
			setError(m.error_load_contacts());
		}
		loadingContacts = false;
	}

	async function addContact() {
		if (!newContact.name.trim() || isAddingContact) return;
		isAddingContact = true;
		clearError();
		try {
			const res = await fetch(`/api/daycares/${daycareId}/contacts`, {
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
				onContactsChange();
			} else {
				setError(m.error_add_contact());
			}
		} catch (e) {
			console.error('Failed to add contact:', e);
			setError(m.error_add_contact());
		} finally {
			isAddingContact = false;
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
		if (editingContactId === null || !editContactForm.name?.trim() || isSavingContact) return;
		isSavingContact = true;
		clearError();
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
				onContactsChange();
			} else {
				setError(m.error_update_contact());
			}
		} catch (e) {
			console.error('Failed to update contact:', e);
			setError(m.error_update_contact());
		} finally {
			isSavingContact = false;
		}
	}

	function cancelEditContact() {
		editingContactId = null;
	}

	async function deleteContact(contactId: number) {
		if (deletingContactId !== null) return;
		deletingContactId = contactId;
		clearError();
		try {
			const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
			if (res.ok) {
				contacts = contacts.filter((c) => c.id !== contactId);
				onContactsChange();
			} else {
				setError(m.error_delete_contact());
			}
		} catch (e) {
			console.error('Failed to delete contact:', e);
			setError(m.error_delete_contact());
		} finally {
			deletingContactId = null;
		}
	}
</script>

<h3 class="contacts-title">{m.section_contacts({ count: contacts.length })}</h3>

{#if error}
	<p class="error-message">{error}</p>
{/if}

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
				disabled={!newContact.name.trim() || isAddingContact}
			>
				{#if isAddingContact}
					<LoadingSpinner mode="inline" size="sm" showMessage={false} />
				{:else}
					{m.btn_add_contact()}
				{/if}
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

<ListSection loading={loadingContacts} items={contacts} loadingMessage={m.loading_contacts()} emptyMessage={m.empty_contacts()}>
	{#snippet children(contact)}
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
						<button class="btn btn-sm btn-primary" onclick={saveContact} disabled={!editContactForm.name?.trim() || isSavingContact}>
							{#if isSavingContact}
								<LoadingSpinner mode="inline" size="sm" showMessage={false} />
							{:else}
								{m.btn_save_short()}
							{/if}
						</button>
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
							<PhoneIcon class="contact-icon" size={14} />
							{contact.phone}
						</a>
					{/if}
					{#if contact.email}
						<a href="mailto:{contact.email}" class="contact-info">
							<EmailIcon class="contact-icon" size={14} />
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
						disabled={deletingContactId === contact.id}
						aria-label={m.btn_delete()}
					>
						{#if deletingContactId === contact.id}
							<LoadingSpinner mode="inline" size="sm" showMessage={false} />
						{:else}
							{m.btn_delete()}
						{/if}
					</button>
				</div>
			{/if}
		</div>
	{/snippet}
</ListSection>

<style>
	.contacts-title {
		font-family: 'DM Sans', system-ui, sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
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
		color: var(--danger-color);
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
</style>
