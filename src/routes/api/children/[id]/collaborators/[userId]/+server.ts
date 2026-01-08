import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserRoleForChild, removeUserFromChild } from '$lib/server/db';
import { requireAuth, requireChildAccess } from '$lib/server/authorization';

export const DELETE: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const childId = parseInt(event.params.id);
	const targetUserId = parseInt(event.params.userId);

	if (isNaN(childId) || isNaN(targetUserId)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	requireChildAccess(user.id, childId);

	// Only owners can remove collaborators
	const userRole = getUserRoleForChild(user.id, childId);
	if (userRole !== 'owner') {
		return json({ error: 'Only the owner can remove collaborators' }, { status: 403 });
	}

	// Cannot remove yourself if you're the owner
	if (targetUserId === user.id) {
		return json({ error: 'You cannot remove yourself as the owner' }, { status: 400 });
	}

	// Check that target user is a collaborator (not owner)
	const targetRole = getUserRoleForChild(targetUserId, childId);
	if (targetRole !== 'collaborator') {
		return json({ error: 'User is not a collaborator' }, { status: 400 });
	}

	const removed = removeUserFromChild(targetUserId, childId);
	if (!removed) {
		return json({ error: 'Failed to remove collaborator' }, { status: 500 });
	}

	return json({ success: true });
};
