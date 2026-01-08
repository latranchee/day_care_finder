import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getContactsByDaycareId, createContact } from '$lib/server/db';
import { parseIdParam, requireDaycare, requireNonEmptyString } from '$lib/server/validation';

export const GET: RequestHandler = async ({ params }) => {
	const daycareId = parseIdParam(params);
	requireDaycare(daycareId);

	const contacts = getContactsByDaycareId(daycareId);
	return json(contacts);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const daycareId = parseIdParam(params);
	requireDaycare(daycareId);

	const { name, role, phone, email, notes, is_primary } = await request.json();
	const trimmedName = requireNonEmptyString(name, 'Contact name');

	const contact = createContact(daycareId, {
		name: trimmedName,
		role: role?.trim() || '',
		phone: phone?.trim() || '',
		email: email?.trim() || '',
		notes: notes?.trim() || '',
		is_primary: is_primary || false
	});

	return json(contact, { status: 201 });
};
