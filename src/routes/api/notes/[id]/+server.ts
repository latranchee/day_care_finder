import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteNote } from '$lib/server/db';

export const DELETE: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, 'Invalid ID');
	}

	const success = deleteNote(id);
	if (!success) {
		throw error(404, 'Note not found');
	}

	return json({ success: true });
};
