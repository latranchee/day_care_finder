import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getActiveInvitationByChildId, createInvitation, revokeInvitation } from '$lib/server/db';
import { requireAuth, requireChildAccess } from '$lib/server/authorization';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const childId = parseInt(event.params.id);

	if (isNaN(childId)) {
		return json({ error: 'Invalid child ID' }, { status: 400 });
	}

	requireChildAccess(user.id, childId);

	const invitation = getActiveInvitationByChildId(childId);
	return json(invitation);
};

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const childId = parseInt(event.params.id);

	if (isNaN(childId)) {
		return json({ error: 'Invalid child ID' }, { status: 400 });
	}

	requireChildAccess(user.id, childId);

	const invitation = createInvitation(childId, user.id);
	return json(invitation, { status: 201 });
};

export const DELETE: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const childId = parseInt(event.params.id);

	if (isNaN(childId)) {
		return json({ error: 'Invalid child ID' }, { status: 400 });
	}

	requireChildAccess(user.id, childId);

	const invitation = getActiveInvitationByChildId(childId);
	if (!invitation) {
		return json({ error: 'No active invitation found' }, { status: 404 });
	}

	revokeInvitation(invitation.id);
	return json({ success: true });
};
