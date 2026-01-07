import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDaycareById, getNotesByDaycareId, createNote } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const daycareId = parseInt(params.id);
	if (isNaN(daycareId)) {
		throw error(400, 'Invalid ID');
	}

	const daycare = getDaycareById(daycareId);
	if (!daycare) {
		throw error(404, 'Daycare not found');
	}

	const notes = getNotesByDaycareId(daycareId);
	return json(notes);
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

	const { content } = await request.json();
	if (!content || content.trim() === '') {
		throw error(400, 'Content is required');
	}

	const note = createNote(daycareId, content.trim());
	return json(note, { status: 201 });
};
