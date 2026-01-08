import type { RequestHandler } from './$types';
import { getAllDaycaresByChildId, getChildrenByUserId, createDaycare } from '$lib/server/db';
import { success, created, badRequest } from '$lib/server/api-utils';
import { requireAuth, requireChildAccess } from '$lib/server/authorization';
import type { DaycareInput, Daycare } from '$lib/types';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);

	// Get all children the user has access to
	const children = getChildrenByUserId(user.id);

	// Get daycares for all those children
	const allDaycares: Daycare[] = children.flatMap(child => getAllDaycaresByChildId(child.id));

	return success(allDaycares);
};

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const input: DaycareInput = await event.request.json();

	if (!input.name || input.name.trim() === '') {
		badRequest('Name is required');
	}

	// If a child_id is specified, verify the user has access to that child
	if (input.child_id !== undefined && input.child_id !== null) {
		requireChildAccess(user.id, input.child_id);
	}

	const daycare = createDaycare(input);
	return created(daycare);
};
