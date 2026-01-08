<script lang="ts">
	import type { Daycare, DaycareInput } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	import Modal from './Modal.svelte';
	import PhoneIcon from './icons/PhoneIcon.svelte';
	import EmailIcon from './icons/EmailIcon.svelte';
	import FacebookIcon from './icons/FacebookIcon.svelte';
	import NotesSection from './daycare/NotesSection.svelte';
	import ContactsSection from './daycare/ContactsSection.svelte';
	import ReviewsSection from './daycare/ReviewsSection.svelte';
	import CommentsSection from './daycare/CommentsSection.svelte';
	import AddressAutocomplete from './AddressAutocomplete.svelte';

	interface User {
		id: number;
		email: string;
		name: string | null;
		role: string;
	}

	interface Props {
		daycare: Daycare | null;
		onClose: () => void;
		onSave: (id: number, data: Partial<DaycareInput>) => void;
		onDelete: (id: number) => void;
		onReviewsChange?: () => void;
		user?: User | null;
	}

	let { daycare, onClose, onSave, onDelete, onReviewsChange, user }: Props = $props();

	let isEditing = $state(false);
	let editForm = $state<Partial<DaycareInput>>({});
	let localRating = $state<number | null>(null);

	$effect(() => {
		if (daycare) {
			localRating = daycare.rating;
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

	function handleSave() {
		if (daycare) {
			onSave(daycare.id, editForm);
			isEditing = false;
		}
	}

	function handleRatingUpdate(newRating: number | null) {
		localRating = newRating;
		onReviewsChange?.();
	}

	function handleContactsChange() {
		// Could refresh parent's contact count if needed
	}
</script>

{#if daycare}
	<Modal {onClose} size="lg">
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
							<AddressAutocomplete
								id="address"
								bind:value={editForm.address}
							/>
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

							{#if localRating}
								<div class="rating-display">
									{#each Array(5) as _, i}
										<span class="star" class:filled={i < Math.round(localRating)}>&#9733;</span>
									{/each}
									<span class="rating-value">({localRating})</span>
								</div>
							{/if}

							<!-- Quick action icons -->
							{#if daycare.phone || daycare.email || daycare.website || daycare.facebook || daycare.portal_url}
								<div class="quick-links">
									{#if daycare.phone}
										<a href="tel:{daycare.phone}" class="quick-link" title={daycare.phone}>
											<PhoneIcon size={20} />
										</a>
									{/if}
									{#if daycare.email}
										<a href="mailto:{daycare.email}" class="quick-link" title={daycare.email}>
											<EmailIcon size={20} />
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
											<FacebookIcon size={20} />
										</a>
									{/if}
									{#if daycare.portal_url}
										<a href={daycare.portal_url} target="_blank" rel="noopener" class="quick-link portal-link" title="Portail gouvernemental">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
												<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
												<polyline points="14 2 14 8 20 8"/>
												<line x1="16" y1="13" x2="8" y2="13"/>
												<line x1="16" y1="17" x2="8" y2="17"/>
												<polyline points="10 9 9 9 8 9"/>
											</svg>
										</a>
									{/if}
								</div>
							{/if}

							<!-- Type and subsidized badges -->
							{#if daycare.daycare_type || daycare.subventionne}
								<div class="type-badges">
									{#if daycare.daycare_type}
										<span class="badge badge-type">
											{daycare.daycare_type === 'CPE' ? m.daycare_type_cpe() :
											 daycare.daycare_type === 'Garderie' ? m.daycare_type_garderie() :
											 daycare.daycare_type === 'Milieu familial' ? m.daycare_type_milieu() :
											 daycare.daycare_type}
										</span>
									{/if}
									{#if daycare.subventionne}
										<span class="badge badge-subsidized">{m.subsidized_yes()}</span>
									{/if}
								</div>
							{/if}

							<!-- Description section -->
							{#if daycare.description}
								<div class="description-section">
									<span class="info-label">{m.label_description()}</span>
									<p class="description-text">{daycare.description}</p>
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
										<span class="info-value">
											{m.capacity_children({ count: daycare.capacity })}
											{#if daycare.places_poupons !== null || daycare.places_18_mois_plus !== null}
												<span class="places-breakdown">
													({m.places_breakdown({
														poupons: daycare.places_poupons ?? 0,
														older: daycare.places_18_mois_plus ?? 0
													})})
												</span>
											{/if}
										</span>
									</div>
								{/if}

								{#if daycare.age_range}
									<div class="info-item">
										<span class="info-label">{m.label_ages()}</span>
										<span class="info-value">{daycare.age_range}</span>
									</div>
								{/if}

								{#if daycare.commute_minutes !== null}
									<div class="info-item">
										<span class="info-label">{m.label_commute()}</span>
										<span class="info-value">
											{#if daycare.commute_maps_url}
												<a href={daycare.commute_maps_url} target="_blank" rel="noopener noreferrer" class="commute-link">
													{daycare.commute_minutes} min
													<svg class="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
														<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
														<polyline points="15 3 21 3 21 9"/>
														<line x1="10" y1="14" x2="21" y2="3"/>
													</svg>
												</a>
											{:else}
												{daycare.commute_minutes} min
											{/if}
										</span>
									</div>
								{/if}

								{#if daycare.bureau_coord_name}
									<div class="info-item wide">
										<span class="info-label">{m.label_bureau_coord()}</span>
										<span class="info-value bureau-coord">{daycare.bureau_coord_name}</span>
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

						<div class="section-divider"></div>

						<CommentsSection
							daycareId={daycare.id}
							user={user ? { id: user.id, name: user.name } : null}
						/>
					</div>
				{/if}
			</div>

			<div class="modal-sidebar">
				<NotesSection
					daycareId={daycare.id}
					user={user ? { id: user.id, name: user.name } : null}
				/>

				<div class="section-divider"></div>

				<ContactsSection
					daycareId={daycare.id}
					onContactsChange={handleContactsChange}
				/>

				<div class="section-divider"></div>

				<ReviewsSection
					daycareId={daycare.id}
					onRatingUpdate={handleRatingUpdate}
				/>
			</div>
		</div>
	</Modal>
{/if}

<style>
	/* DaycareModal-specific layout styles - modal shell handled by Modal.svelte */
	.modal-content {
		display: flex;
		min-height: 400px;
	}

	.modal-main {
		flex: 1;
		padding: 2rem;
	}

	.modal-sidebar {
		width: 320px;
		background: #f8f5f0;
		border-left: 1px solid var(--border-color);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
	}

	/* Daycare Details */
	.daycare-details {
		display: flex;
		flex-direction: column;
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

	.type-badges {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.badge-type {
		background: #e8f4f8;
		color: #0369a1;
	}

	.badge-subsidized {
		background: #d1fae5;
		color: #065f46;
	}

	.description-section {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #faf8f5;
		border-radius: 8px;
		border-left: 3px solid var(--accent);
	}

	.description-text {
		margin: 0.5rem 0 0 0;
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--text-primary);
	}

	.places-breakdown {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.bureau-coord {
		color: #6a4a7a;
		font-style: italic;
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

	.quick-link.portal-link {
		background: #e8f4f8;
		color: #0369a1;
	}

	.quick-link.portal-link:hover {
		background: #0369a1;
		color: white;
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

	.info-value .commute-link {
		color: #6a4a7a;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		background: #f0e8f4;
		border-radius: 4px;
		transition: background-color 0.15s ease;
	}

	.info-value .commute-link:hover {
		background: #e0d4ea;
	}

	.info-value .commute-link .external-icon {
		opacity: 0.7;
	}

	.detail-actions {
		display: flex;
		gap: 0.75rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color);
		margin-top: auto;
	}

	/* Edit Form - form-group, form-row, form-actions from shared.css */
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Section divider */
	.section-divider {
		height: 1px;
		background: var(--border-color);
		margin: 1.5rem 0;
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
	}
</style>
