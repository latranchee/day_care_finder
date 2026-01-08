import type { RequestHandler } from './$types';
import { getNotesByDaycareId, createNote } from '$lib/server/db';
import { parseIdParam, requireNonEmptyString } from '$lib/server/validation';
import { success, created } from '$lib/server/api-utils';
import { requireAuth, requireDaycareAccess } from '$lib/server/authorization';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const daycareId = parseIdParam(event.params);

	// Verify user has access to this daycare's child
	requireDaycareAccess(user.id, daycareId);

	const notes = getNotesByDaycareId(daycareId);
	return success(notes);
};

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const daycareId = parseIdParam(event.params);

	// Verify user has access to this daycare's child
	requireDaycareAccess(user.id, daycareId);

	const { content } = await event.request.json();
	const trimmedContent = requireNonEmptyString(content, 'Content');
	const username = user.name || user.email;

	const note = createNote(daycareId, trimmedContent, username);
	return created(note);
};
