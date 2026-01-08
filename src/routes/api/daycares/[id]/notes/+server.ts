import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getNotesByDaycareId, createNote } from '$lib/server/db';
import { parseIdParam, requireDaycare, requireNonEmptyString } from '$lib/server/validation';

export const GET: RequestHandler = async ({ params }) => {
	const daycareId = parseIdParam(params);
	requireDaycare(daycareId);

	const notes = getNotesByDaycareId(daycareId);
	return json(notes);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const daycareId = parseIdParam(params);
	requireDaycare(daycareId);

	const { content, username } = await request.json();
	const trimmedContent = requireNonEmptyString(content, 'Content');

	const note = createNote(daycareId, trimmedContent, username?.trim() || undefined);
	return json(note, { status: 201 });
};
