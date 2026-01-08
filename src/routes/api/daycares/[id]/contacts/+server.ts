import type { RequestHandler } from './$types';
import { getContactsByDaycareId, createContact } from '$lib/server/db';
import { parseIdParam, requireNonEmptyString } from '$lib/server/validation';
import { success, created } from '$lib/server/api-utils';
import { requireAuth, requireDaycareAccess } from '$lib/server/authorization';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const daycareId = parseIdParam(event.params);

	// Verify user has access to this daycare
	requireDaycareAccess(user.id, daycareId);

	const contacts = getContactsByDaycareId(daycareId);
	return success(contacts);
};

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const daycareId = parseIdParam(event.params);

	// Verify user has access to this daycare
	requireDaycareAccess(user.id, daycareId);

	const { name, role, phone, email, notes, is_primary } = await event.request.json();
	const trimmedName = requireNonEmptyString(name, 'Contact name');

	const contact = createContact(daycareId, {
		name: trimmedName,
		role: role?.trim() || '',
		phone: phone?.trim() || '',
		email: email?.trim() || '',
		notes: notes?.trim() || '',
		is_primary: is_primary || false
	});

	return created(contact);
};
