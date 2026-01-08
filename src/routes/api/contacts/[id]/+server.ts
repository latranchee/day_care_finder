import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getContactById, updateContact, deleteContact } from '$lib/server/db';
import { parseIdParam } from '$lib/server/validation';

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = parseIdParam(params);

	const existing = getContactById(id);
	if (!existing) {
		throw error(404, 'Contact not found');
	}

	const { name, role, phone, email, notes, is_primary } = await request.json();

	const contact = updateContact(id, {
		name: name?.trim(),
		role: role?.trim(),
		phone: phone?.trim(),
		email: email?.trim(),
		notes: notes?.trim(),
		is_primary
	});

	return json(contact);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = parseIdParam(params);

	const success = deleteContact(id);
	if (!success) {
		throw error(404, 'Contact not found');
	}

	return json({ success: true });
};
