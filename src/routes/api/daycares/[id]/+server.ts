import type { RequestHandler } from './$types';
import { updateDaycare, deleteDaycare, moveDaycare } from '$lib/server/db';
import { parseIdParam } from '$lib/server/validation';
import { success, deleted, notFound, validateStage } from '$lib/server/api-utils';
import { requireAuth, requireDaycareAccess } from '$lib/server/authorization';
import type { DaycareInput } from '$lib/types';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const id = parseIdParam(event.params);

	// Verify user has access to this daycare
	const daycare = requireDaycareAccess(user.id, id);
	return success(daycare);
};

export const PUT: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const id = parseIdParam(event.params);

	// Verify user has access to this daycare
	requireDaycareAccess(user.id, id);

	const body = await event.request.json();

	// Check if this is a move operation
	if ('stage' in body && 'position' in body) {
		const validatedStage = validateStage(body.stage);
		const daycare = moveDaycare(id, validatedStage, body.position as number);
		if (!daycare) {
			notFound('Daycare');
		}
		return success(daycare);
	}

	// Otherwise it's a regular update
	const input: Partial<DaycareInput> = body;
	const daycare = updateDaycare(id, input);
	if (!daycare) {
		notFound('Daycare');
	}

	return success(daycare);
};

export const DELETE: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const id = parseIdParam(event.params);

	// Verify user has access to this daycare
	requireDaycareAccess(user.id, id);

	const result = deleteDaycare(id);
	if (!result) {
		notFound('Daycare');
	}

	return deleted();
};
