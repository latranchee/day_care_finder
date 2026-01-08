import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDaycareById, getContactsByDaycareId, createContact } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const daycareId = parseInt(params.id);
	if (isNaN(daycareId)) {
		throw error(400, 'Invalid ID');
	}

	const daycare = getDaycareById(daycareId);
	if (!daycare) {
		throw error(404, 'Daycare not found');
	}

	const contacts = getContactsByDaycareId(daycareId);
	return json(contacts);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const daycareId = parseInt(params.id);
	if (isNaN(daycareId)) {
		throw error(400, 'Invalid ID');
	}

	const daycare = getDaycareById(daycareId);
	if (!daycare) {
		throw error(404, 'Daycare not found');
	}

	const { name, role, phone, email, notes, is_primary } = await request.json();

	if (!name || name.trim() === '') {
		throw error(400, 'Contact name is required');
	}

	const contact = createContact(daycareId, {
		name: name.trim(),
		role: role?.trim() || '',
		phone: phone?.trim() || '',
		email: email?.trim() || '',
		notes: notes?.trim() || '',
		is_primary: is_primary || false
	});

	return json(contact, { status: 201 });
};
