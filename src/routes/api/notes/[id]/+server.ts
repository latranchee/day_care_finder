import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteNote } from '$lib/server/db';
import { parseIdParam } from '$lib/server/validation';

export const DELETE: RequestHandler = async ({ params }) => {
	const id = parseIdParam(params);

	const success = deleteNote(id);
	if (!success) {
		throw error(404, 'Note not found');
	}

	return json({ success: true });
};
