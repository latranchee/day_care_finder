import type { RequestHandler } from './$types';
import { getContactById, updateContact, deleteContact } from '$lib/server/db';
import { parseIdParam } from '$lib/server/validation';
import { success, deleted, notFound } from '$lib/server/api-utils';
import { requireAuth, requireDaycareAccess } from '$lib/server/authorization';

export const PUT: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const id = parseIdParam(event.params);

	const existing = getContactById(id);
	if (!existing) {
		notFound('Contact');
	}

	// Verify user has access to this contact's daycare
	requireDaycareAccess(user.id, existing.daycare_id);

	const { name, role, phone, email, notes, is_primary } = await event.request.json();

	const contact = updateContact(id, {
		name: name?.trim(),
		role: role?.trim(),
		phone: phone?.trim(),
		email: email?.trim(),
		notes: notes?.trim(),
		is_primary
	});

	return success(contact);
};

export const DELETE: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const id = parseIdParam(event.params);

	const existing = getContactById(id);
	if (!existing) {
		notFound('Contact');
	}

	// Verify user has access to this contact's daycare
	requireDaycareAccess(user.id, existing.daycare_id);

	const result = deleteContact(id);
	if (!result) {
		notFound('Contact');
	}

	return deleted();
};
