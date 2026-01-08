import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getNotesByDaycareId, createNote } from '$lib/server/db';
import { parseIdParam, requireDaycare, requireNonEmptyString } from '$lib/server/validation';
import { getSession, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const GET: RequestHandler = async ({ params }) => {
	const daycareId = parseIdParam(params);
	requireDaycare(daycareId);

	const notes = getNotesByDaycareId(daycareId);
	return json(notes);
};

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (!sessionId) {
		throw error(401, 'Login required to add notes');
	}

	const user = getSession(sessionId);
	if (!user) {
		throw error(401, 'Login required to add notes');
	}

	const daycareId = parseIdParam(params);
	requireDaycare(daycareId);

	const { content } = await request.json();
	const trimmedContent = requireNonEmptyString(content, 'Content');
	const username = user.name || user.email;

	const note = createNote(daycareId, trimmedContent, username);
	return json(note, { status: 201 });
};
