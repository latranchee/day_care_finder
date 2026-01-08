import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getChildById, updateChild, deleteChild, getParentsByChildId, getUserRoleForChild } from '$lib/server/db';
import { requireAuth, requireChildAccess } from '$lib/server/authorization';
import type { ChildInput } from '$lib/types';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const childId = parseInt(event.params.id);

	if (isNaN(childId)) {
		return json({ error: 'Invalid child ID' }, { status: 400 });
	}

	requireChildAccess(user.id, childId);

	const child = getChildById(childId);
	if (!child) {
		return json({ error: 'Child not found' }, { status: 404 });
	}

	const parents = getParentsByChildId(childId);
	const userRole = getUserRoleForChild(user.id, childId);

	return json({
		...child,
		is_owner: userRole === 'owner',
		parents
	});
};

export const PUT: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const childId = parseInt(event.params.id);

	if (isNaN(childId)) {
		return json({ error: 'Invalid child ID' }, { status: 400 });
	}

	requireChildAccess(user.id, childId);

	const input: Partial<ChildInput> = await event.request.json();

	if (input.date_of_birth) {
		const dob = new Date(input.date_of_birth);
		if (isNaN(dob.getTime())) {
			return json({ error: 'Invalid date of birth' }, { status: 400 });
		}
		if (dob > new Date()) {
			return json({ error: 'Date of birth must be in the past' }, { status: 400 });
		}
	}

	const child = updateChild(childId, input);
	if (!child) {
		return json({ error: 'Child not found' }, { status: 404 });
	}

	return json(child);
};

export const DELETE: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const childId = parseInt(event.params.id);

	if (isNaN(childId)) {
		return json({ error: 'Invalid child ID' }, { status: 400 });
	}

	// Only owners can delete a child
	const userRole = getUserRoleForChild(user.id, childId);
	if (userRole !== 'owner') {
		return json({ error: 'Only the owner can delete a child profile' }, { status: 403 });
	}

	const deleted = deleteChild(childId);
	if (!deleted) {
		return json({ error: 'Child not found' }, { status: 404 });
	}

	return json({ success: true });
};
