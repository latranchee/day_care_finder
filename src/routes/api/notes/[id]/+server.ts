import type { RequestHandler } from './$types';
import { deleteNote, getNoteById } from '$lib/server/db';
import { parseIdParam } from '$lib/server/validation';
import { deleted, notFound } from '$lib/server/api-utils';
import { requireAuth, requireDaycareAccess } from '$lib/server/authorization';

export const DELETE: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const noteId = parseIdParam(event.params);

	// Get the note to find its daycare
	const note = getNoteById(noteId);
	if (!note) {
		notFound('Note');
	}

	// Verify user has access to this note's daycare's child
	requireDaycareAccess(user.id, note.daycare_id);

	deleteNote(noteId);
	return deleted();
};
